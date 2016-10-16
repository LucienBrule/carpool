'use strict';
const _ = require('lodash');
const async = require('async');
const validator = require('validator');
const request = require('request');
const Driver = require('../models/Driver.js');
const User = require('../models/User.js');
const EventEmitter = require('events');
const version = "0.0.0";

class ApiEvenEmmitter extends EventEmitter {}
const apiEmmiter = new ApiEvenEmmitter();

apiEmmiter.on('event', () => {
	console.log('an event occurred!');
});
apiEmmiter.on('test', (param) => {
	console.log('We saw the event!', param);
});
apiEmmiter.on('car_full', (driver) => {
	console.log("car full: ", driver.profile.name);
	exports.send_car(driver);
});
apiEmmiter.on('car_loiter_timeout', (driver) => {
	console.log("car timeout: ", driver.profile.name);
	exports.send_car(driver);
});
apiEmmiter.on('car_add', (driver) => {
	driver.minutestotimout += 1;
	driver.save();
});

exports.get_route_riders = (req, res) => {
	var drvr = Driver.findOne({
		email: req.query.email
	}).exec();

	drvr.then(function(drvr) {
		if (drvr === null || drvr === undefined) {
			return res.send("no such driver found");
		}
		return res.send(drvr.riders);
	}).catch(function(err) {
		return res.send(err.message);
	});
}
exports.emit_arbitrary_event = (req, res) => {
	apiEmmiter.emit(req.body.event, req.body.param);
}
exports.get_drivers = (req, res) => {
	var dprom = Driver.find().exec();
	dprom.then(function(drvrs) {
			res.send(JSON.stringify(drvrs));
		})
		.catch(function(err) {
			res.send(err.message);
		});
}
exports.assign_rider_to_arbitrary_car = (req, res) => {
	var drvr = Driver.findOne({
		email: req.query.d_email
	}).exec();

	drvr.then(function(drvr) {
		if (drvr === null || drvr === undefined) {
			return res.send("no such driver found");
		}
		if (drvr.currentseats <= 0) {
			return res.send("Cannot add , car is full");
		}
		var usr = Driver.findOne({
			email: req.query.u_email
		}).exec;
		usr.then(function(usr) {
			drvr.riders.push(usr);
			drvr.currentseats--;
			usr.scheduled = true;
			drvr.save();
		});
	}).catch(function(err) {
		return res.send(err);
	});
}


exports.version = (req, res) => {
	apiEmmiter.emit('test', "hello");
	res.send(version);
};
exports.drop_off_car_by_email = (req, res) => {
	drvr = Driver.findOne({
		email: req.query.email
	}).exec();

	drvr.then(function(drvr) {
			if (drvr === null || drvr === undefined) {
				return req.send("No such driver found");
			}
			drvr.ridesgiven += 1;
			drvr.riders = [];
			drvr.currentseats = drvr.profile.numberseats;
			drvr.availible = true;
			drvr.enroute = false;
			drvr.save();
		})
		.catch(function(err) {
			return res.send(err.message);
		});
}
exports.send_car_by_email = (req, res) => {
	drvr = Driver.findOne({
		email: req.query.email
	}).exec();

	drvr.then(function(drvr) {
			if (drvr === null || drvr === undefined) {
				return req.send("No such driver found");
			}
			exports.send_car(drvr);
		})
		.catch(function(err) {
			return res.send(err.message);
		});
}
exports.send_car = (driver) => {
	console.log('Sending car: ', driver.profile.name);
	driver.enroute = true;
	driver.save();
};
//promises are horrible
exports.schedule_ride = (req, res) => {
	var pn = req.query.phonenum
	if (pn === undefined || pn === null) {
		return req.send("invalid phonenumber");
	}
	var usr = User.findOne({
		"phonenum": pn
	}).exec();

	usr.then(function(usr) {
			if (usr === null || usr === undefined) {
				return res.send("no such user found");
			}
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

			var drvr = Driver.findOne(query).exec();

			drvr.then(function(drvr) {
				if (drvr === undefined || drvr == null) {
					console.log("no driver found");
					return res.send("no driver could be located");
				}
				if (drvr.riders === null || drvr.riders === undefined) {
					drvr.riders.push(usr);
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
					apiEmmiter.emit('car_add', drvr);
					return res.send("success");
				}
				if (drvr.riders.length < drvr.profile.numberseats) {
					drvr.riders.push(usr);
					usr.scheduled = true;
					if (drvr.riders.length == drvr.profile.numberseats) {
						drvr.availible = false;
						apiEmmiter.emit('car_full', drvr);

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
					return res.send(JSON.stringify(drvr));
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

exports.find_closest_driver = (req, res) => {
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
exports.find_closest_user = (req, res) => {
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
	var users = User.find(query, 'profile', function(err, drv) {
		if (err) {
			console.log(err.message);
		}
		return res.send(drv);

	});
}

//route handlers for rides