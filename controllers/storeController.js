const mongoose = require('mongoose');
const Store = mongoose.model('Store');
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
  const store = await (new Store(req.body)).save();
  await store.save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
	//1. Query the database for a list of all stores
	const stores = await Store.find();
	res.render('stores', { title: 'Stores', stores: stores });
}

exports.editStore = async (req, res) => {
	//1. Find the store given the ID
	const store = await Store.findOne({ _id: req.params.id });
	//2. confirm they are the owner of the store
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
	const store = await Store.findOne({slug: req.params.slug });
	if (!store) {
		return next();
	}
	res.render('store', { store, title: store.name } );
}
