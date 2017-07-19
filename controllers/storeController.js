const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid')

const multerOptions = {
	storage: multer.memoryStorage(),
	fileFilter: function(req, file, next) {
		const isPhoto = file.mimetype.startsWith('image/');
		if(isPhoto) {
			next(null, true) // if first value is null (not an error) that means it worked and the second value is passed along
		} else {
			next({ message: 'That filetype isn\'t allowed!'}, false);
		}
	}
};

exports.homePage = (req, res) => {
	res.render('index');
};

exports.addStore = (req, res) => {
	res.render('editStore', { title: 'Add Store'} )
} 

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
	// check if there is a new file to resize
	if(!req.file) {
		next(); // skip to the next middleware
		return;
	}
	console.log(req.file)
	const extension = req.file.mimetype.split('/')[1];
	req.body.photo = `${uuid.v4()}.${extension}`;
	// now we resize
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`);
	// once we have written the photo to our filesystem, keep going!
	next();
}


exports.createStore = async (req, res) => {
	req.body.author = req.user._id;
  const store = await (new Store(req.body)).save();
  await store.save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
	const page = req.params.page || 1;
	const limit = 4;
	const skip = (page * limit) - limit;
	//1. Query the database for a list of all stores
	const storesPromise = Store
		.find()
		.skip(skip)
		.limit(limit)
		.sort({ created: 'desc' })

	const countPromise = Store.count();
	
	const [stores, count] = await Promise.all([storesPromise, countPromise]) // await the 2 seperate promises

	const pages = Math.ceil(count / limit);

	if(!stores.length && skip) {
		req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`)
		res.redirect(`/stores/page/${pages}`);
		return;
	}
	res.render('stores', { title: 'Stores', stores, page, pages, count });
}

const confirmOwner = (store, user) => {
	if(!store.author.equals(user._id)) {
		throw Error('You must own a store in order to edit it!');
	}
};

exports.editStore = async (req, res) => {
	//1. Find the store given the ID
	const store = await Store.findOne({ _id: req.params.id });
	//2. confirm they are the owner of the store
	confirmOwner(store, req.user);
	//3. Render out the edit form so store
	res.render('editStore', { title: `Edit ${store.name}`, store: store});	
}

exports.updateStore = async (req, res) => {
	// set the location data to be a point
	req.body.location.type = 'Point';	
	// find and update the store
	const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
		new: true, // return the new store instead of the old one
		runValidators: true		
	}).exec();
	req.flash('success', `Successfully updated <strong>${store.name}</strong>.  <a href="/stores/${store.slug}">View Store -></a>` );
	// redirect them the store and tell them it worked
	res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
	// const slug = req.params.slug
	const store = await Store.findOne({slug: req.params.slug }).populate('author reviews');
	if (!store) {
		return next();
	}
	res.render('store', { store, title: store.name } );
}

exports.getStoresByTag = async (req, res) => {
	const tag = req.params.tag
	const tagQuery = tag || { $exists: true };  // if no tag just give me any store that has at least one tag on it
	const tagsPromise = Store.getTagsList(); // create out own static methods that lives on our store model
	const storesPromise = Store.find({ tags: tagQuery });
	const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
	// var tags = result[0];  // not needed destructured above ^
	// var stores = result[1];
	// res.json(stores)
	res.render('tag', { tags: tags, title: 'Tags', tag: tag, stores: stores });
};

exports.searchStores = async (req, res) => {

	const stores = await Store
	// first find stores that match
	.find({
		$text: {
			$search: req.query.q,
		} 
	}, {
		score: { $meta: 'textScore' }
	})
	// then sort them
	.sort({
		score:  { $meta: 'textScore' }
	})
	// limit to only 5 results
	.limit(5);
	res.json(stores);
}

exports.mapStores = async (req, res) => {
	const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
	const q = {
		location: {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates: coordinates
				},
				$maxDistance: 10000 // 10km
			}
		}

	}

	const stores = await Store.find(q).select('slug name description location photo').limit(10);
	res.json(stores);
	// res.json(coordinates);
}

exports.mapPage = (req, res) => {
	res.render('map', { title: 'Map'});
}

exports.heartStore = async (req, res) => {
	const hearts = req.user.hearts.map(obj => obj.toString())
	const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet'; // check if our hearts includes the id that is being posted (already hearted it!?)
	const user = await User.findByIdAndUpdate(req.user._id,
			{ [operator]: { hearts: req.params.id }},   // operator will replace itself with $pull or $addToSet
			{ new: true }		
		);
	res.json(user);
}

exports.getHearts = async (req, res) => {

	// get the storeId's from User
	// my worthless shitruck attempt
	// const stores = await User.find({ _id: req.user._id } ).populate('hearts');
	// console.log(hearts)	
	// retriev the stores from Stores 
	// console.log(Store);
	 const stores = await Store.find({
	 		_id: { $in: req.user.hearts }
	 });
	 res.render('stores', {title: 'Hearted Stores', stores: stores });
}

exports.getTopStores = async (req, res) => {
	const stores = await Store.getTopStores();
	res.render('topStores', { stores, title: 'Top Stores!' } )
	// res.json(stores);
}
