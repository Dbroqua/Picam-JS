/**
 * Created by dbroqua on 8/16/16.
 */
const gulp = require('gulp'),
    watch = require('gulp-watch'),
    plumber = require('gulp-plumber'),
    autoprefixer = require('gulp-autoprefixer'),
    concat = require('gulp-concat'),
    livereload = require('gulp-livereload'),
    gutil = require('gulp-util'),
    less = require('gulp-less'),
    esLint = require('gulp-eslint');
const sources = [
    'bin/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    '*.js'
];

gulp.task('validate:eslint', function() {
    'use strict';
    /**
     * rules applied can be found at
     * http://eslint.org/docs/rules/#best-practices
     **/
    return gulp.src(sources)
        .pipe(esLint({
            'extends': 'eslint:all',
            'parserOptions': {
                'ecmaVersion': 6,
                'sourceType': 'script'
            },
            'env': {
                'node': true,
                'es6': true,
                'browser': false
            },
            'ecmaFeatures': {
                'arrowFunctions': true,
                'blockBindings': true,
                'classes': true,
                'defaultParameters': true,
                'destructuring': true,
                'forOf': true,
                'generators': true,
                'modules': true,
                'objectLiteralComputedProperties': true,
                'objectLiteralDuplicateProperties': true,
                'objectLiteralShorthandMethods': true,
                'objectLiteralShorthandProperties': true,
                'regexUFlag': true,
                'regexYFlag': true,
                'restParams': true,
                'spread': true,
                'superInFunctions': true,
                'templateStrings': true,
                'unicodeCodePointEscapes': true,
                'globalReturn': true
            },
            'rules': {
                'max-len': [2, {
                    'code': 180,
                    'tabWidth': 4,
                    'ignoreUrls': true
                }],
                'valid-typeof': 2,
                'linebreak-style': ['error', 'unix'],
                'no-mixed-requires': [2, false],
                'no-new-require': 2,
                'no-path-concat': 2,
                'no-process-exit': 0,
                'no-restricted-modules': 0,
                'no-sync': 1,
                'curly': 2,
                'default-case': 1,
                'dot-notation': 1,
                'eqeqeq': [2, 'always'],
                'guard-for-in': 1,
                'no-alert': 1,
                'no-caller': 1,
                'no-div-regex': 1,
                'no-else-return': 0,
                'no-empty-function': 0,
                'no-extra-semi': 1,
                'no-eq-null': 1,
                'no-eval': 1,
                'no-with': 1,
                'comma-dangle':  2,
                'quotes':  [2, 'single'],
                'dot-location': [2, 'property'],
                'dot-notation': 2,
                'yoda': [2, 'never'],
                'vars-on-top': 2,
                'no-useless-return': 1,
                'valid-jsdoc': [2, {
                    'prefer': {
                        'arg': 'param',
                        'argument': 'param',
                        'class': 'constructor',
                        'return': 'returns',
                        'virtual': 'abstract'
                    },
                    'matchDescription': '.+',
                    'requireReturn': false,
                    'requireReturnDescription': false,
                    'requireParamDescription': false,
                    'preferType': {
                        'object': 'Object',
                        'String': 'String'
                    }
                }]
            }
        }))
        .pipe(esLint.format());
});

gulp.task('dev-less', function() { // DEV Env
    return gulp.src(['app/less/*.less'], {
            base: 'app/'
        })
        .pipe(plumber())
        .pipe(less({
            style: 'compressed'
        }).on('error', gutil.log))
        .pipe(autoprefixer('last 6 versions', '> 1%', 'Explorer 7', 'Android 2'))
        .pipe(concat('main.css'))
        .pipe(gulp.dest('app/css'))
        .pipe(livereload())
});

gulp.task('dev', function() { // DEV Env watcher
    gulp.watch(['app/less/*.less'], ['dev-less']); // Watch all the .less files, then run the less task
});

gulp.task('default', ['validate:eslint']);