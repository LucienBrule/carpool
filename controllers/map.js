'use strict';

const async = require('async');
const validator = require('validator');
const request = require('request');
var apiv1 = require('./apiv1.js');
const Driver = require('../models/Driver.js');

exports.map = (req, res) => {

	var getdrivers = apiv1._get_drivers;
	var getusers = apiv1._get_users;
	var drivers = getdrivers();
	drivers.then(function(dr) {
		var driverlats;
		var driverlngs;
		var driveremls;
		dr.forEach(function(driver) {
			console.log(driver);
			driverlngs = driver.location.coordinates[0] + ",";
			driverlats = driver.location.coordinates[1] + ",";
			driveremls = driver.email + ",";
		});

		var users = getusers();
		users.then(function(usr) {
			var userlats;
			var userlngs;
			var useremls;
			usr.forEach(function(user) {
				console.log(user);
				userlngs = user.location.coordinates[1] + ",";
				userlats = user.location.coordinates[0] + ",";
				useremls = user.email + ",";
			});

			res.render('map', {
				title: 'Map',
				numdrivers: dr.length,
				driverlats: driverlats,
				driverlngs: driverlngs,
				driveremls: driveremls,
				numusers: usr.length,
				userlats: userlats,
				userlngs: userlngs,
				useremls: useremls 
			});

		}).catch(function(err) {
			res.send(err.message);
		});
	}).catch(function(err) {
		res.send(err.message);
	});

	// p.then(function(result) {
	// 	console.log(result);
	// 	var driverlats = [];
	// 	var driverlngs = [];
	// 	var driveremls = [];
	// 	result.forEach(function(driver) {
	// 		driverlats.push(driver.location.coordinates[0]);
	// 		driverlngs.push(driver.location.coordinates[1]);
	// 		driveremls.push(driver.email);
	// 	})


	// 	res.render('map', {
	// 		title: 'Map',
	// 		numdrivers: drivers.length,
	// 		driverlats: driverlats,
	// 		driverlngs: driverlngs,
	// 		driveremls: driveremls 
	// 	});
	// }).catch(function(err) {
	// 	res.send(err.message);
	// });
	




	// var dprom = Driver.find().exec();
	// dprom.then(function(drvrs) {
	// 		console.log(drvrs);
	// 		return(drvrs);
	// 	})
	// 	.catch(function(err) {
	// 		return(err.message);
	// 	});
	
}