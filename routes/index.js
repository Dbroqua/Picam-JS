/**
 * Created by dbroqua on 8/17/16.
 */

/**
 * Route declaration for Base
 * @param {Object} params
 */
module.exports = function (params) {
    let basePath = '/',
        authenticatePath = basePath + 'authenticate',
        router = params.router,
        passport = params.passport;

    router.route(authenticatePath)
        .post(
            passport.authenticate(['basic'], {session: false}),
            function (req, res) {
                req.user.password = undefined;
                res.status(200).send(req.user).end();
            });

    return router;
};