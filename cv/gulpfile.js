'use strict';

/** Check package.json for dev dependencies. */

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const minifycss = require('gulp-minify-css');
const autoprefixer = require('gulp-autoprefixer');

/** Compile SASS Files
1. Compile SASS files.
2. Run autoprefixer on the compiled CSS.
3. Minify the CSS output.
4. Write sourcemaps.
5. Output to css directory.
*/
gulp.task('css', () => {
	
	return gulp.src('./sass/styles.scss')
			.pipe(plumber())
			.pipe(sourcemaps.init())
			.pipe(sass({
				outputStyle: 'compressed'
			}))
			.on('error', sass.logError)
			.pipe(autoprefixer())
			.pipe(minifycss({
				keepSpecialComments: true
			}))
			.pipe(sourcemaps.write('./'))
			.pipe(plumber.stop())
			.pipe(gulp.dest('./'))
});


/** Compile all SCSS and JS files. */
gulp.task('default', () => {
	
	return gulp.start('css');
	
});

/** Watch for changes to SCSS and JS files. */
gulp.task('watch', () => {
	gulp.watch('./sass/*.scss', { cwd: './' }, ['css']);
});