/**
 * Created by dbroqua on 9/20/16.
 */

module.exports = function () {
    var cameras = require('../../../models/v1/cameras'),
        libs = require('../../libs/query'),
        errors = require('../../libs/errors'),
        fs = require('fs'),
        url = require('url'),
        path = require('path'),
        request = require('request');

    var params = {
        dataModel: cameras.dataModel,
        model: cameras.model
    };

    /**
     * Get list of all files
     * @param {Object} req
     * @param {Function} callback
     */
    this.getAll = function (req, callback) {
        var urlParams = url.parse(req.url, true).query;

        libs.getOne(params, req, function (err, data) {
            if (err) {
                errors.errorCatcher(err, req, callback);
            } else {
                if (data.code !== 200) {
                    callback(null, data);
                } else {
                    var camera = data.res;
                    if (camera.type === 'Local') {
                        var directory = camera.definition.filesDirectory;
                        fs.stat(directory, function (err, stats) {
                            if (err) {
                                errors.errorCatcher(err, req, callback);
                            } else {
                                if (stats.isDirectory()) {
                                    fs.readdir(directory, function (err, files) {
                                        if (err) {
                                            errors.errorCatcher(err, req, callback);
                                        } else {
                                            var nbFiles = files.length,
                                                currentFileIndex = 0,
                                                readFiles = 0,
                                                page = 1,
                                                limit = 0,
                                                code = 204;
                                            var res = {
                                                totalRows: nbFiles,
                                                filteredRows: 0,
                                                page: page,
                                                limit: limit,
                                                resources: []
                                            };

                                            if (urlParams.page !== undefined && urlParams.limit !== undefined && urlParams.limit > 0) {
                                                limit = Number(urlParams.limit);
                                                page = Number(urlParams.page) - 1;

                                                if (page >= 0 && nbFiles > (Number(urlParams.limit) * (Number(urlParams.page) - 1 ))) {
                                                    res.page = page;
                                                    res.limit = limit;
                                                    res.resources = files.splice((page * limit ), limit);

                                                    code = 200;
                                                }

                                                nbFiles = res.resources.length;
                                            }

                                            /**
                                             * When stat of all files finished, call callback
                                             * @private
                                             */
                                            var _runCallback = function () {
                                                if (readFiles === nbFiles) {
                                                    res.filteredRows = res.resources.length;
                                                    callback(null, {code: code, res: res});
                                                }
                                            };

                                            /**
                                             * Stat current file
                                             * @param {String} file
                                             * @param {Integer} index
                                             * @private
                                             */
                                            var _statFile = function (file, index) {
                                                console.log('Path: ', file);
                                                fs.stat(path.join(directory, file), function (err, stats) {
                                                    readFiles++;
                                                    var splitedFile = file.split('.');
                                                    res.resources[index] = {
                                                        size: stats.size,
                                                        name: file,
                                                        extension: splitedFile[splitedFile.length - 1],
                                                        birthtime: stats.birthtime,
                                                        ctime: stats.ctime,
                                                        mtime: stats.mtime,
                                                        atime: stats.atime
                                                    };
                                                    res.resources[index].name = file;
                                                    _runCallback();
                                                });
                                            };

                                            if (nbFiles > 0) {
                                                res.resources.forEach(function (file) {
                                                    _statFile(file, currentFileIndex);
                                                    currentFileIndex++;

                                                });
                                            } else {
                                                _runCallback();
                                            }
                                        }
                                    });
                                } else {
                                    callback(null, {
                                        code: 500,
                                        res: {message: directory + ' is not a valid directory'}
                                    });
                                }
                            }
                        });
                    } else {
                        request.get({
                            url: camera.definition.scheme + '://' + camera.definition.uri + ':' + camera.definition.port +
                            '/api/v1/cameras/' + camera.definition.cameraId + '?apikey=' + camera.definition.apikey,
                            timeout: 15000
                        }, function (err, res, body) {
                            if (err) {
                                errors.errorCatcher(err, req, callback);
                            } else {
                                callback(null, {code: res.statusCode, res: JSON.parse(body)});
                            }
                        });
                    }
                }
            }
        });
    };
};