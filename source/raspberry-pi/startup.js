var express = require('express');
var app = express();

var controller = require('./controller');
app.use('/api', controller);

module.exports = app;