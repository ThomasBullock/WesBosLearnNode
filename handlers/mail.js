const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

// create a transport

const transport = nodemailer.createTransport({
	host: process.env.MAIL_HOST,
	port: process.env.MAIL_PORT,
	auth: {
		user: process.env.MAIL_USER,
		pass: process.env.MAIL_PASS
	}
});

const generateHTML = (filename, options = {}) => { // not needed outsise mail.js so just a function (no exports)
	// console.log(filename);
	const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options); // send options object to the pug file
	const inlined = juice(html);
	return inlined;
}

exports.send = async (options) => {
	console.log(options);
	const html = generateHTML(options.filename, options);
	const text = htmlToText.fromString(html)
	const mailOptions = {
		from: `Wes Bos <noreply@wesbos.com>`,
		to: options.user.email,
		subject: options.subject,
		html: html,
		text: text
	};
	const sendMail = promisify(transport.sendMail, transport);
	return sendMail(mailOptions);
}

// transport.sendMail({
// 	from: 'Thomas Bullock <motbollox@gmail.com>',
// 	to: 'randy@example.com',
// 	subject: 'Just trying things out!',
// 	html: 'Hey I <strong>love</strong> you',
// 	text: 'Hey I **love you** '
// });
