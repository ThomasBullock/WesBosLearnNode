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
	photo: String
});

storeSchema.pre('save', function(next) {  // needs to be proper function not arrow cos we need this
	if(!this.isModified('name')) { // we only want to run this when the name changes
		next(); // skip it
		return // stops the function from running further!
	}
	this.slug = slug(this.name);
	next();	
});

module.exports = mongoose.model('Store', storeSchema);