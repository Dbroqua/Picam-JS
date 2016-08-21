/**
 * Created by dbroqua on 8/16/16.
 */

module.exports = function (params) {
    var basePath = params.baseUrl + 'users';
    var specificItem = basePath + '/:id';

    var Middle = require('../../middleware/api/v1/users');

    var app = params.app;
    var passport = params.passport;

    app.options(basePath,
        function (req, res) {
            res.statusCode = 200;
            res.json(['GET', 'POST']);
        });
    app.options(specificItem,
        function (req, res) {
            res.statusCode = 200;
            res.json(['GET','PATCH','DELETE']);
        });

    app.get(basePath,
        passport.authenticate(['basic'], {session: false}),
        function (req, res) {
            Middle.getAll(req, function (err, data) {
                res.status(data.code).send(data.res).end();
            });
        });
    app.post(basePath,
        passport.authenticate(['basic'], {session: false}),
        function (req, res) {
            Middle.createOne(req, function (err, data) {
                res.status(data.code).send(data.res).end();
            });
        });

    app.get(specificItem,
        passport.authenticate(['basic', 'api-key'], {session: false}),
        function (req, res) {
            Middle.getOne(req, function (err, data) {
                res.status(data.code).send(data.res).end();
            });
        });
    app.patch(specificItem,
        passport.authenticate(['basic', 'api-key'], {session: false}),
        function (req, res) {
            Middle.patchOne(req, function (err, data) {
                res.status(data.code).send(data.res).end();
            });
        });
    app.delete(specificItem,
        passport.authenticate(['basic', 'api-key'], {session: false}),
        function (req, res) {
            Middle.deleteOne(req, function (err, data) {
                res.status(data.code).send(data.res).end();
            });
        });
};