const express = require('express');
const router = express.Router();

const sqlHandler = require('../services/sql-handler');
const emailHandler = require('../services/email-sender');
const emailReceiver = require('../services/email-receiver');

/* GET home page. */
router.get('/', function(req, res, next) {
	emailHandler.sendEmail();
	// emailReceiver.openInbox();
	// sqlHandler.firstQuery();
	res.render('index', { title: 'Express' });
});

module.exports = router;
