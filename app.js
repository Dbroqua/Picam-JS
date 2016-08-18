/**
 * Created by dbroqua on 8/16/16.
 */

// Base url for REST API
var baseUrl = '/api/v1/';

// Declaration of requirement
var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    favicon = require('serve-favicon'),
    FileStreamRotator = require('file-stream-rotator'),
    morgan = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    app = express(),
    env = require('./config'),
    passportStrategies = require('./middleware/libs/passport');

/*--------------------------------------------------------------------------------------------------------------------*/


/**
 * Init Passport
 */
passport.use('basic', passportStrategies.BasicAuth);
passport.use('api-key', passportStrategies.ApiKey);
passport.serializeUser(function(user, done) {
    done(null, user);
});
//-- End of passport init ----------------------------------------------------------------------------------------------


/**
 * Init app
 */
app.set('env', env.env.env );


/**
 * Logs
 */
var logDirectory = __dirname + '/logs';
// ensure log directory exists
if( !fs.existsSync(logDirectory)){
    fs.mkdirSync(logDirectory);
}
// create a rotating write stream
var accessLogStream = FileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: logDirectory + '/access-%DATE%.log',
    frequency: 'daily',
    verbose: true
});
app.use(morgan('combined', {stream: accessLogStream})); // Log file
if (app.get('env') === 'development') {
    app.use(morgan('dev')); // Console log
}


/**
 * Set public dir's
 */
app.use(express.static(path.join(__dirname, 'app')));
app.use('/resources', express.static(path.join(__dirname, 'resources')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
app.use(favicon(path.join(__dirname, 'resources', 'favicon.png')));

/**
 * Define several stuff for application
 */
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.urlencoded({extended: true})); // parse application/x-www-form-urlencoded
app.use(cookieParser()); // cookie parsing middleware
app.use(passport.initialize()); // Initialize passport transaction

/**
 * Set defaults env for all routes
 */
app.use('/', function(req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    // Pass to next layer of middleware
    next();
});

/**
 * Set params object passed for all routes
 * @type {{app: *, baseUrl: string, passport, fs, env: *}}
 */
var params = {
    app: app,
    baseUrl: baseUrl,
    passport: passport,
    fs: fs,
    env: env.env
};

/**
 * List of routes
 */
require('./routes/')(params);
require('./routes/v1/cameras')(params);
require('./routes/install')(params);
//----------------------------------------------------------------------------------------------------------------------

/**
 * catch 404 and forward to error handler
 */
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;