/**
 * Created by dbroqua on 8/16/16.
 */

/**
 * Route declaration for Install
 * @param {Object} params
 */
module.exports = function (params) {
    var basePath = '/install';
    var app = params.app;
    var firstUser = require('../config').autoInstall;

    var users = require('../models/v1/users'),
        libs = require('../middleware/libs/query');

    var _params = {
        dataModel: users.dataModel,
        model: users.model
    };

    app.options(basePath,
        function (req, res) {
            res.statusCode = 200;
            res.json(['GET']);
        });

    app.get(basePath,
        function (req, res) {
            libs.getAll(_params, req, function(err, data){
                if (data.code === 204 && data.res.totalRows === 0) {
                    req.body = firstUser.user;
                    libs.createOne(_params, req, function(err,data){
                        console.log(err, data);
                        res.status(data.code).send(data.res).end();
                    });
                } else {
                    res.status(406).send('406 not acceptable').end();
                }
            });
        });
};