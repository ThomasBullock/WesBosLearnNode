const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: 'Please enter a store name!'
	},
	slug: String,
	description: {
		type: String,
		trim: true
	},
	tags: [String],
	created: {
		type: Date,
		default: Date.now
	},
	location: {
		type: {
			type: String,
			default: 'Point'			
		},
		coordinates: [{
			type: Number,
			required: 'You must supply coordinates!'
		}],
		address: {
			type: String,
			required: 'You must supply an address'
		}
	},
	photo: String,
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: 'You must supply an author'
	}
}, {
	toJSON: { virtuals: true },  // by default virtuals dont go into json or obj unless you explicitly state it
	toObject: { virtual: true }
}
);

// Define our indexes
storeSchema.index({
	name: 'text',
	description: 'text'
});

storeSchema.index({ location: '2dsphere' });

storeSchema.pre('save', async function(next) {  // needs to be proper function not arrow cos we need this
	if(!this.isModified('name')) { // we only want to run this when the name changes
		next(); // skip it
		return // stops the function from running further!
	}
  this.slug = slug(this.name);
  // find other stores that have a slug of wes, wes-1, wes-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if(storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } }},
    { $sort: { count: -1 } }
  ]);
}

storeSchema.statics.getTopStores = function() {
	return this.aggregate([  // aggregrate is a query function

		// Lookup Stores and populate their reviews
			{ $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' }},  // from is the same as ref in virtual below (lowercased r and added s ) as is what the actual field is going to be called
		// filter for only items that have 2 or more reviews
			{ $match:  { 'reviews.1': { $exists: true } }}, // places that have only 1 review will be excluded
		// Add the average reviews field
			{ $project: {
				photo: '$$ROOT.photo',
				name: '$$ROOT.name',
				reviews: '$$ROOT.reviews',
				slug: '$$ROOT.slug',
				averageRating: { $avg: '$reviews.rating' } //  $avg and $sum will do math against fields
			} },
		// sort it by our new field, hight reviews first
			{ $sort: { averageRating: -1 } },  // highest to lowest
		// limit to at most 10
			{ $limit: 10 }
	]);  
}

// fin reviews where the stores _id === reviews store property
storeSchema.virtual('reviews', {
	ref: 'Review',  // reference to model see module.exports = mongoose.model('Review', reviewSchema);
	localField: '_id',  // which field on the store?
	foreignField: 'store' // which field on the review?
});

function autopopulate(next) {
	this.populate('reviews');
	next();
}

storeSchema.pre('find', autopopulate);  // whenever we query a store it should populate all the reviews for that store
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);