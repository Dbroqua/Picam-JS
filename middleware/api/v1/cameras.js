/**
 * Created by dbroqua on 8/16/16.
 */

var cameras = require('../../../models/v1/cameras'),
    libs = require('../../libs/query');

var params = {
    dataModel: cameras.dataModel,
    model: cameras.model
};

/**
 * Create new camera
 * @param req
 * @param callback
 */
exports.createOne = function (req, callback) {
    libs.createOne(params, req, callback);
};

/**
 * Get all cameras
 * @param req
 * @param callback
 */
exports.getAll = function (req, callback) {
    libs.getAll(params, req, callback);
};

/**
 * Get one camera
 * @param req
 * @param callback
 */
exports.getOne = function (req, callback) {
    libs.getOne(params, req, callback);
};

/**
 * Patch one camera
 * @param req
 * @param callback
 */
exports.patchOne = function (req, callback) {
    libs.patchOne(params, req, callback);
};

/**
 * Delete one camera
 * @param req
 * @param callback
 */
exports.deleteOne = function (req, callback) {
    libs.deleteOne(params, req, 'cameras', callback);
};