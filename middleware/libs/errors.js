/**
 * Created by dbroqua on 8/16/16.
 */

/**
 * Function for escape errors
 * @param {Object} err
 * @param {Object} req
 * @param {Function} callback
 */
var errorCatcher = function (err, req, callback) {
    console.log(err);
    if (err.code !== undefined) {
        switch (err.code) {
            case -1:
                callback(err, {code: 406, res: {message: 'Id for ' + err.idType + ' is not valid'}});
                break;
            case 11000: //On insert
            case 11001: //On update
                callback(err, {code: 409, res: {message: 'Duplicate'}});
                break;
            case 406:
                callback(err, err);
                break;
            case 'ENOENT':
                callback(err, {code: 404, res: {message: 'File not found'}});
                break;
            case 'ECONNREFUSED':
                callback(err, {code: 503, res: {message: 'Connection refused'}});
                break;
            default:
                callback(err, {code: 500, res: {message: 'Internal server error'}});
        }
    } else if (err.name !== undefined) {
        callback(err, {code: 406, res: {message: err.message}});
    } else {
        callback(err, {code: 500, res: {message: 'Internal server error'}});
    }
};

exports.errorCatcher = errorCatcher;