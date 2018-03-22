/**
 * Created by dbroqua on 8/16/16.
 */

/**
 * Route declaration for Cameras
 * @param {Object} params
 */
module.exports = function (params) {
    let basePath = params.baseUrl + 'cameras',
        specificItem = basePath + '/:id',
        streamItem = specificItem + '/stream',
        filesItem = specificItem + '/files',
        specificFilesItem = filesItem + '/:file',
        router = params.router,
        passport = params.passport,
        middle = require('../../middleware/api/v1/cameras'),
        middleFiles = require('../../middleware/api/v1/files'),
        apiProxy = require('http-proxy').createProxyServer(),
        exec = require('child_process').exec,
        fs = require('fs'),
        request = require('request');

    router.route(basePath)
        .get(
            passport.authenticate(['basic', 'api-key'], {session: false}),
            function (req, res) {
                middle.getAll(req, function (err, data) {
                    res.status(data.code).send(data.res).end();
                });
            }
        )
        .post(
            passport.authenticate(['basic'], {session: false}),
            function (req, res) {
                middle.createOne(req, function (err, data) {
                    res.status(data.code).send(data.res).end();
                });
            })
        .patch(
            passport.authenticate(['basic', 'api-key'], {session: false}),
            function (req, res) {
                middle.patchAll(req, function (err, data) {
                    res.status(data.code).send(data.res).end();
                });
            });

    router.route(specificItem)
        .get(
            passport.authenticate(['basic', 'api-key'], {session: false}),
            function (req, res) {
                middle.getOne(req, function (err, data) {
                    res.status(data.code).send(data.res).end();
                });
            })
        .patch(
            passport.authenticate(['basic', 'api-key'], {session: false}),
            function (req, res) {
                middle.patchOne(req, function (err, data) {
                    res.status(data.code).send(data.res).end();
                });
            })
        .delete(
            passport.authenticate(['basic', 'api-key'], {session: false}),
            function (req, res) {
                middle.deleteOne(req, function (err, data) {
                    res.status(data.code).send(data.res).end();
                });
            });

    router.route(streamItem)
        .get(
            passport.authenticate(['basic', 'api-key'], {session: false}),
            function (req, res) {
                req.keepPasswords = true;
                middle.getOne(req, function (err, data) {
                    if (data.code === 200) {
                        let isOk = false,
                            item = data.res;
                        req.url = '';
                        switch (item.type) {
                            case 'Local':
                                exec('grep "stream_authentication" /etc/motion.conf|cut -d" " -f 2', function (err, stdout) {
                                    if (!err) {
                                        apiProxy.web(req, res, {
                                            target: item.definition.motion.streamUri,
                                            auth: stdout.replace(/(\r\n|\n|\r)/gm, '')
                                        });
                                        isOk = true;
                                    } else {
                                        res.status(500).send({message: 'Internal server error'}).end();
                                    }
                                });
                                break;
                            case 'Net':
                                let target = item.definition.scheme + '://' + item.definition.uri + ':' +
                                    item.definition.port + '/api/v1/cameras/' + item.definition.cameraId + '/stream/?apikey=' +
                                    item.definition.apikey;
                                apiProxy.web(req, res, {
                                    target: target
                                });
                                isOk = true;
                                break;
                            default:
                                res.status(406).send({message: 'Bad camera type'}).end();
                                break;
                        }

                        if (isOk) {
                            apiProxy.on('error', function (err) {
                                console.log(err);
                            });
                        }

                    } else {
                        res.status(data.code).send(data.res).end();
                    }
                });
            })
        .get(
            passport.authenticate(['basic', 'api-key'], {session: false}),
            function (req, res) {
                middleFiles.getAll(req, function (err, data) {
                    res.status(data.code).send(data.res).end();
                });
            });

    router.route(specificFilesItem)
        .get(
            passport.authenticate(['basic', 'api-key'], {session: false}),
            function (req, res) {
                middleFiles.getOne(req, function (err, data) {
                    if (data.code !== 200) {
                        res.status(data.code).send(data.res).end();
                    } else {
                        if (data.res.type === 'Net') {
                            let camera = data.res.camera;
                            request.get({
                                url: camera.definition.scheme + '://' + camera.definition.uri + ':' + camera.definition.port +
                                '/api/v1/cameras/' + camera.definition.cameraId + '/files/' + req.params.file + '?apikey=' +
                                camera.definition.apikey,
                                timeout: 15000
                            }).pipe(res);
                        } else {
                            let fileInfos = data.res;
                            res.status(200);
                            res.setHeader('Content-Length', fileInfos.size);
                            res.setHeader('Content-Type', fileInfos.mimeType);
                            fs.createReadStream(fileInfos.file).pipe(res);
                        }
                    }
                });
            });

    return router;
};