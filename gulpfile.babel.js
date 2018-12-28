import autoPrefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import cssNano from 'gulp-cssnano';
import debug from 'gulp-debug';
import del from 'del';
import esLint from 'gulp-eslint';
import gulp from 'gulp';
import less from 'gulp-less';
import mergeStream from 'merge-stream';
import npmMainfiles from 'gulp-npm-mainfiles';
import rename from 'gulp-rename';
import sass from 'gulp-sass';
import sourceMaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import webServer from 'gulp-webserver';

function startOver() {
	return del('./dist');
}

////////////////////////////////////////////////////////////////////////////////
// BUILD VENDORS
////////////////////////////////////////////////////////////////////////////////

function buildVendors() {
	
	return gulp.src(npmMainfiles(), {
		base: './node_modules',
		since: gulp.lastRun(buildVendors)
	});
	/*
		.pipe(debug())
		.pipe(gulp.dest('./dist/vendors'));
	*/
}

////////////////////////////////////////////////////////////////////////////////
// BUILD HTML
////////////////////////////////////////////////////////////////////////////////

function buildHtml() {
	return gulp.src('./src/**/*.html', { since: gulp.lastRun(buildHtml) })
		.pipe(debug())
		.pipe(gulp.dest('./dist'));
}

////////////////////////////////////////////////////////////////////////////////
// BUILD CSS
////////////////////////////////////////////////////////////////////////////////

function buildCss() {
	const cssStream = gulp.src('./src/**/*.css', { since: gulp.lastRun(buildCss) })
		.pipe(debug());

	const lessStream = gulp.src('./src/**/*.less', { since: gulp.lastRun(buildCss) })
		.pipe(debug())
		.pipe(less())
		.pipe(rename((path) => path.basename += '.less'));

	const scssStream = gulp.src('./src/**/*.scss', { since: gulp.lastRun(buildCss) })
		.pipe(debug())
		.pipe(sass())
		.pipe(rename((path) => path.basename += '.scss'));

	return mergeStream(cssStream, lessStream, scssStream)
		.pipe(autoPrefixer())
		.pipe(gulp.dest('./dist'))
		.pipe(rename((path) => path.basename += '.min'))
		.pipe(sourceMaps.init())
		.pipe(cssNano())
		.pipe(sourceMaps.write('.'))
		.pipe(gulp.dest('./dist'));
}

////////////////////////////////////////////////////////////////////////////////
// BUILD JS
////////////////////////////////////////////////////////////////////////////////

function buildJs() {
	return gulp.src('./src/**/*.js', { since: gulp.lastRun(buildJs) })
		.pipe(debug())
		.pipe(esLint())
		.pipe(esLint.format())
		.pipe(babel())
		.pipe(gulp.dest('./dist'))
		.pipe(rename((path) => path.basename += '.min'))
		.pipe(sourceMaps.init())
		.pipe(uglify())
		.pipe(sourceMaps.write('.'))
		.pipe(gulp.dest('./dist'));
}

////////////////////////////////////////////////////////////////////////////////
// BUILD
////////////////////////////////////////////////////////////////////////////////

const build = gulp.series(startOver, gulp.parallel(buildVendors, buildHtml, buildCss, buildJs));
export default build;

function _watch() {
	gulp.watch('./src/**/*.html', buildHtml);
	gulp.watch(['./src/**/*.css', './src/**/*.less', './src/**/*.scss'], buildCss);
	gulp.watch('./src/**/*.js', buildJs);
}
export const watch = gulp.series(build, _watch);

function _serve() {
	gulp.src('./dist')
		.pipe(webServer({
			directoryListing: {
				enable: true,
				path: './dist'
			},
			livereload: true,
			open: true,
			port: 8080
		}));

	_watch();
}
export const serve = gulp.series(build, _serve);