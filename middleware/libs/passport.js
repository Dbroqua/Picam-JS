/**
 * Created by dbroqua on 8/16/16.
 */

let BasicAuth = require('passport-http').BasicStrategy, //Basic Auth
    ApiStrategy = require('passport-localapikey').Strategy, //Api Key
    users = require('../../models/v1/users');

module.exports = function(passport) {
    passport.use('basic', new BasicAuth({
            //By default, local strategy uses username and password, we will override with email
            usernameField: 'mail',
            passwordField: 'password',
            passReqToCallback: true //Allows us to pass back the entire request to the callback
        },
        function(req, mail, password, done) {
            users.model.findOne({
                mail: mail
            }, function(err, user) {
                if (err) {
                    return done(err, false, {
                        message: 'Invalid username'
                    });
                } else {
                    //Test a matching password
                    if (user !== null) {
                        user.comparePassword(password, function(err, isMatch) {
                            if (err) {
                                return done(err, false, {
                                    message: 'Invalid password'
                                });
                            } else {
                                if (isMatch && user.active === true) {
                                    return done(null, user);
                                } else {
                                    return done(null, false, {
                                        message: 'Invalid password'
                                    });
                                }
                            }
                        });
                    } else {
                        return done(null, false, {
                            message: 'Invalid username'
                        });
                    }
                }
            });
        }));

    passport.use('api-key', new ApiStrategy({
            apiKeyField: 'apikey',
            passReqToCallback: true //Allows us to pass back the entire request to the callback
        },
        function(req, apikey, done) {
            users.model.findOne({
                apikey: apikey
            }, function(err, user) {
                if (err || user.active === false) {
                    return done(err, false, {
                        message: 'Invalid username'
                    });
                } else {
                    return done(null, user);
                }
            });
        }));
};