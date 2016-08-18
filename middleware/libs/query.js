/**
 * Created by dbroqua on 8/16/16.
 */

var mongoose = require('mongoose'),
    url = require('url'),
    fs = require('fs'),
    requestSync = require('sync-request'),
    request = require('request'),
    exec = require('child_process').exec;

var errors = require('./errors');

var deleteCatcher, getOne, queryBuilder;


/**
 * Return the size of an object
 * @param obj
 * @returns {number}
 */
Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        size++;
    }
    return size;
};

// PRIVATE FUNCTIONS -------------------------------------------------------------------------------------------------//

var _timeStampToDate = function (ts) {
    return new Date(ts * 1000);
};

/**
 * For each cameras attach informations like last run, last detection, state...
 * @param data
 * @param req
 * @param callback
 * @private
 */
var _getCamerasInfos = function (data, req, callback) {
    var nbElt = data.length,
        currentElt = 0,
        nbChecks = 2,
        currentCheckList = [];

    var _runCallback = function () {
        if (nbElt === currentElt) {
            callback(data);
        }
    };

    var _endCurrentElt = function (_currentElt) {
        if (nbChecks === currentCheckList[_currentElt]) {
            currentElt++;
            _runCallback();
        }
    };

    data.forEach(function (item) {
        var _currentEltIndex = currentElt;
        item.infos = {
            state: 'Unknown',
            detectionState: 'Unknown',
            lastDetection: 0,
            startedAt: 0,
            lastRun: new Date()
        };

        var password = item.definition.password;

        if (req.keepPasswords !== true) {
            item.definition.password = undefined;
            if (item.definition.motion !== undefined) {
                item.definition.motion.password = undefined;
            }
        }

        switch (item.type) {
            case 'Local':
                currentCheckList[_currentEltIndex] = 0;
                // Is running ?
                fs.stat('/var/run/motion/motion.pid', function (err, stats) {
                    item.infos.state = ( err ? 'Stop' : 'Running' );

                    if (item.infos.state === 'Running') {
                        // Last start
                        item.infos.startedAt = stats.birthtime;

                        // Detection state
                        exec('grep "webcontrol_authentication" /etc/motion.conf|cut -d" " -f 2', function (err, stdout) {
                            currentCheckList[_currentEltIndex]++;
                            if (!err) {
                                var authorization = stdout.replace(/(\r\n|\n|\r)/gm, '');
                                var res = requestSync('GET', item.definition.motion.adminUri + 'status', {
                                    'headers': {
                                        'Authorization': 'Basic ' + new Buffer(authorization).toString('base64'),
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

                // Last detection
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
                    url: item.definition.scheme + '://' + item.definition.uri + ':' + item.definition.port + '/api/v1/cameras/' + item.definition.cameraId,
                    headers: {
                        'Authorization': 'Basic ' + new Buffer(item.definition.login + ':' + password).toString('base64'),
                        'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.52 Safari/537.17'
                    }
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
 * Internal function for queryBuilder
 * @param req
 * @param dataModel
 * @param model
 * @param callback
 * @private
 */
var _querySearchBuilder = function (req, dataModel, model, callback) {
    var urlParams = url.parse(req.url, true).query;
    var isInError = false,
        code = 200,
        message = '',
        searchObj = {},
        i = 0,
        keyExists = true,
        tmpObj = {},
        currentIndex = 0,
        nbTotalIndex = 0,
        searchCol,
        comparisonSymbol,
        value;

    /**
     * Extract search type
     * @param value
     * @param comparisonSymbol
     * @private
     */
    var _queryType = function (value, comparisonSymbol) {
        switch (comparisonSymbol) {
            case 'gt':
                searchObj[searchCol] = {$gt: value};
                break;
            case 'ge':
                searchObj[searchCol] = {$gte: value};
                break;
            case 'lt':
                searchObj[searchCol] = {$lt: value};
                break;
            case 'le':
                searchObj[searchCol] = {$lte: value};
                break;
            case 'ne':
                searchObj[searchCol] = {$ne: value};
                break;
            case 'lk':
                searchObj[searchCol] = new RegExp(value.split('*').join('.{0,}'), 'i');
                break;
            case 'in':
                searchObj[searchCol] = {$in: value.split(',')};
                break;
            case 'mt':
                searchObj[searchCol] = {$all: value.split(',')};
                break;
            case 'eq':
                searchObj[searchCol] = value;
                break;
            default:
                code = 406;
                message = 'Unauthorized symbol ' + comparisonSymbol + ' in search field';
                isInError = true;
        }
    };

    /**
     * Run the callback if all items is parsed
     * @private
     */
    var _runCallBack = function () {
        if (nbTotalIndex === currentIndex) {
            if (req.params !== undefined && req.params.id !== undefined) {
                if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                    searchObj._id = req.params.id;
                } else {
                    code = 406;
                    message = 'Id is not a valid ObjectId type';
                    isInError = true;
                }
            }

            callback(isInError, {
                searchObj: searchObj,
                code: code,
                message: message
            });
        }
    };

    nbTotalIndex = Object.size(urlParams);

    if (nbTotalIndex === 0) {
        _runCallBack();
    } else {
        for (var key in urlParams) {
            // Extracting query filters
            if (key.split('.')[0] === 'q' && ( key.split('.').length >= 3 )) {
                value = urlParams[key]; // Value of current item
                var params = key.split('.'); // Split key in data
                var paramsLength = params.length;
                keyExists = true; // By default we suppose user send correct query field
                comparisonSymbol = params[paramsLength - 1]; // Type of query (like, <, >, in, ...)
                searchCol = ''; // final search key in object

                if (paramsLength >= 3) { // Min length for query is 3 : q.<field>.<comparison type>
                    tmpObj = dataModel; // Create temp var is data model
                    for (i = 1; i < ( paramsLength - 1 ); i++) { // For current <field> check if exists in model
                        searchCol += (searchCol !== '' ? '.' : '' ) + params[i]; // Generate final search key
                        if (tmpObj[0] !== undefined) {
                            tmpObj = tmpObj[0][params[i]]; // Copy current data model in tmpObj
                        } else {
                            tmpObj = tmpObj[params[i]]; // Copy current data model in tmpObj
                        }

                        if (tmpObj === undefined) { // tmpObj is not define (current <field> not recognized in model)
                            keyExists = false;
                            break;
                        }
                    }
                }
                if (keyExists || params[1] === '_id') { // If <field> is acceptable check <comparison>
                    value = ( value === 'null' ? null : value );
                    currentIndex++;
                    _queryType(value, comparisonSymbol);
                    _runCallBack();
                } else {
                    currentIndex++;
                    code = 406;
                    message = 'Unauthorized filter field ' + key + ' for model ' + model.modelName;
                    isInError = true;
                    _runCallBack();
                }
            } else {
                currentIndex++;
                _runCallBack();
            }
        }
    }
};

// END PRIVATE FUNCTIONS ---------------------------------------------------------------------------------------------//

/**
 * Function for send callback on delete method
 * @param count
 * @param objId
 * @param objType
 * @param callback
 */
deleteCatcher = function (count, objId, objType, callback) {
    var res = count.result;
    if (res.ok > 0) {
        if (res.n === 0) {
            callback(null, {code: 404, res: {message: 'Item not found'}});
        } else {
            callback(null, {code: 200, res: {message: 'Item deleted'}});
        }
    } else {
        callback(null, {code: 500, res: {message: 'Error while trying to remove this object'}});
    }
};

/**
 * Function for generate some filters on get list of collection
 * @param req
 * @param dataModel
 * @param model
 * @param callback
 */
queryBuilder = function (req, dataModel, model, callback) {
    var urlParams = url.parse(req.url, true).query;
    var isInError = false,
        code = 200,
        message = '',
        searchObj = {},
        i = 0,
        j = 0,
        keyExists = true,
        page = 1,
        limit = 0,
        tmpObj = {};

    _querySearchBuilder(req, dataModel, model, function (err, data) {
        isInError = err;
        code = data.code;
        message = data.message;
        searchObj = data.searchObj;

        if (isInError === true) { // One of <fields> of <comparison> not acceptable
            callback({
                code: code,
                res: {
                    message: message
                }
            });
        } else {
            var query = model.find(searchObj);
            var queryCount = model.find(searchObj);

            // List of returned fields ---------------------------------------------------------------------------------
            var fields = {};
            if (urlParams.fields !== undefined) {
                var listOfFields = urlParams.fields.split(','); // List of desired returned fields
                var nbFields = listOfFields.length; // Number of desired returned fields
                var wantShowId = false; // Show _id of item or not ?

                if (nbFields > 0 && listOfFields[0] !== '') { // If fields param not empty
                    for (i = 0; i < nbFields; i++) { // For each field check if exist in model
                        if (listOfFields[i] === '_id') { // If field is _id
                            wantShowId = true;
                            fields._id = 1;
                        } else { // Other case
                            var currentField = listOfFields[i]; // Save current field for simplify next
                            currentField = currentField.split('.'); // For case of field is child of other field
                            var currentFieldLn = currentField.length; // Length of childs
                            var fieldStructure = ''; // Final field
                            keyExists = true; // By default we suppose that user want existing field

                            tmpObj = dataModel; // Copy root model in tmp object
                            for (j = 0; j < currentFieldLn; j++) { // For all soon in field
                                fieldStructure += (fieldStructure !== '' ? '.' : '' ) + currentField[j]; // Create final field
                                tmpObj = tmpObj[currentField[j]]; // Copy extract model in tmp object
                                if (tmpObj === undefined) { // If tmp object not defined (currentField not exists in model)
                                    keyExists = false;
                                    break;
                                }
                            }

                            if (keyExists === true) { // If final field exists in model, add it in fields lists
                                fields[fieldStructure] = 1;
                            }
                        }
                    }

                    if (wantShowId === false) { // Hide _id in results
                        fields._id = 0;
                    }
                }
            }

            query.select(fields);
            queryCount.select(fields);
            //----------------------------------------------------------------------------------------------------------

            // Sort data -----------------------------------------------------------------------------------------------
            if (urlParams.sort !== undefined) {
                var sortColumn = urlParams.sort; // Copy sort filters in tmp variable
                var dir = 1; // By default we suppose user want ASC sort
                if (urlParams.sort.indexOf('-') === 0) { // User want DESC sort
                    sortColumn = urlParams.sort.substr(1);
                    dir = -1;
                }

                sortColumn = sortColumn.split('.'); // For case of sort is child of other sort
                var sortColumnLn = sortColumn.length; // Length of childs
                var sortColumnFinal = ''; // Final sort
                keyExists = true; // By default we suppose that user sort on existing field


                tmpObj = dataModel; // Copy root model in tmp object
                for (j = 0; j < sortColumnLn; j++) { // For all soon in field
                    sortColumnFinal += (sortColumnFinal !== '' ? '.' : '' ) + sortColumn[j]; // Create final sort
                    tmpObj = tmpObj[sortColumn[j]]; // Copy extract model in tmp object
                    if (tmpObj === undefined) { // If tmp object not defined (sortColumn not exists in model)
                        keyExists = false;
                        break;
                    }
                }

                if (keyExists === true || sortColumnFinal === '_id') { // If final sort exists in model
                    var sort = {};
                    sort[sortColumnFinal] = dir;
                    query.sort(sort);
                    queryCount.sort(sort);
                }
            }
            //----------------------------------------------------------------------------------------------------------

            // Paginate mode -------------------------------------------------------------------------------------------
            if (urlParams.page !== undefined && urlParams.limit !== undefined && urlParams.limit > 0) {
                limit = Number(urlParams.limit);
                var _page = ( Number(urlParams.page) > 1 ? ( Number(urlParams.page) - 1 ) : 0 );
                page = Number(urlParams.page);
                var firstElement = _page * limit;
                query.limit(limit); // Number of element by page
                query.skip(firstElement); // Number of element skipped before start
            }
            //----------------------------------------------------------------------------------------------------------

            // Finally exec queries ------------------------------------------------------------------------------------
            if (req.params !== undefined && req.params.id !== undefined) {
                query.exec(function (err, items) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(err, items);
                    }
                });
            } else {
                queryCount.count().exec(function (err, count) {
                    if (err) {
                        callback(err, null);
                    } else {
                        var totalRows = count;

                        if (totalRows > 0) {
                            query.exec(function (err, items) {
                                if (err) {
                                    callback(err, null);
                                } else {
                                    callback(err, {
                                        totalRows: totalRows,
                                        filteredRows: items.length,
                                        page: page,
                                        limit: limit,
                                        resources: items
                                    });
                                }
                            });
                        } else {
                            callback(err, {
                                totalRows: totalRows,
                                filteredRows: 0,
                                page: page,
                                limit: limit,
                                resources: []
                            });
                        }
                    }
                });
            }
        }
    });
};

/**
 * Get all resources from one model based on filters
 * @param params
 * @param req
 * @param callback
 */
var getAll = function (params, req, callback) {
    queryBuilder(req, params.dataModel, params.model, function (err, data) {
        if (err) {
            errors.errorCatcher(err, req, callback);
        } else {
            if (data.filteredRows > 0) {
                // Loop and attach all infos
                _getCamerasInfos(data.resources, req, function (cameras) {
                    data.resources = cameras;
                    callback(null, {code: 200, res: data});
                });
                //callback(null, {code: ( data.filteredRows > 0 ? 200 : 204 ), res: data});
            } else {
                callback(null, {code: 204, res: data});
            }
        }
    });
};

/**
 * Create new resource based on model
 * @param params
 * @param req
 * @param callback
 */
var createOne = function (params, req, callback) {
    var newItem = new params.model(req.body);
    params.newItem = newItem;

    newItem.save(function (err, item) {
        if (err) {
            errors.errorCatcher(err, req, callback);
        } else {
            callback(null, {code: 201, res: item});
        }
    });
};

/**
 * Get one resource based on model restricted by Id
 * @param params
 * @param req
 * @param callback
 */
getOne = function (params, req, callback) {
    params.model.findOne({_id: req.params.id}, function (err, item) {
        if (err) {
            errors.errorCatcher(err, req, callback);
        } else {
            if (item === null) {
                callback(null, {code: 404, res: {message: 'Item not found'}});
            } else {
                _getCamerasInfos([item], req, function (cameras) {
                    callback(null, {code: 200, res: cameras[0]});
                });
            }
        }
    });
};

/**
 * Patch one resource based on model
 * @param params
 * @param req
 * @param callback
 */
var patchOne = function (params, req, callback) {
    delete req.body.created_at;
    delete req.body.updatedAt;
    req.keepPasswords = true;

    params.model.findOne({_id: req.params.id}, function (err, item) {
        if (err) {
            errors.errorCatcher(err, req, callback);
        } else {
            if (item === null) {
                callback(null, {code: 404, res: {message: 'Item not found'}});
            } else {
                if (req.body.infos !== undefined && ( req.body.infos.state !== undefined || req.body.infos.detectionState !== undefined )) {
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
                                                'Authorization': 'Basic ' + new Buffer(stdout.replace(/(\r\n|\n|\r)/gm, '')).toString('base64'),
                                                'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.52 Safari/537.17'
                                            }
                                        };

                                        request.get(options, function (err, res) {
                                            if (err) {
                                                errors.errorCatcher(err, req, callback);
                                            } else {
                                                console.log('ici ?');
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
                                url: item.definition.scheme + '://' + item.definition.uri + ':' + item.definition.port + '/api/v1/cameras/' + item.definition.cameraId,
                                headers: {
                                    'Authorization': 'Basic ' + new Buffer(item.definition.login + ':' + item.definition.password).toString('base64'),
                                    'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.52 Safari/537.17'
                                },
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
                } else {
                    delete req.body.created_at;
                    delete req.body.updatedAt;
                    delete req.body.timeout;
                    params.model.update({_id: req.params.id}, req.body, {upsert: true}, function (err) {
                        if (err) {
                            errors.errorCatcher(err, req, callback);
                        } else {
                            callback(null, {code: 200, res: req.body});
                        }
                    });
                }
            }
        }
    });


};

/**
 * Function use to delete an element, check before if not used in an asset
 * @param {object} params
 * @param {object} req
 * @param {string} type
 * @param {function} callback
 */
var deleteOne = function (params, req, type, callback) {
    params.model.remove({_id: req.params.id}, function (err, count) {
        if (err) {
            errors.errorCatcher(err, req, callback);
        } else {
            deleteCatcher(count, req.params.id, params.model.modelName, callback);
        }
    });
};

exports.queryBuilder = queryBuilder;
exports.deleteCatcher = deleteCatcher;
exports.getAll = getAll;
exports.getOne = getOne;
exports.createOne = createOne;
exports.deleteOne = deleteOne;
exports.patchOne = patchOne;
exports.objectSize = Object.size;