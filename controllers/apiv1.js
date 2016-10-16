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
	}, 'location profile phonenum scheduled').exec();

	usr.then(function(usr) {
			if (!((usr.scheduled === null) || (usr.scheduled === undefined))) {
				if (usr.scheduled) {
					return res.send("user already scheduled for a ride");
				}
			}

			console.log(usr.location);
			var long = usr.location.coordinates[0];
			var lat = usr.location.coordinates[1];

			var query = {};

			query.availible = true;
			query.location = {
				$near: {
					$geometry: {
						type: "Point",
						coordinates: [long, lat]
					},
					$maxDistance: 1000
				}
			}

			var drvr = Driver.findOne(query, 'riders profile availible').exec();

			drvr.then(function(drvr) {
				if (drvr === undefined || drvr == null) {
					console.log("no driver found");
					return res.send("no driver could be located");
				}
				if (drvr.riders === null || drvr.riders === undefined) {
					drvr.riders.push(usr.profile.name);
					usr.scheduled = true;
					drvr.save(function(err) {
						if (err) return res.send(err.message);
						console.log("saved!");
					});
					usr.save(function(err) {
						if (err) return res.send(err.message);
						console.log("saved!");
					});
					console.log(drvr.riders);
					return res.send("success");
				}
				if (drvr.riders.length < drvr.profile.numberseats) {
					drvr.riders.push(usr.profile.name);
					usr.scheduled = true;
					if (drvr.riders.length == drvr.profile.numberseats) {
						drvr.availible = false;
					}
					drvr.save(function(err) {
						if (err) return res.send(err.message);
						console.log("saved!");
					});
					usr.save(function(err) {
						if (err) return res.send(err.message);
						console.log("saved!");
					});

					console.log(drvr.riders);
					return res.send("success");
				} else {
					console.log("invalid match formed, retry request");
					console.log(drvr.riders, drvr.riders.length, drvr.profile.numberseats);
					return res.send("failed to add user to ride, try again");
					drvr.availible = false;

				}
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