/**
 * Created by dbroqua on 8/16/16.
 */
var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish');

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
            "predef": [ "describe", "it"],
            "globals": { },
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