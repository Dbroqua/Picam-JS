/**
 * Created by dbroqua on 8/16/16.
 */

const express = require('express'),
    path = require('path'),
    fs = require('fs'),
    favicon = require('serve-favicon'),
    FileStreamRotator = require('file-stream-rotator'),
    morgan = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    env = require('./config');
const baseUrl = '/api/v1/'; //Base url for REST API
let app = express(),
    logDirectory = path.join(__dirname, 'logs');

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * Init Passport
 */
require('./middleware/libs/passport')(passport); //Pass passport for configuration
//-- End of passport init ----------------------------------------------------------------------------------------------

/**
 * Init app
 */
app.set('env', env.env.env);

/**
 * Logs
 */
let setLogs = function() {
    //Create a rotating write stream
    let accessLogStream = FileStreamRotator.getStream({
        date_format: 'YYYYMMDD',
        filename: logDirectory + '/access-%DATE%.log',
        frequency: 'daily',
        verbose: true
    });
    app.use(morgan('combined', {
        stream: accessLogStream
    })); //Log file
    if (app.get('env') === 'development') {
        app.use(morgan('dev')); //Console log
    }
};
fs.stat(logDirectory, function(err, stats) {
    if (err) {
        fs.mkdir(logDirectory, function(err) {
            if (err) {
                //throw exception
            } else {
                setLogs();
            }
        })
    } else {
        setLogs();
    }
});

/**
 * Set public dir's
 */
app.use(express.static(path.join(__dirname, 'app')));
app.use('/resources', express.static(path.join(__dirname, 'resources')));
app.use('/documentation', express.static(path.join(__dirname, 'documentation')));
app.use('/static', express.static(path.join(__dirname, 'node_modules')));
app.use(favicon(path.join(__dirname, 'resources', 'favicon.png')));

/**
 * Define several stuff for application
 */
app.use(bodyParser.json()); //Parse application/json
app.use(bodyParser.urlencoded({
    extended: true
})); //Parse application/x-www-form-urlencoded
app.use(cookieParser()); //Cookie parsing middleware
app.use(passport.initialize()); //Initialize passport transaction

/**
 * Set defaults env for all routes
 */
app.use('/',
    /**
     * Set defaults Headers
     *
     * @param {Object} req
     * @param {Object} res
     * @param {Function} next
     */
    function(req, res, next) {
        //Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');
        //Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        //Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        //Pass to next layer of middleware
        next();
    }
);

/**
 * Set params object passed for all routes
 * @type {{app: *, baseUrl: string, passport, fs, env: *}}
 */
let params = {
    router: express.Router(),
    baseUrl: baseUrl,
    passport: passport,
    fs: fs,
    env: env.env
};

/**
 * List of routes
 */
app.use('/', require('./routes/')(params));
app.use('/', require('./routes/v1/cameras')(params));
app.use('/', require('./routes/v1/users')(params));
app.use('/', require('./routes/install')(params));
//----------------------------------------------------------------------------------------------------------------------

app.use(
    /**
     * catch 404 and forward to error handler
     * @param {Object} req
     * @param {Object} res
     * @param {Function} next
     */
    function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

//Error handlers
//Development error handler
//Will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

//Production error handler
//No stacktraces leaked to user
app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;