const gulp = require('gulp')
const sourcemaps = require('gulp-sourcemaps')
const babel = require('gulp-babel')
const standard = require('gulp-standard')

const SOURCES = 'src/**/*.js'
const DIST = 'dist'

// Uses 'standard' javascript style enforcement
gulp.task('standard', () => {
  return gulp.src(SOURCES)
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true
    }))
})

// Sets up nice development environment
gulp.task('develop', () => {
  gulp.watch(SOURCES, ['standard', 'babel'])
})

// Performs transpilation
gulp.task('babel', ['standard'], () => {
  return gulp.src(SOURCES)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(DIST))
})

gulp.task('default', ['develop', 'standard', 'babel'])
