/**
 * Created by dbroqua on 8/16/16.
 */

/**
 * Route declaration for Users
 * @param {Object} params
 */
module.exports = function (params) {
    var basePath = params.baseUrl + 'users',
        specificItem = basePath + '/:id',
        Middle = require('../../middleware/api/v1/users'),
        middle = new Middle(),
        router = params.router,
        passport = params.passport;

    router.get(basePath,
        passport.authenticate(['basic'], {session: false}),
        function (req, res) {
            middle.getAll(req, function (err, data) {
                res.status(data.code).send(data.res).end();
            });
        });
    router.post(basePath,
        passport.authenticate(['basic'], {session: false}),
        function (req, res) {
            middle.createOne(req, function (err, data) {
                res.status(data.code).send(data.res).end();
            });
        });

    router.get(specificItem,
        passport.authenticate(['basic', 'api-key'], {session: false}),
        function (req, res) {
            middle.getOne(req, function (err, data) {
                res.status(data.code).send(data.res).end();
            });
        });
    router.patch(specificItem,
        passport.authenticate(['basic', 'api-key'], {session: false}),
        function (req, res) {
            middle.patchOne(req, function (err, data) {
                res.status(data.code).send(data.res).end();
            });
        });
    router.delete(specificItem,
        passport.authenticate(['basic', 'api-key'], {session: false}),
        function (req, res) {
            middle.deleteOne(req, function (err, data) {
                res.status(data.code).send(data.res).end();
            });
        });

    return router;
};