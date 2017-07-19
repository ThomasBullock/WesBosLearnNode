const mongoose = require('mongoose');
const Review = mongoose.model('Review');

exports.addReview = async (req, res) => {
	req.body.author = req.user._id; // this id is coming in from the currently logged in user
	req.body.store = req.params.id; // this id is come in from the url
	const newReview = new Review(req.body);
	await newReview.save();
	req.flash('success', 'Review Saved!');
	res.redirect('back');
}