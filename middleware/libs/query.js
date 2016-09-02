/**
 * Created by dbroqua on 8/16/16.
 */

var mongoose = require('mongoose'),
    url = require('url');

var errors = require('./errors');

var deleteCatcher, getOne, queryBuilder;

/**
 * Return the size of an object
 * @param {Object} obj
 * @returns {number}
 */
Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        size++;
    }
    return size;
};

//PRIVATE FUNCTIONS --------------------------------------------------------------------------------------------------//
/**
 * Internal function for queryBuilder
 * @param {Object} req
 * @param {Object} dataModel
 * @param {Object} model
 * @param {Function} callback
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
     * @param {String} value
     * @param {String} comparisonSymbol
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
            //Extracting query filters
            if (key.split('.')[0] === 'q' && ( key.split('.').length >= 3 )) {
                value = urlParams[key]; //Value of current item
                var params = key.split('.'); //Split key in data
                var paramsLength = params.length;
                keyExists = true; //By default we suppose user send correct query field
                comparisonSymbol = params[paramsLength - 1]; //Type of query (like, <, >, in, ...)
                searchCol = ''; //final search key in object

                if (paramsLength >= 3) { //Min length for query is 3 : q.<field>.<comparison type>
                    tmpObj = dataModel; //Create temp var is data model
                    for (i = 1; i < ( paramsLength - 1 ); i++) { //For current <field> check if exists in model
                        searchCol += (searchCol !== '' ? '.' : '' ) + params[i]; //Generate final search key
                        if (tmpObj[0] !== undefined) {
                            tmpObj = tmpObj[0][params[i]]; //Copy current data model in tmpObj
                        } else {
                            tmpObj = tmpObj[params[i]]; //Copy current data model in tmpObj
                        }

                        if (tmpObj === undefined) { //tmpObj is not define (current <field> not recognized in model)
                            keyExists = false;
                            break;
                        }
                    }
                }
                if (keyExists || params[1] === '_id') { //If <field> is acceptable check <comparison>
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

//END PRIVATE FUNCTIONS ----------------------------------------------------------------------------------------------//

/**
 * Function for send callback on delete method
 * @param {Object} count
 * @param {String} objId
 * @param {Function} callback
 */
