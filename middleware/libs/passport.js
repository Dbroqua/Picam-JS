/**
 * Created by dbroqua on 8/16/16.
 */

var BasicAuth = require('passport-http').BasicStrategy, //Basic Auth
    ApiStrategy = require('passport-localapikey').Strategy, //Api Key
    users = require('../../models/v1/users');

exports.BasicAuth = new BasicAuth(
    /**
     * Basic auth ( Headers : { Authorisation: 'Basic ...' } }
     * @param {String} mail
     * @param {String} password
     * @param {Function} done
     */
    function (mail, password, done) {
    users.model.findOne({ mail: mail }, function(err, user) {
        if (err) {
            return done(err, false,{message: 'Invalid username'});
        }else {
            //Test a matching password
            if ( user !== null ){
                user.comparePassword(password, function(err, isMatch) {
                    if (err){
                        return done(err, false,{message: 'Invalid password'});
                    }else {
                        if (isMatch ){
                            return done(null, user );
                        } else {
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

exports.ApiKey = new ApiStrategy(
    /**
     * Api key authentication ( url : ?apikey=... )
     * @param {String} apikey
     * @param {Function} done
     */
    function (apikey, done) {
    users.model.findOne({ apikey: apikey }, function(err, user) {
        if (err) {
            return done(err, false,{message: 'Invalid username'});
        }else {
            return done(null, user );
        }
    });
});