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
	User.findOne({
		phonenum: req.query.phonenum
	}, 'location profile', function(err, usr) {
		//find closest
		var distance =1000;
		var query = {};

		query.location = {
			$near: {
				$geometry: {
					type: "Point",
					coordinates: [usr.location.coordinates[0], usr.location.coordinates[0]]
				},
				$maxDistance: distance
			}
		}
		var drivers = Driver.find(query, 'profile', function(err, drv) {
			if (err) {
				console.log(err.message);
			}
			console.log(drv.profile);
			return res.send(drv.profile);

		});
		//end find closest
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