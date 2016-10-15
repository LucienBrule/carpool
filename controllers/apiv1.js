'use strict';
const _ = require('lodash');
const async = require('async');
const validator = require('validator');
const request = require('request');
const Driver = require('../models/Driver.js');

const version = "0.0.0";

exports.version = (req, res) => {
	res.send(version);
};
exports.getDrivers = (req,res) => {
	console.log("Get drivers..");
	res.send(Driver.find());
	// res.send()
};