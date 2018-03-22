/**
 * Created by dbroqua on 8/16/16.
 */

let mongoose = require('mongoose'),
    mongodb = require('./config').mongodb;

module.exports.mongoose = mongoose.connect('mongodb://' + ( mongodb.user !== null ? mongodb.user + ':' + mongodb.pass +
    '@' : '' ) + mongodb.url + ':' + mongodb.port + '/' + mongodb.collection, function (err) {
    if (err) {
        throw err;
    }
});