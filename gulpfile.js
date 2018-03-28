/**
 * Created by dbroqua on 8/16/16.
 */
const gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    watch = require('gulp-watch'),
    autoprefixer = require('gulp-autoprefixer'),
    concat = require('gulp-concat'),
    less = require('gulp-less'),
    cssmin = require('gulp-cssmin'),
    esLint = require('gulp-eslint');
const css = ['build/less/*.less'],
    libs = [
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/bootstrap/dist/js/bootstrap.min.js',
        'node_modules/bootbox/bootbox.js',
        'node_modules/angular/angular.min.js',
        'node_modules/angular-base64/angular-base64.min.js',
        'node_modules/angular-cookies/angular-cookies.min.js',
        'node_modules/angular-toastr/dist/angular-toastr.tpls.js',
        'node_modules/angular-route/angular-route.min.js',
        'node_modules/ngbootbox/dist/ngBootbox.min.js'
    ],
    modules = [
        'build/js/main.js',
        'build/js/modules/*.js'
    ],
    sources = [
        'bin/*.js',
        'build/js/**/*.js',
        'middleware/**/*.js',
        'models/**/*.js',
        'routes/**/*.js',
        '*.js'
    ],
    uglifyOptions = {
        compress: {
            drop_console: false,
            global_defs: {
                'DEBUG': false
            }
        }
    };

let onError = function(err) {
    console.log(err);
    this.emit('end');
}

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

gulp.task('build:libs', function() {
    return gulp.src(libs, {
            base: '/'
        })
        .pipe(uglify(uglifyOptions)).on('error', onError)
        .pipe(concat('js/libs.min.js')).on('error', onError)
        .pipe(gulp.dest('app'));
});

gulp.task('build:app', function() {
    return gulp.src(modules, {
            base: '/'
        })
        .pipe(uglify(uglifyOptions)).on('error', onError)
        .pipe(concat('js/app.min.js')).on('error', onError)
        .pipe(gulp.dest('app'));
});

gulp.task('build:css', function() {
    return gulp.src(css, {
            base: '/'
        })
        .pipe(less({
            style: 'compressed'
        }).on('error', onError))
        .pipe(autoprefixer('last 4 versions', '> 1%', 'Explorer 7', 'Android 2'))
        .pipe(concat('main.min.css'))
        .pipe(cssmin().on('error', function(err) {
            console.log(err);
        }))
        .pipe(gulp.dest('app/css'))
});

gulp.task('build:watch', function() {
    gulp.watch(css, ['build:css']);
    gulp.watch(modules, ['build:app']);
})
gulp.task('build', ['build:css', 'build:libs', 'build:app']);
gulp.task('default', ['build:watch']);