/**
 * Created by dbroqua on 8/16/16.
 */

/**
 * Route declaration for Users
 *
 * @param {Object} params
 * @returns {Object}
 */
module.exports = function(params) {
    const middle = require('../../middleware/api/v1/users');
    const basePath = params.baseUrl + 'users',
        specificItem = basePath + '/:id',
        passport = params.passport;
    let router = params.router;

    router.route(basePath)
        .post(
            passport.authenticate(['basic'], {
                session: false
            }),
            function(req, res) {
                middle.createOne(req, function(err, data) {
                    res.status(data.code).send(data.res).end();
                });
            })
        .get(
            passport.authenticate(['basic'], {
                session: false
            }),
            function(req, res) {
                middle.getAll(req, function(err, data) {
                    res.status(data.code).send(data.res).end();
                });
            });

    router.route(specificItem)
        .get(
            passport.authenticate(['basic', 'api-key'], {
                session: false
            }),
            function(req, res) {
                middle.getOne(req, function(err, data) {
                    res.status(data.code).send(data.res).end();
                });
            })
        .patch(
            passport.authenticate(['basic', 'api-key'], {
                session: false
            }),
            function(req, res) {
                middle.patchOne(req, function(err, data) {
                    res.status(data.code).send(data.res).end();
                });
            })
        .delete(
            passport.authenticate(['basic', 'api-key'], {
                session: false
            }),
            function(req, res) {
                middle.deleteOne(req, function(err, data) {
                    res.status(data.code).send(data.res).end();
                });
            });

    return router;
};