/**
 * Created by dbroqua on 8/17/16.
 */

/**
 * Route declaration for Base
 * @param {Object} params
 */
module.exports = function(params) {
    var basePath = '/',
        authenticatePath = basePath + 'authenticate',
        router = params.router,
        passport = params.passport;

    router.post(authenticatePath,
        passport.authenticate(['basic'], {
            session: false
        }),
        function(req, res) {
            req.user.password = undefined;
            res.status(200).send(req.user).end();
        });

    router.get(basePath + 'js/env.js',
        function(req, res) {
            res.status(200).send("let APIUri = '" + process.env.APP_URL + "', " +
                "   SERVER_PATH =  APIUri + 'api/v1/', " +
                "   TITLEPrefix = 'PiCam :: ', " +
                "   LIMIT = 10;").end();
        });

    return router;
};