"use strict";
var nodemailer = require("nodemailer");
var ejs = require('ejs');


const config = require('../config/email-sen-config');

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport(config);

var sendEmail = function() {
	// send mail with defined transport object

	var mailOptions = {
		from: 'bits-noreply@burhanisolutions.com.pk',
		to: 'tahir60652@gmail.com',
		html: '<h3>Hello World?</h3><br><br><h4>What is your problem?</h4>',
		subject: 'Hello World'
	};

	var info = transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
			console.log("Message sent: %s", info.messageId);
				// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
			}
			res.end();
	});		  

}

module.exports = {
	sendEmail: sendEmail
};
