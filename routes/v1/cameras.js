/**
 * Created by dbroqua on 8/16/16.
 */

module.exports = function (params) {
    var basePath = params.baseUrl + 'cameras';
    var specificItem = basePath + '/:id';
    var streamItem = specificItem + '/stream';

    var Middle = require('../../middleware/api/v1/cameras'),
        apiProxy = require('http-proxy').createProxyServer();

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
            res.json(['GET','PATCH']);
        });
    app.options(streamItem,
        function (req, res) {
            res.statusCode = 200;
            res.json(['GET']);
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

    app.get(streamItem,
        passport.authenticate(['basic', 'api-key'], {session: false}),
        function (req, res) {
            req.keepPasswords = true;
            Middle.getOne(req, function (err, data) {

                if (data.code === 200) {
                    var isOk = false;
                    var item = data.res;
                    switch (item.type) {
                        case 'Local':
                            apiProxy.web(req, res, {
                                target: item.definition.motion.streamUri,
                                auth: item.definition.motion.login + ':' + item.definition.motion.password
                            });
                            isOk = true;
                            break;
                        case 'Net':
                            req.url = '';
                            var target = item.definition.scheme + '://' + item.definition.uri + ':' + item.definition.port + '/api/v1/cameras/' + item.definition.cameraId + '/stream/';
                            apiProxy.web(req, res, {
                                target: target,
                                auth: item.definition.login + ':' + item.definition.password
                            });
                            isOk = true;
                            break;
                        default:
                            res.status(406).send({message: 'Bad camera type'}).end();
                            break;
                    }

                    if( isOk ){
                        apiProxy.on('error', function(err) {
                            console.log(err);
                        });
                    }

                } else {
                    res.status(data.code).send(data.res).end();
                }
            });
        });
};