/**
 * Created by dbroqua on 8/17/16.
 */

/**
 * Route declaration for Base
 * @param {Object} params
 */
module.exports = function (params) {
    var basePath = '/';
    var authenticatePath = basePath + 'authenticate';
    var app = params.app;
    var passport = params.passport;

    app.options(authenticatePath,
        function (req, res) {
            res.statusCode = 200;
            res.json(['POST']);
        });

    app.post(authenticatePath,
        passport.authenticate(['basic'], {session: false}),
        function (req, res) {
            req.user.password = undefined;
            res.status(200).send(req.user).end();
        });
};