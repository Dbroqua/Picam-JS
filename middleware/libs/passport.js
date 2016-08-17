/**
 * Created by dbroqua on 8/16/16.
 */

var BasicAuth = require('passport-http').BasicStrategy, // Basic Auth
    ApiStrategy = require('passport-localapikey').Strategy, // Api Key
    users = require('../../models/v1/users');

/**
 * Basic auth ( Headers : { Authorisation: 'Basic ...' } }
 */
exports.BasicAuth = new BasicAuth(function (mail, password, done) {
    users.model.findOne({ mail: mail }, function(err, user) {
        if (err) {
            return done(err, false,{message: 'Invalid username'});
        }else {
            // test a matching password
            if ( user !== null ){
                user.comparePassword(password, function(err, isMatch) {
                    if (err){
                        return done(err, false,{message: 'Invalid password'});
                    }else {
                        if (isMatch ){
                            return done(null, user );
                        }else{
                            return done(null, false,{message: 'Invalid password'});
                        }
                    }
                });
            }else {
                return done(null, false,{message: 'Invalid username'});
            }
        }
    });
});

/**
 * Api key authentication ( url : ?apikey=... )
 */
exports.ApiKey = new ApiStrategy(function (apikey, done) {
    users.model.findOne({ apikey: apikey }, function(err, user) {
        if (err) {
            return done(err, false,{message: 'Invalid username'});
        }else {
            return done(null, user );
        }
    });
});