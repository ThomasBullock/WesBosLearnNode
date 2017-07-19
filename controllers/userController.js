const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {	
	res.render('login', { title: 'Login Form'} );
};

exports.registerForm = (req, res) => {
	res.render('register', { title: 'Register' });  
};

exports.validateRegister = (req, res, next) => {
	req.sanitizeBody('name');
	req.checkBody('name', 'You must supply a name!').notEmpty();
	req.checkBody('email', 'That Email is not valid!').notEmpty().isEmail();
	req.sanitizeBody('email').normalizeEmail({
		remove_dots: false,
		remove_extension: false,
		gmail_remove_subaddress: false
	});
	req.checkBody('password', 'Password Cannot be blank!').notEmpty();
	req.checkBody('password-confirm', 'Confirmed Password cannot be blank!').notEmpty();
	req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password);

	const errors = req.validationErrors();
	if(errors) {
		req.flash('error', errors.map(err => err.msg));
		res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
		return; // stop the fn from running 
	}
	next(); // there were no errors
};

exports.register = async (req, res, next) => {
	const user = new User({ email: req.body.email, name: req.body.name });
	const register = promisify(User.register, User)   // with promisify if the function is a method on an object we need to bind it 
	await register(user, req.body.password);  // never store a password in the database (we hash it)
	next();  // pass to authController
}

exports.account = (req, res) => {
	res.render('account', { title: 'Edit Your Account' })
}

exports.updateAccount = async (req, res) => {
	const updates ={
		name: req.body.name,
		email: req.body.email
	}

	const user = await User.findOneAndUpdate(
		{ _id: req.user._id },  
		{ $set: updates }, 
		{ new: true, runValidators: true, context: 'query' } 
	);

	req.flash('success', 'Updated the profile!')
	res.redirect('back')
}



