var LocalStrategy = require('passport-local').Strategy;

var User = require('../database/models/user.js');

module.exports = function(passport) {

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use('local-signup', new LocalStrategy({
      passReqToCallback: true
    },
    //process of sign up -
    function(req, username, password, done) {
      //node. async
      process.nextTick(function() {
        User.findOne({
          username: username
        }, function(err, user) {
          if (err) {
            return done(err);
          }
          if (user) {
            return done(null, false, req.flash('signupMessage', 'username takend'));
          } else {
            var newUser = new User();
            newUser.username = username;
            newUser.password = newUser.generateHash(password);

            newUser.save(function(err) {
              if (err) {
                throw err;
              } else {
                return done(null, newUser);
              }
            });
          }
        });
      });
    }));

  passport.use('local-login', new LocalStrategy({},
    function(username, password, done) {
      process.nextTick(function() {
        User.findOne({
          'username': username
        }, function(err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false);
          }
          if (!user.validPassword(password)) {
            return done(null, false);
          }
          return done(null, user);
        });
      });
    }
  ));
};
