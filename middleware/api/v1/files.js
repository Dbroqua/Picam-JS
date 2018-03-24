/**
 * Created by dbroqua on 9/20/16.
 */
const cameras = require('../../../models/v1/cameras'),
    libs = require('../../libs/query'),
    errors = require('../../libs/errors'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    request = require('request'),
    mmm = require('mmmagic');

let params = {
    dataModel: cameras.dataModel,
    model: cameras.model
};

class Files {
    /**
     * Get list of all files
     * @param {Object} req
     * @param {Function} callback
     */
    static getAll(req, callback) {
        let urlParams = url.parse(req.url, true).query;

        libs.getOne(params, req, function(err, data) {
            if (err) {
                errors.errorCatcher(err, callback);
            } else {
                if (data.code !== 200) {
                    callback(null, data);
                } else {
                    let camera = data.res;
                    if (camera.type === 'Local') {
                        let directory = camera.definition.filesDirectory;
                        fs.stat(directory, function(err, stats) {
                            if (err) {
                                errors.errorCatcher(err, callback);
                            } else {
                                if (stats.isDirectory()) {
                                    fs.readdir(directory, function(err, files) {
                                        if (err) {
                                            errors.errorCatcher(err, callback);
                                        } else {
                                            let nbFiles = files.length,
                                                currentFileIndex = 0,
                                                readFiles = 0,
                                                page = 1,
                                                limit = 0,
                                                code = 204,
                                                res = {
                                                    totalRows: nbFiles,
                                                    filteredRows: 0,
                                                    page: page,
                                                    limit: limit,
                                                    resources: []
                                                };

                                            if (urlParams.page !== undefined && urlParams.limit !== undefined && urlParams.limit > 0) {
                                                limit = Number(urlParams.limit);
                                                page = Number(urlParams.page) - 1;

                                                if (page >= 0 && nbFiles > (Number(urlParams.limit) * (Number(urlParams.page) - 1))) {
                                                    res.page = page;
                                                    res.limit = limit;
                                                    res.resources = files.splice((page * limit), limit);

                                                    code = 200;
                                                }

                                                nbFiles = res.resources.length;
                                            }

                                            /**
                                             * When stat of all files finished, call callback
                                             * @private
                                             */
                                            let _runCallback = function() {
                                                if (readFiles === nbFiles) {
                                                    res.filteredRows = res.resources.length;
                                                    callback(null, {
                                                        code: code,
                                                        res: res
                                                    });
                                                }
                                            };

                                            /**
                                             * Stat current file
                                             * @param {String} file
                                             * @param {Integer} index
                                             * @private
                                             */
                                            let _statFile = function(file, index) {
                                                console.log('Path: ', file);
                                                fs.stat(path.join(directory, file), function(err, stats) {
                                                    readFiles++;
                                                    let splitedFile = file.split('.');
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
                                                res.resources.forEach(function(file) {
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
                                        res: {
                                            message: directory + ' is not a valid directory'
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        let extraParams = '?apikey=' + camera.definition.apikey;
                        for (let key in urlParams) {
                            if (urlParams.hasOwnProperty(key)) {
                                extraParams += '&' + key + '=' + urlParams[key];
                            }
                        }
                        let uri = camera.definition.scheme + '://' + camera.definition.uri + ':' + camera.definition.port +
                            '/api/v1/cameras/' + camera.definition.cameraId + '/files/' + extraParams;

                        request.get({
                            url: uri,
                            timeout: 15000
                        }, function(err, res, body) {
                            if (err) {
                                errors.errorCatcher(err, callback);
                            } else {
                                callback(null, {
                                    code: res.statusCode,
                                    res: JSON.parse(body)
                                });
                            }
                        });
                    }
                }
            }
        });
    }

    /**
     * Get one file
     * @param {Object} req
     * @param {Function} callback
     */
    static getOne(req, callback) {
        libs.getOne(params, req, function(err, data) {
            if (err) {
                errors.errorCatcher(err, callback);
            } else {
                if (data.code !== 200) {
                    callback(null, data);
                } else {
                    let camera = data.res;
                    if (camera.type === 'Local') {
                        let file = path.join(camera.definition.filesDirectory, req.params.file);
                        fs.stat(file, function(err, stats) {
                            if (err) {
                                errors.errorCatcher(err, callback);
                            } else {
                                if (stats.isFile()) {
                                    let Magic = mmm.Magic,
                                        magic = new Magic(mmm.MAGIC_MIME_TYPE);
                                    magic.detectFile(file, function(err, mimeType) {
                                        if (err) {
                                            errors.errorCatcher(err, callback);
                                        } else {
                                            let name = file.split('/');
                                            callback(
                                                null, {
                                                    code: 200,
                                                    res: {
                                                        name: name[name.length - 1],
                                                        file: file,
                                                        type: 'File',
                                                        mimeType: mimeType,
                                                        size: stats.size
                                                    }
                                                }
                                            );
                                        }
                                    });
                                } else {
                                    callback(null, {
                                        code: 404,
                                        res: {
                                            message: 'File not found'
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        callback(null, {
                            code: 200,
                            res: {
                                type: 'Net',
                                camera: camera
                            }
                        });
                    }
                }
            }
        });
    }
}

module.exports = Files;