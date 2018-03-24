/**
 * Created by dbroqua on 8/16/16.
 */

/**
 * Route declaration for Install
 *
 * @param {Object} params
 * @returns {Object}
 */
module.exports = function(params) {
    const firstUser = require('../config').autoInstall,
        users = require('../models/v1/users'),
        libs = require('../middleware/libs/query');
    const basePath = '/install',
        _params = {
            dataModel: users.dataModel,
            model: users.model
        };
    let router = params.router;

    router.route(basePath)
        .get(
            function(req, res) {
                libs.getAll(_params, req, function(err, data) {
                    if (data.code === 204 && data.res.totalRows === 0) {
                        req.body = firstUser.user;
                        libs.createOne(_params, req, function(err, data) {
                            console.log(err, data);
                            res.status(data.code).send(data.res).end();
                        });
                    } else {
                        res.status(406).send('406 not acceptable').end();
                    }
                });
            });

    return router;
};