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
	module.exports.send_car(driver);
});
apiEmmiter.on('car_loiter_timeout', (driver) => {
	console.log("car timeout: ", driver.profile.name);
	module.exports.send_car(driver);
});
apiEmmiter.on('car_add', (driver) => {
	driver.minutestotimout += 1;
	driver.save();
});

module.exports.get_route_riders = function(req, res) {
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
module.exports.emit_arbitrary_event = function(req, res) {
	console.log("Emitting arbitrary event...", req.body.event, req.body.param);
	return res.send(apiEmmiter.emit(req.body.event, req.body.param));
}

module.exports._get_drivers = function() {
	var dprom = Driver.find().exec();
	return dprom.then(function(drvrs) {
			return drvrs;
		})
		.catch(function(err) {
			return err;
		});
}

module.exports.get_drivers = function(req, res) {
	var dprom = Driver.find().exec();
	dprom.then(function(drvrs) {
			res.send(JSON.stringify(drvrs));
		})
		.catch(function(err) {
			res.send(err.message);
		});
}

module.exports._get_users = function () {
	var dprom = User.find().exec();
	return dprom.then(function(usrs) {
			return usrs;
		})
		.catch(function(err) {
			return err;
		});

}

module.exports.get_users = function (req, res) {
	var dprom = User.find().exec();
	dprom.then(function(usrs) {
			res.send(JSON.stringify(usrs));
		})
		.catch(function(err) {
			res.send(err.message);
		});

}
module.exports.assign_rider_to_arbitrary_car = function(req, res) {
	var drvr = Driver.findOne({
		email: req.query.d_email
	}).exec();

	drvr.then(function(drv) {
		if (drv === null || drv === undefined) {
			return res.send("no such driver found");
		}
		if (drvr.currentseats <= 0) {
			return res.send("Cannot add , car is full");
		}
		var usr = User.findOne({
			email: req.query.u_email
		}).exec();
		usr.then(function(usr) {
			if (usr === null || usr === undefined) {
				return res.send("no such user found");
			}
			drv.riders.push(usr);
			drv.currentseats--;
			usr.scheduled = true;
			drv.save();
			// console.log("Added");
			return res.send(JSON.stringify(drv));
		}).catch(function(err) {
			return res.send(err.message);
		});
	}).catch(function(err) {
		return res.send(err.message);
	});
}


module.exports.version = function(req, res) {
	apiEmmiter.emit('test', "hello");
	res.send(version);
};
module.exports.drop_off_car_by_email = function(req, res) {
	var drvr = Driver.findOne({
		email: req.query.email
	}).exec();

	drvr.then(function(drvr) {
			if (drvr === null || drvr === undefined) {
				return res.send("No such driver found");
			}
			drvr.ridesgiven += 1;
			drvr.riders = [];
			drvr.currentseats = drvr.profile.numberseats;
			drvr.availible = true;
			drvr.enroute = false;
			drvr.save();
			return res.send(JSON.stringify(drvr));
		})
		.catch(function(err) {
			return res.send(err.message);
		});
}

module.exports.send_car_by_email = function(req, res) {
	var drvr = Driver.findOne({
		email: req.query.email
	}).exec();

	drvr.then(function(drvr) {
			if (drvr === null || drvr === undefined) {
				return res.send("No such driver found");
			}
			return res.send(module.exports.send_car(drvr));
		})
		.catch(function(err) {
			return res.send(err.message);
		});
}
module.exports.send_car = function(driver) {
	console.log('Sending car: ', driver.profile.name);
	driver.enroute = true;
	driver.save();
	return JSON.stringify(driver);
};
//promises are horrible
module.exports.schedule_ride = function(req, res) {
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

module.exports.find_closest_driver = function(req, res) {
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
	var drivers = Driver.find(query, function(err, drv) {
		if (err) {
			console.log(err.message);
		}
		return res.send(JSON.stringify(drv));

	});
}
module.exports.find_closest_user = function(req, res) {
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
	var users = User.find(query, function(err, drv) {
		if (err) {
			console.log(err.message);
		}
		return res.send(JSON.stringify(drv));

	});
}

//route handlers for rides