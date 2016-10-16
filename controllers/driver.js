const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const Driver = require('../models/Driver');

// Enroll driver
/**
 * GET /signup
 * Signup page.
 */
exports.get_enroll = (req, res) => {
  if (req.driver) {
    return res.redirect('/');
  }
  res.render('backend/enroll_driver', {
    title: 'Create Account'
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.post_enroll = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('phonenum', 'Phone number is not valid');
  req.assert('homelocation', 'location is not valid');
  req.assert('name', 'name is not valid');
  req.assert('numberseats', 'numberseats is not valid');



  // req.assert('password', 'Password must be at least 4 characters long').len(4);
  // req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.sanitize('email').normalizeEmail({
    remove_dots: false
  });
  // req.sanitize('phonenum').normalizeEmail({ remove_dots: true });
  // req.sanitize('name').normalizeEmail({ remove_dots: false });


  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }
  /*
      availible:Boolean,

  name: String,
      location: String,
      picture: String,
      phonenum:String,
      location:String,
      time_begin:String,
      time_end:String,
      home_location:String,
      number_seats:Number*/
  // console.log(req.body);
  // console.log("lat long:");
  // console.log(req.body.lat, req.body.long);
  const driver = new Driver({
    email: req.body.email,
    location: {
      coordinates: [req.body.long, req.body.lat]
    },
    profile: {
      name: req.body.name,
      phonenum: req.body.phonenum,
      homelocation: req.body.homelocation,
      numberseats: req.body.numberseats,
    },
    availible: true
  });
  console.log("got here");
  console.log(driver);
  console.log(driver.location.coordinates);
  Driver.findOne({
    $or: [{
      profile: {
        phonenum: req.body.phonenum
      }
    }, {
      'email': req.body.email
    }]
  }, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    if (existingUser) {
      req.flash('errors', {
        msg: 'Account with that email address already exists.'
      });
      return res.send("identity already enqueued");
    }
    driver.save((err) => {
      if (err) {
        return next(err);
      }
      req.logIn(driver, (err) => {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  });
};

//get driver info
exports.get_driver_info = (req, res) => {
  console.log("returning driver info");
  return Driver.findOne();
};

// /**
//  * GET /login
//  * Login page.
//  */
// exports.getLogin = (req, res) => {
//   if (req.driver) {
//     return res.redirect('/');
//   }
//   res.render('account/login', {
//     title: 'Login'
//   });
// };

// /**
//  * POST /login
//  * Sign in using email and password.
//  */
// exports.postLogin = (req, res, next) => {
//   req.assert('email', 'Email is not valid').isEmail();
//   req.assert('password', 'Password cannot be blank').notEmpty();
//   req.sanitize('email').normalizeEmail({ remove_dots: false });

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash('errors', errors);
//     // return res.redirect('/login');
//   }

//   passport.authenticate('local', (err, driver, info) => {
//     if (err) { return next(err); }
//     if (!driver) {
//       req.flash('errors', info);
//       // return res.redirect('/login');
//     }
//     req.logIn(driver, (err) => {
//       if (err) { return next(err); }
//       req.flash('success', { msg: 'Success! You are logged in.' });
//       res.redirect(req.session.returnTo || '/');
//     });
//   })(req, res, next);
// };

// /**
//  * GET /logout
//  * Log out.
//  */
// exports.logout = (req, res) => {
//   req.logout();
//   res.redirect('/');
// };

// /**
//  * GET /signup
//  * Signup page.
//  */
// exports.getSignup = (req, res) => {
//   if (req.driver) {
//     return res.redirect('/');
//   }
//   res.render('account/signup', {
//     title: 'Create Account'
//   });
// };

// /**
//  * POST /signup
//  * Create a new local account.
//  */
// exports.postSignup = (req, res, next) => {
//   req.assert('email', 'Email is not valid').isEmail();
//   req.assert('password', 'Password must be at least 4 characters long').len(4);
//   req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
//   req.sanitize('email').normalizeEmail({ remove_dots: false });

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash('errors', errors);
//     return res.redirect('/signup');
//   }

//   const driver = new driver({
//     email: req.body.email,
//     password: req.body.password
//   });

//   driver.findOne({ email: req.body.email }, (err, existingUser) => {
//     if (err) { return next(err); }
//     if (existingUser) {
//       req.flash('errors', { msg: 'Account with that email address already exists.' });
//       return res.redirect('/signup');
//     }
//     driver.save((err) => {
//       if (err) { return next(err); }
//       req.logIn(driver, (err) => {
//         if (err) {
//           return next(err);
//         }
//         res.redirect('/');
//       });
//     });
//   });
// };

// /**
//  * GET /account
//  * Profile page.
//  */
// exports.getAccount = (req, res) => {
//   res.render('account/profile', {
//     title: 'Account Management'
//   });
// };

// /**
//  * POST /account/profile
//  * Update profile information.
//  */
// exports.postUpdateProfile = (req, res, next) => {
//   req.assert('email', 'Please enter a valid email address.').isEmail();
//   req.sanitize('email').normalizeEmail({ remove_dots: false });

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash('errors', errors);
//     return res.redirect('/account');
//   }

//   driver.findById(req.driver.id, (err, driver) => {
//     if (err) { return next(err); }
//     driver.email = req.body.email || '';
//     driver.profile.name = req.body.name || '';
//     driver.profile.gender = req.body.gender || '';
//     driver.profile.location = req.body.location || '';
//     driver.profile.website = req.body.website || '';
//     driver.save((err) => {
//       if (err) {
//         if (err.code === 11000) {
//           req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
//           return res.redirect('/account');
//         }
//         return next(err);
//       }
//       req.flash('success', { msg: 'Profile information has been updated.' });
//       res.redirect('/account');
//     });
//   });
// };

// /**
//  * POST /account/password
//  * Update current password.
//  */
// exports.postUpdatePassword = (req, res, next) => {
//   req.assert('password', 'Password must be at least 4 characters long').len(4);
//   req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash('errors', errors);
//     return res.redirect('/account');
//   }

//   driver.findById(req.driver.id, (err, driver) => {
//     if (err) { return next(err); }
//     driver.password = req.body.password;
//     driver.save((err) => {
//       if (err) { return next(err); }
//       req.flash('success', { msg: 'Password has been changed.' });
//       res.redirect('/account');
//     });
//   });
// };

// /**
//  * POST /account/delete
//  * Delete driver account.
//  */
// exports.postDeleteAccount = (req, res, next) => {
//   driver.remove({ _id: req.driver.id }, (err) => {
//     if (err) { return next(err); }
//     req.logout();
//     req.flash('info', { msg: 'Your account has been deleted.' });
//     res.redirect('/');
//   });
// };

// /**
//  * GET /account/unlink/:provider
//  * Unlink OAuth provider.
//  */
// exports.getOauthUnlink = (req, res, next) => {
//   const provider = req.params.provider;
//   driver.findById(req.driver.id, (err, driver) => {
//     if (err) { return next(err); }
//     driver[provider] = undefined;
//     driver.tokens = driver.tokens.filter(token => token.kind !== provider);
//     driver.save((err) => {
//       if (err) { return next(err); }
//       req.flash('info', { msg: `${provider} account has been unlinked.` });
//       res.redirect('/account');
//     });
//   });
// };

// /**
//  * GET /reset/:token
//  * Reset Password page.
//  */
// exports.getReset = (req, res, next) => {
//   if (req.isAuthenticated()) {
//     return res.redirect('/');
//   }
//   driver
//     .findOne({ passwordResetToken: req.params.token })
//     .where('passwordResetExpires').gt(Date.now())
//     .exec((err, driver) => {
//       if (err) { return next(err); }
//       if (!driver) {
//         req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
//         return res.redirect('/forgot');
//       }
//       res.render('account/reset', {
//         title: 'Password Reset'
//       });
//     });
// };

// /**
//  * POST /reset/:token
//  * Process the reset password request.
//  */
// exports.postReset = (req, res, next) => {
//   req.assert('password', 'Password must be at least 4 characters long.').len(4);
//   req.assert('confirm', 'Passwords must match.').equals(req.body.password);

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash('errors', errors);
//     return res.redirect('back');
//   }

//   async.waterfall([
//     function (done) {
//       driver
//         .findOne({ passwordResetToken: req.params.token })
//         .where('passwordResetExpires').gt(Date.now())
//         .exec((err, driver) => {
//           if (err) { return next(err); }
//           if (!driver) {
//             req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
//             return res.redirect('back');
//           }
//           driver.password = req.body.password;
//           driver.passwordResetToken = undefined;
//           driver.passwordResetExpires = undefined;
//           driver.save((err) => {
//             if (err) { return next(err); }
//             req.logIn(driver, (err) => {
//               done(err, driver);
//             });
//           });
//         });
//     },
//     function (driver, done) {
//       const transporter = nodemailer.createTransport({
//         service: 'SendGrid',
//         auth: {
//           driver: process.env.SENDGRID_USER,
//           pass: process.env.SENDGRID_PASSWORD
//         }
//       });
//       const mailOptions = {
//         to: driver.email,
//         from: 'hackathon@starter.com',
//         subject: 'Your Hackathon Starter password has been changed',
//         text: `Hello,\n\nThis is a confirmation that the password for your account ${driver.email} has just been changed.\n`
//       };
//       transporter.sendMail(mailOptions, (err) => {
//         req.flash('success', { msg: 'Success! Your password has been changed.' });
//         done(err);
//       });
//     }
//   ], (err) => {
//     if (err) { return next(err); }
//     res.redirect('/');
//   });
// };

// /**
//  * GET /forgot
//  * Forgot Password page.
//  */
// exports.getForgot = (req, res) => {
//   if (req.isAuthenticated()) {
//     return res.redirect('/');
//   }
//   res.render('account/forgot', {
//     title: 'Forgot Password'
//   });
// };

// /**
//  * POST /forgot
//  * Create a random token, then the send driver an email with a reset link.
//  */
// exports.postForgot = (req, res, next) => {
//   req.assert('email', 'Please enter a valid email address.').isEmail();
//   req.sanitize('email').normalizeEmail({ remove_dots: false });

//   const errors = req.validationErrors();

//   if (errors) {
//     req.flash('errors', errors);
//     return res.redirect('/forgot');
//   }

//   async.waterfall([
//     function (done) {
//       crypto.randomBytes(16, (err, buf) => {
//         const token = buf.toString('hex');
//         done(err, token);
//       });
//     },
//     function (token, done) {
//       driver.findOne({ email: req.body.email }, (err, driver) => {
//         if (err) { return done(err); }
//         if (!driver) {
//           req.flash('errors', { msg: 'Account with that email address does not exist.' });
//           return res.redirect('/forgot');
//         }
//         driver.passwordResetToken = token;
//         driver.passwordResetExpires = Date.now() + 3600000; // 1 hour
//         driver.save((err) => {
//           done(err, token, driver);
//         });
//       });
//     },
//     function (token, driver, done) {
//       const transporter = nodemailer.createTransport({
//         service: 'SendGrid',
//         auth: {
//           driver: process.env.SENDGRID_USER,
//           pass: process.env.SENDGRID_PASSWORD
//         }
//       });
//       const mailOptions = {
//         to: driver.email,
//         from: 'hackathon@starter.com',
//         subject: 'Reset your password on Hackathon Starter',
//         text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
//           Please click on the following link, or paste this into your browser to complete the process:\n\n
//           http://${req.headers.host}/reset/${token}\n\n
//           If you did not request this, please ignore this email and your password will remain unchanged.\n`
//       };
//       transporter.sendMail(mailOptions, (err) => {
//         req.flash('info', { msg: `An e-mail has been sent to ${driver.email} with further instructions.` });
//         done(err);
//       });
//     }
//   ], (err) => {
//     if (err) { return next(err); }
//     res.redirect('/forgot');
//   });
// };