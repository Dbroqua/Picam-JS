/**
 * Created by dbroqua on 8/16/16.
 */

module.exports = function () {
    var cameras = require('../../../models/v1/cameras'),
        libs = require('../../libs/query'),
        errors = require('../../libs/errors'),
        fs = require('fs'),
        requestSync = require('sync-request'),
        request = require('request'),
        exec = require('child_process').exec;

    var params = {
        dataModel: cameras.dataModel,
        model: cameras.model
    };

    /**
     * Function that return timestamp of date
     * @param {Date} ts
     * @returns {Date}
     * @private
     */
    var _timeStampToDate = function (ts) {
        return new Date(ts * 1000);
    };

    /**
     * For each cameras attach informations like last run, last detection, state...
     * @param {Object} data
     * @param {Object} req
     * @param {Function} callback
     * @private
     */
    var _getCamerasInfos = function (data, req, callback) {
        var nbElt = data.length,
            currentElt = 0,
            currentLocalIndex = 0,
            nbChecks = 2,
            currentCheckList = [];

        /**
         * Callback function
         * @private
         */
        var _runCallback = function () {
            if (nbElt === currentElt) {
                callback(data);
            }
        };

        /**
         * Callback for current element
         * @param {Integer} _currentElt
         * @private
         */
        var _endCurrentElt = function (_currentElt) {
            if (nbChecks === currentCheckList[_currentElt]) {
                currentElt++;
                _runCallback();
            }
        };

        data.forEach(function (item) {
            item.infos = {
                state: 'Unknown',
                detectionState: 'Unknown',
                lastDetection: 0,
                startedAt: 0,
                lastRun: new Date()
            };

            if (req.keepPasswords !== true) {
                item.definition.password = undefined;
            }

            switch (item.type) {
                case 'Local':
                    var _currentEltIndex = currentLocalIndex;
                    currentLocalIndex++;
                    currentCheckList[_currentEltIndex] = 0;
                    //Is running ?
                    fs.stat('/var/run/motion/motion.pid', function (err, stats) {
                        item.infos.state = ( err ? 'Stop' : 'Running' );

                        if (item.infos.state === 'Running') {
                            //Last start
                            item.infos.startedAt = stats.birthtime;

                            //Detection state
                            exec('grep "webcontrol_authentication" /etc/motion.conf|cut -d" " -f 2', function (err, stdout) {
                                currentCheckList[_currentEltIndex]++;
                                if (!err) {
                                    var authorization = stdout.replace(/(\r\n|\n|\r)/gm, '');
                                    var res = requestSync('GET', item.definition.motion.adminUri + 'status', {
                                        headers: {
                                            Authorization: 'Basic ' + new Buffer(authorization).toString('base64'),
                                            'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.52 Safari/537.17'
                                        }
                                    });

                                    if (res.statusCode === 200) {
                                        item.infos.detectionState = (res.getBody('utf8').indexOf('ACTIVE') > -1 ? 'Active' : 'Pause');
                                    }
                                }
                                _endCurrentElt(_currentEltIndex);
                            });

                        } else {
                            currentCheckList[_currentEltIndex]++;
                            _endCurrentElt(_currentEltIndex);
                        }
                    });

                    //Last detection
                    fs.stat(item.definition.fileIntrustion, function (err) {
                        if (err) {
                            currentCheckList[_currentEltIndex]++;
                            _endCurrentElt(_currentEltIndex);
                        } else {
                            fs.readFile(item.definition.fileIntrustion, 'utf8', function (err, data) {
                                if (!err) {
                                    item.infos.lastDetection = _timeStampToDate(data.replace(/(\r\n|\n|\r)/gm, ''));
                                }
                                currentCheckList[_currentEltIndex]++;
                                _endCurrentElt(_currentEltIndex);
                            });
                        }
                    });
                    break;
                case 'Net':
                    var options = {
                        url: item.definition.scheme + '://' + item.definition.uri + ':' + item.definition.port +
                        '/api/v1/cameras/' + item.definition.cameraId + '?apikey=' + item.definition.apikey,
                        timeout: 15000
                    };

                    request.get(options, function (err, res, body) {
                        if (!err && res.statusCode === 200) {
                            item.infos = JSON.parse(body).infos;
                        }
                        currentElt++;
                        _runCallback();
                    });
                    break;
                default:
                    currentElt++;
                    _runCallback();
            }
        });
    };

    /**
     * Create new camera
     * @param {Object} req
     * @param {Function} callback
     */
    this.createOne = function (req, callback) {
        libs.createOne(params, req, callback);
    };

    /**
     * Get all cameras
     * @param {Object} req
     * @param {Function} callback
     */
    this.getAll = function (req, callback) {
        libs.getAll(params, req, function (err, data) {
            if (err) {
                errors.errorCatcher(err, req, callback);
            } else {
                if (data.code === 200) {
                    //Loop and attach all infos
                    _getCamerasInfos(data.res.resources, req, function (cameras) {
                        data.resources = cameras;
                        callback(null, {code: 200, res: data});
                    });
                } else {
                    callback(null, data);
                }
            }
        });
    };

    /**
     * Get one camera
     * @param {Object} req
     * @param {Function} callback
     */
    this.getOne = function (req, callback) {
        libs.getOne(params, req, function (err, data) {
            if (err) {
                errors.errorCatcher(err, req, callback);
            } else {
                if (data.code !== 200) {
                    callback(null, data);
                } else {
                    _getCamerasInfos([data.res], req, function (cameras) {
                        callback(null, {code: 200, res: cameras[0]});
                    });
                }
            }
        });
    };

    /**
     * Patch one camera
     * @param {Object} req
     * @param {Function} callback
     */
    var patchOne = function (req, callback) {
        if (req.body.infos !== undefined && ( req.body.infos.state !== undefined || req.body.infos.detectionState !== undefined )) {
            params.model.findOne({_id: req.params.id}, function (err, item) {
                if (err) {
                    errors.errorCatcher(err, req, callback);
                } else {
                    if (item === null) {
                        callback(null, {code: 404, res: {message: 'Item not found'}});
                    } else {
                        switch (item.type) {
                            case 'Local':
                                if (req.body.infos.state !== undefined) {
                                    exec('sudo service motion ' + ( req.body.infos.state === 'Running' ? 'start' : 'stop' ), function (err) {
                                        if (err) {
                                            errors.errorCatcher(err, req, callback);
                                        } else {
                                            callback(null, {code: 200, res: req.body});
                                        }
                                    });
                                } else {
                                    exec('grep "webcontrol_authentication" /etc/motion.conf|cut -d" " -f 2', function (err, stdout) {
                                        if (!err) {
                                            var options = {
                                                url: item.definition.motion.adminUri + (req.body.infos.detectionState === 'Active' ? 'start' : 'pause' ),
                                                headers: {
                                                    Authorization: 'Basic ' + new Buffer(stdout.replace(/(\r\n|\n|\r)/gm, '')).toString('base64'),
                                                    'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.52 Safari/537.17'
                                                }
                                            };

                                            request.get(options, function (err, res) {
                                                if (err) {
                                                    errors.errorCatcher(err, req, callback);
                                                } else {
                                                    callback(null, {
                                                        code: res.statusCode,
                                                        res: ( res.statusCode === 200 ? req.body : '' )
                                                    });
                                                }
                                            });
                                        } else {
                                            errors.errorCatcher(err, req, callback);
                                        }
                                    });
                                }
                                break;
                            case 'Net':
                                var options = {
                                    url: item.definition.scheme + '://' + item.definition.uri + ':' + item.definition.port +
                                    '/api/v1/cameras/' + item.definition.cameraId + '?apikey=' + item.definition.apikey,
                                    form: req.body
                                };

                                request.patch(options, function (err, res, body) {
                                    if (err) {
                                        errors.errorCatcher(err, req, callback);
                                    } else {
                                        callback(null, {code: res.statusCode, res: body});
                                    }
                                });
                                break;
                            default:
                                callback(null, {code: 406, res: {message: 'Bad camera type'}});
                        }
                    }
                }
            });
        } else {
            libs.patchOne(params, req, callback);
        }
    };

    /**
     * Patch all cameras (activate or deactivate detection)
     * @param {Object} req
     * @param {Function} callback
     */
    this.patchAll = function (req, callback) {
        libs.getAll(params, req, function (err, data) {
            if (err) {
                errors.errorCatcher(err, req, callback);
            } else {
                if (data.code === 200) {
                    var nbCameras = data.res.filteredRows,
                        nbPatchedCameras = 0,
                        res = [];

                    /**
                     * End point for patch all cameras
                     * @private
                     */
                    var _runCallback = function () {
                        if (nbCameras === nbPatchedCameras) {
                            callback(null, {code: 200, res: res});
                        }
                    };

                    data.res.resources.forEach(function (camera) {
                        switch (camera.type) {
                            case 'Local':
                                var tmpReq = {
                                    body: req.body,
                                    params: {
                                        id: camera.id
                                    }
                                };
                                patchOne(tmpReq, function (err, _data) {
                                    if (err) {
                                        res.push({
                                            name: camera.name,
                                            result: err
                                        });
                                    } else {
                                        res.push({
                                            name: camera.name,
                                            result: {
                                                code: _data.code,
                                                message: _data.res
                                            }
                                        });
                                    }
                                    nbPatchedCameras++;
                                    _runCallback();
                                });
                                break;
                            case 'Net':
                                request.patch({
                                    url: camera.definition.scheme + '://' + camera.definition.uri + ':' + camera.definition.port +
                                    '/api/v1/cameras/' + camera.definition.cameraId + '?apikey=' + camera.definition.apikey,
                                    timeout: 15000,
                                    json: req.body
                                }, function (err, _res, body) {
                                    var tmpRes = {
                                        name: camera.name,
                                        result: err
                                    };

                                    if (!err) {
                                        tmpRes.result = {
                                            code: _res.statusCode,
                                            message: body
                                        };
                                    }
                                    res.push(tmpRes);
                                    nbPatchedCameras++;
                                    _runCallback();
                                });
                                break;
                            default:
                                nbPatchedCameras++;
                                _runCallback();
                        }
                    });
                } else {
                    callback(null, data);
                }
            }
        });
    };

    this.patchOne = patchOne;

    /**
     * Delete one camera
     * @param {Object} req
     * @param {Function} callback
     */
    this.deleteOne = function (req, callback) {
        libs.deleteOne(params, req, callback);
    };
};