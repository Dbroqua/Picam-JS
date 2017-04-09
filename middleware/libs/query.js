/**
 * Created by dbroqua on 8/16/16.
 */

let mongoose = require('mongoose'),
    url = require('url'),
    errors = require('./errors');

/**
 * Return the size of an object
 * @param {Object} obj
 * @returns {number}
 */
Object.size = function (obj) {
    let size = 0, key;
    for (key in obj) {
        size++;
    }
    return size;
};

class Queries {
    /**
     * Internal function for queryBuilder
     * @param {Object} req
     * @param {Function} callback
     * @private
     */
    static _querySearchBuilder(req, callback) {
        let urlParams = url.parse(req.url, true).query,
            isInError = false,
            code = 200,
            message = '',
            searchObj = {},
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
        let _queryType = function (value, comparisonSymbol) {
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
        let _runCallBack = function () {
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
            for (let key in urlParams) {
                //Extracting query filters
                let params = key.split('.'), //Split key in data
                    paramsLength = params.length;
                if (params[0] === 'q' && paramsLength >= 3) {
                    value = urlParams[key]; //Value of current item
                    comparisonSymbol = params[paramsLength - 1]; //Type of query (like, <, >, in, ...)
                    searchCol = ''; //final search key in object

                    for (let i = 1; i < paramsLength - 1; i++) {
                        searchCol += ( searchCol !== '' ? '.' : '' ) + params[i];
                    }

                    currentIndex++;
                    _queryType(value, comparisonSymbol);
                    _runCallBack();
                } else {
                    currentIndex++;
                    _runCallBack();
                }
            }
        }
    }

    /**
     * Function for send callback on delete method
     * @param {Object} count
     * @param {Function} callback
     */
    static _deleteCatcher(count, callback) {
        let res = count.result;
        if (res.ok > 0) {
            if (res.n === 0) {
                callback(null, {code: 404, res: {message: 'Item not found'}});
            } else {
                callback(null, {code: 200, res: {message: 'Item deleted'}});
            }
        } else {
            callback(null, {code: 500, res: {message: 'Error while trying to remove this object'}});
        }
    }

    /**
     * Function for generate some filters on get list of collection
     * @param {Object} req
     * @param {Object} model
     * @param {Function} callback
     */
    static _queryBuilder(req, model, callback) {
        let that = this,
            urlParams = url.parse(req.url, true).query,
            isInError = false,
            code = 200,
            message = '',
            searchObj = {},
            i = 0,
            page = 1,
            limit = 0;

        that._querySearchBuilder(req, function (err, data) {
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
                let query = model.find(searchObj),
                    queryCount = model.find(searchObj);

                //List of returned fields ----------------------------------------------------------------------------------
                let fields = {};
                if (urlParams.fields !== undefined) {
                    let listOfFields = urlParams.fields.split(','), //List of desired returned fields
                        nbFields = listOfFields.length, //Number of desired returned fields
                        wantShowId = false; //Show _id of item or not ?

                    if (nbFields > 0 && listOfFields[0] !== '') { //If fields param not empty
                        for (i = 0; i < nbFields; i++) { //For each field check if exist in model
                            if (listOfFields[i] === '_id') { //If field is _id
                                wantShowId = true;
                                fields._id = 1;
                            } else { //Other case
                                fields[listOfFields[i]] = 1;
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
                    let sort = {},
                        sortColumn = urlParams.sort, //Copy sort filters in tmp variable
                        dir = 1; //By default we suppose user want ASC sort
                    if (urlParams.sort.indexOf('-') === 0) { //User want DESC sort
                        sortColumn = urlParams.sort.substr(1);
                        dir = -1;
                    }

                    sort[sortColumn] = dir;
                    query.sort(sort);
                    queryCount.sort(sort);
                }
                //----------------------------------------------------------------------------------------------------------

                //Paginate mode --------------------------------------------------------------------------------------------
                if (urlParams.page !== undefined && urlParams.limit !== undefined && urlParams.limit > 0) {
                    limit = Number(urlParams.limit);
                    let _page = ( Number(urlParams.page) > 1 ? ( Number(urlParams.page) - 1 ) : 0 );
                    page = Number(urlParams.page);
                    let firstElement = _page * limit;
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
                            let totalRows = count;

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
    }

    /**
     * Get all resources from one model based on filters
     * @param {Object} params
     * @param {Object} req
     * @param {Function} callback
     */
    static getAll(params, req, callback) {
        this._queryBuilder(req,params.model, function (err, data) {
            if (err) {
                errors.errorCatcher(err, callback);
            } else {
                callback(null, {code: (data.filteredRows > 0 ? 200 : 204 ), res: data});
            }
        });
    }

    /**
     * Create new resource based on model
     * @param {Object} params
     * @param {Object} req
     * @param {Function} callback
     */
    static createOne(params, req, callback) {
        let newItem = new params.model(req.body);
        params.newItem = newItem;

        newItem.save(function (err, item) {
            if (err) {
                errors.errorCatcher(err, callback);
            } else {
                callback(null, {code: 201, res: item});
            }
        });
    }

    /**
     * Get one resource based on model restricted by Id
     * @param {Object} params
     * @param {Object} req
     * @param {Function} callback
     */
    static getOne(params, req, callback) {
        params.model.findOne({_id: req.params.id}, function (err, item) {
            if (err) {
                errors.errorCatcher(err, callback);
            } else {
                if (item === null) {
                    callback(null, {code: 404, res: {message: 'Item not found'}});
                } else {
                    callback(null, {code: 200, res: item});
                }
            }
        });
    }

    /**
     * Patch one resource based on model
     * @param {Object} params
     * @param {Object} req
     * @param {Function} callback
     */
    static patchOne(params, req, callback) {
        delete req.body.created_at;
        delete req.body.updatedAt;

        params.model.findOne({_id: req.params.id}, function (err, item) {
            if (err) {
                errors.errorCatcher(err, callback);
            } else {
                if (item === null) {
                    callback(null, {code: 404, res: {message: 'Item not found'}});
                } else {
                    delete req.body.created_at;
                    delete req.body.updatedAt;
                    delete req.body.timeout;
                    params.model.update({_id: req.params.id}, req.body, {upsert: true}, function (err) {
                        if (err) {
                            errors.errorCatcher(err, callback);
                        } else {
                            callback(null, {code: 200, res: req.body});
                        }
                    });
                }
            }
        });
    }

    /**
     * Function use to delete an element, check before if not used in an asset
     * @param {Object} params
     * @param {Object} req
     * @param {Function} callback
     */
    static deleteOne(params, req, callback) {
        let that = this;
        params.model.remove({_id: req.params.id}, function (err, count) {
            if (err) {
                errors.errorCatcher(err, callback);
            } else {
                that._deleteCatcher(count, callback);
            }
        });
    }
}

module.exports = Queries;