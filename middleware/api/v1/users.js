/**
 * Created by dbroqua on 8/16/16.
 */

var users = require('../../../models/v1/users'),
    libs = require('../../libs/query'),
    errors = require('../../libs/errors');

var params = {
    dataModel: users.dataModel,
    model: users.model
};

/**
 * Create new user
 * @param {Object} req
 * @param {Function} callback
 */
exports.createOne = function (req, callback) {
    libs.createOne(params, req, callback);
};

/**
 * Get all users
 * @param {Object} req
 * @param {Function} callback
 */
exports.getAll = function (req, callback) {
    libs.getAll(params, req, function (err, data) {
        if (err) {
            errors.errorCatcher(err, req, callback);
        } else {
            if (data.code !== 200) {
                callback(null, data);
            } else {
                var nbUser = data.res.resources.length;
                for (var i = 0; i < nbUser; i++) {
                    data.res.resources[i].password = undefined;
                }
                callback(null, data);
            }
        }
    });
};

/**
 * Get one user
 * @param {Object} req
 * @param {Function} callback
 */
exports.getOne = function (req, callback) {
    libs.getOne(params, req, function (err, data) {
        if (err) {
            errors.errorCatcher(err, req, callback);
        } else {
            if (data.code !== 200) {
                callback(null, data);
            } else {
                data.res.password = undefined;
                callback(null, data);
            }
        }
    });
};

/**
 * Patch one user
 * @param {Object} req
 * @param {Function} callback
 */
exports.patchOne = function (req, callback) {
    /**
     * If all test pass, run patch
     * @param {Object} req
     * @param {Function} callback
     * @private
     */
    var _runAction = function (req, callback) {
        libs.patchOne(params, req, callback);
    };

    if (req.body.password !== undefined) {
        users.bcrypt.genSalt(users.SALT_WORK_FACTOR, function (err, salt) {
            if (err) {
                callback(err, {code: 500, res: {message: 'Internal server error'}});
            } else {
                users.bcrypt.hash(req.body.password, salt, function (err, hash) {
                    if (err) {
                        callback(err, {code: 500, res: {message: 'Internal server error'}});
                    } else {
                        req.body.password = hash;
                        _runAction(req, callback);
                    }
                });
            }
        });
    } else {
        _runAction(req, callback);
    }
};

/**
 * Delete one user
 * @param {Object} req
 * @param {Function} callback
 */
exports.deleteOne = function (req, callback) {
    libs.deleteOne(params, req, callback);
};