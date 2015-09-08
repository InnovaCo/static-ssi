'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var vfs = require('vinyl-fs');
var through = require('through2');
var mod = require('../');

var replaced = 'hello world\ninc1\ninc2';

describe('Replace SSI', function() {
	it('in string', function(done) {
		var file = path.join(__dirname, 'files/index.html');
		fs.readFile(file, 'utf8', function(err, contents) {
			assert(!err);
			mod.replace(path.dirname(file), contents, function(err, c) {
				assert(!err);
				assert.equal(c, replaced);
				done();
			});
		});
	});

	it('in VinylFS buffer file', function(done) {
		var files = 0;
		vfs.src('files/index.html', {cwd: __dirname})
		.pipe(mod())
		.pipe(through.obj(function(file, enc, next) {
			files++;
			assert.equal(file.contents.toString(), replaced);
			next(null, file);
		}))
		.on('finish', function() {
			assert.equal(files, 1);
			done();
		});
	});

	it('in VinylFS stream file', function(done) {
		var files = 0;
		vfs.src('files/index.html', {cwd: __dirname, buffer: false})
		.pipe(mod())
		.pipe(through.obj(function(file, enc, next) {
			files++;
			var chunks = [];
			file.contents = file.contents.pipe(through(function(chunk, enc, next) {
				chunks.push(chunk);
				next(null, chunk);
			}, function(next2) {
				assert.equal(Buffer.concat(chunks).toString(), replaced);
				next2();
				next(null, file);
			}));
		}))
		.on('finish', function() {
			assert.equal(files, 1);
			done();
		});
	});
});