const mysql = require('mysql');

const config = require('../config/config');

var connection = mysql.createPool(config);

function handleDisconnect() {
  connection.getConnection(function (err) {              // The server is either down
    if (err) {                                     // or restarting (takes a while sometimes).
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
  //                                      // If you're also serving http, display a 503 error.
  connection.on('error', function (err) {
  	console.log('db error', err);
    handleDisconnect();                         // lost due to either server restart, or a
});
}

handleDisconnect();

var firstQuery = function() {
	connection.query(
		'SELECT DNO,DNAME,DEMAIL,DPASS,DADDR,DPHONE,DWEBSITE,CREATEDON FROM DISTRIBUTOR_LIST',
		function (error, results, fields) {
			if (error) {
				console.log(error);
			}

			console.log(results);
		});
}

module.exports = {
	firstQuery: firstQuery
}