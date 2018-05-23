var express = require('express');
var path = require('path');

var app = express();
app.use('/', express.static(path.join(__dirname, 'public')));

// Error handler
app.use(function(err, req, res, next) {
	res.status(500);
	res.send({
		message: err.message
	});
});

module.exports = app;