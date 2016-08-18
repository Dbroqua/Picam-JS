/**
 * Created by dbroqua on 8/16/16.
 */
var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    watch = require('gulp-watch'),
    plumber = require('gulp-plumber'),
    autoprefixer = require('gulp-autoprefixer'),
    concat = require('gulp-concat'),
    livereload = require('gulp-livereload'),
    gutil = require('gulp-util'),
    less = require('gulp-less');

/***********************************************************************************************************************
 * NODE JS TASKS
 */
gulp.task('lint', function () {
    return gulp.src(['**/**.js', '!node_modules/**/*.js', '!gulpfile.js', '!app/**'])
        .pipe(jshint({
            "undef": true,
            "unused": true,
            "browser": false,
            "node": true,
            "predef": ["describe", "it"],
            "globals": {},
            "curly": true,
            "eqeqeq": true,
            "esversion": 6,
            "latedef": "nofunc",
            "eqnull": true,
            "quotmark": "single"

        }))
        .pipe(jshint.reporter(stylish));
});
/** END ***************************************************************************************************************/

gulp.task('dev-less', function () { // DEV Env
    return gulp.src(['app/less/*.less'], {base: 'app/'})
        .pipe(plumber())
        .pipe(less({style: 'compressed'}).on('error', gutil.log))
        .pipe(autoprefixer("last 6 versions", "> 1%", "Explorer 7", "Android 2"))
        .pipe(concat('main.css'))
        .pipe(gulp.dest('app/css'))
        .pipe(livereload())
});
gulp.task('dev', function () { // DEV Env watcher
    gulp.watch(['app/less/*.less'], ['dev-less']);  // Watch all the .less files, then run the less task
});