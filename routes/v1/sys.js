/**
 * Created by dbroqua on 3/27/17.
 */

/**
 * Route declaration for Sys
 *
 * @param {Object} params
 * @returns {Object}
 */
module.exports = function(params) {
    const middle = require('../../middleware/api/v1/sys');
    const basePath = params.baseUrl + 'sys',
        passport = params.passport;
    let router = params.router;

    router.route(basePath)
        .get(
            passport.authenticate(['basic', 'api-key'], {
                session: false
            }),
            function(req, res) {
                middle.getAll(req, function(err, data) {
                    res.status(data.code).send(data.res).end();
                });
            }
        );

    router.route(basePath + '/uptime')
        .delete(
            passport.authenticate(['basic', 'api-key'], {
                session: false
            }),
            function(req, res) {
                middle.reboot(req, function(err, data) {
                    res.status(data.code).send(data.res).end();
                });
            }
        );

    return router;
};