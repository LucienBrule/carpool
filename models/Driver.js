const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [Number]
  },
  email: {
    type: String,
    unique: true
  },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  facebook: String,
  tokens: Array,
  profile: {
    name: String,
    location: String,
    picture: String,
    phonenum: String,
    homelocation: String,
    location: String,
    numberseats: Number
  },
  availible: Boolean,
  timebegin: String,
  timeend: String,
  riders: [String]
}, {
  timestamps: true
});

// DriverSchema.index({ location : '2dsphere' });

/**
 * Password hash middleware.
 */
DriverSchema.pre('save', function(next) {
  const Driver = this;
  if (!Driver.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(Driver.password, salt, null, (err, hash) => {
      if (err) {
        return next(err);
      }
      Driver.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating Driver's password.
 */
DriverSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting Driver's gravatar.
 */
DriverSchema.methods.gravatar = function(size = 200) {
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const Driver = mongoose.model('Driver', DriverSchema);

module.exports = Driver;