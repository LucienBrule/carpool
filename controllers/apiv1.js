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

//promises are horrible
exports.schedule_ride = (req, res) => {
	var pn = req.query.phonenum
	if (pn === undefined || pn === null) {
		return req.send("invalid phonenumber");
	}
	var usr = User.findOne({
		phonenum: pn
	}, 'location profile phonenum').exec();

	usr.then(function(usr) {

			console.log(usr.location);
			var long = usr.location.coordinates[0];
			var lat = usr.location.coordinates[1];

			var query = {};

			query.location = {
				$near: {
					$geometry: {
						type: "Point",
						coordinates: [long, lat]
					},
					$maxDistance: 1000
				}
			}

			var drvr = Driver.findOne(query, 'riders').exec();

			drvr.then(function(drvr) {
				drvr.riders.push(usr.profile.name);
				console.log(drvr.riders);
			}).catch(function(err) {
				console.log(err.message);
			});
		})
		.catch(function(err) {
			console.log(err.message);
		});
}

exports.find_closest = (req, res) => {
	console.log(req.query);
	if ((req.query.lat === undefined) || (req.query.long === undefined)) {
		return res.send('lat long undefined!');
	}
	var distance;
	if (req.query.distance === undefined) {
		distance = 1000;
	} else {
		distance = req.query.distance;
	}
	var query = {};

	query.location = {
		$near: {
			$geometry: {
				type: "Point",
				coordinates: [req.query.long, req.query.lat]
			},
			$maxDistance: distance
		}
	}
	var drivers = Driver.find(query, 'profile', function(err, drv) {
		if (err) {
			console.log(err.message);
		}
		return res.send(drv);

	});
}

//route handlers for rides