deleteCatcher = function (count, objId, callback) {
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
 * @param {Object} req
 * @param {Object} dataModel
 * @param {Object} model
 * @param {Function} callback
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

        if (isInError === true) { //One of <fields> of <comparison> not acceptable
            callback({
                code: code,
                res: {
                    message: message
                }
            });
        } else {
            var query = model.find(searchObj);
            var queryCount = model.find(searchObj);

            //List of returned fields ----------------------------------------------------------------------------------
            var fields = {};
            if (urlParams.fields !== undefined) {
                var listOfFields = urlParams.fields.split(','); //List of desired returned fields
                var nbFields = listOfFields.length; //Number of desired returned fields
                var wantShowId = false; //Show _id of item or not ?

                if (nbFields > 0 && listOfFields[0] !== '') { //If fields param not empty
                    for (i = 0; i < nbFields; i++) { //For each field check if exist in model
                        if (listOfFields[i] === '_id') { //If field is _id
                            wantShowId = true;
                            fields._id = 1;
                        } else { //Other case
                            var currentField = listOfFields[i]; //Save current field for simplify next
                            currentField = currentField.split('.'); //For case of field is child of other field
                            var currentFieldLn = currentField.length; //Length of childs
                            var fieldStructure = ''; //Final field
                            keyExists = true; //By default we suppose that user want existing field

                            tmpObj = dataModel; //Copy root model in tmp object
                            for (j = 0; j < currentFieldLn; j++) { //For all soon in field
                                fieldStructure += (fieldStructure !== '' ? '.' : '' ) + currentField[j]; //Create final field
                                tmpObj = tmpObj[currentField[j]]; //Copy extract model in tmp object
                                if (tmpObj === undefined) { //If tmp object not defined (currentField not exists in model)
                                    keyExists = false;
                                    break;
                                }
                            }

                            if (keyExists === true) { //If final field exists in model, add it in fields lists
                                fields[fieldStructure] = 1;
                            }
                        }
                    }

                    if (wantShowId === false) { //Hide _id in results
                        fields._id = 0;
                    }
                }
            }

            query.select(fields);
            queryCount.select(fields);
            //----------------------------------------------------------------------------------------------------------

            //Sort data ------------------------------------------------------------------------------------------------
            if (urlParams.sort !== undefined) {
                var sortColumn = urlParams.sort; //Copy sort filters in tmp variable
                var dir = 1; //By default we suppose user want ASC sort
                if (urlParams.sort.indexOf('-') === 0) { //User want DESC sort
                    sortColumn = urlParams.sort.substr(1);
                    dir = -1;
                }

                sortColumn = sortColumn.split('.'); //For case of sort is child of other sort
                var sortColumnLn = sortColumn.length; //Length of childs
                var sortColumnFinal = ''; //Final sort
                keyExists = true; //By default we suppose that user sort on existing field

                tmpObj = dataModel; //Copy root model in tmp object
                for (j = 0; j < sortColumnLn; j++) { //For all soon in field
                    sortColumnFinal += (sortColumnFinal !== '' ? '.' : '' ) + sortColumn[j]; //Create final sort
                    tmpObj = tmpObj[sortColumn[j]]; //Copy extract model in tmp object
                    if (tmpObj === undefined) { //If tmp object not defined (sortColumn not exists in model)
                        keyExists = false;
                        break;
                    }
                }

                if (keyExists === true || sortColumnFinal === '_id') { //If final sort exists in model
                    var sort = {};
                    sort[sortColumnFinal] = dir;
                    query.sort(sort);
                    queryCount.sort(sort);
                }
            }
            //----------------------------------------------------------------------------------------------------------

            //Paginate mode --------------------------------------------------------------------------------------------
            if (urlParams.page !== undefined && urlParams.limit !== undefined && urlParams.limit > 0) {
                limit = Number(urlParams.limit);
                var _page = ( Number(urlParams.page) > 1 ? ( Number(urlParams.page) - 1 ) : 0 );
                page = Number(urlParams.page);
                var firstElement = _page * limit;
                query.limit(limit); //Number of element by page
                query.skip(firstElement); //Number of element skipped before start
            }
            //----------------------------------------------------------------------------------------------------------

            //Finally exec queries -------------------------------------------------------------------------------------
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
 * @param {Object} params
 * @param {Object} req
 * @param {Function} callback
 */
var getAll = function (params, req, callback) {
    queryBuilder(req, params.dataModel, params.model, function (err, data) {
        if (err) {
            errors.errorCatcher(err, req, callback);
        } else {
            callback(null, {code: (data.filteredRows > 0 ? 200 : 204 ), res: data});
        }
    });
};

/**
 * Create new resource based on model
 * @param {Object} params
 * @param {Object} req
 * @param {Function} callback
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
 * @param {Object} params
 * @param {Object} req
 * @param {Function} callback
 */
getOne = function (params, req, callback) {
    params.model.findOne({_id: req.params.id}, function (err, item) {
        if (err) {
            errors.errorCatcher(err, req, callback);
        } else {
            if (item === null) {
                callback(null, {code: 404, res: {message: 'Item not found'}});
            } else {
                callback(null, {code: 200, res: item});
            }
        }
    });
};

/**
 * Patch one resource based on model
 * @param {Object} params
 * @param {Object} req
 * @param {Function} callback
 */
var patchOne = function (params, req, callback) {
    delete req.body.created_at;
    delete req.body.updatedAt;

    params.model.findOne({_id: req.params.id}, function (err, item) {
        if (err) {
            errors.errorCatcher(err, req, callback);
        } else {
            if (item === null) {
                callback(null, {code: 404, res: {message: 'Item not found'}});
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
    });
};

/**
 * Function use to delete an element, check before if not used in an asset
 * @param {Object} params
 * @param {Object} req
 * @param {Function} callback
 */
var deleteOne = function (params, req, callback) {
    params.model.remove({_id: req.params.id}, function (err, count) {
        if (err) {
            errors.errorCatcher(err, req, callback);
        } else {
            deleteCatcher(count, req.params.id, callback);
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