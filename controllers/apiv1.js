'use strict';
const _ = require('lodash');
const async = require('async');
const validator = require('validator');
const request = require('request');
const Driver = require('../models/Driver.js');
const User = require('../models/User.js');

const version = "0.0.0";

exports.version = (req, res) => {
	res.send(version);
};

exports.schedule_ride = (req, res) => {
	var drivers = Driver.findOne({
		'availible': 'true'
	}, 'profile', function(err, drv) {
		if (err) {
			console.log("error");
		}
		res.setHeader('Content-Type', 'application/json');
		res.send(drv);
	});
	// console.log(drivers);
};

exports.find_closest = (req, res) => {
	var query = {};
	console.log(req.query);
	if((req.query.lat === undefined) || (req.query.long === undefined)){
		return res.send('lat long undefined!');
	}
	query.location = {
		$near: {
			$geometry: {
				type: "Point",
				coordinates: [req.query.lat, req.query.long]
			},
			$maxDistance: 1000
		}
	}
	var drivers = Driver.find(query, 'profile', function(err, drv) {
		if (err) {
			console.log(err.message);
		}
		res.setHeader('Content-Type', 'application/json');
		res.send(drv);
	});
	return drv;
}

//route handlers for rides