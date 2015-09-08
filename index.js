'use strict';
var fs = require('fs');
var path = require('path');
var through = require('through2');

var reInclude = /<\!\-\-#include\s+file=['"](.+?)['"]\s*\-\->/g;

module.exports = function() {
	return through.obj(function(file, enc, next) {
		if (file.isNull()) {
			return next(null, file);
		}

		var baseDir = path.dirname(file.path);
		if (file.isStream()) {
			file.contents = file.contents.pipe(streamReplace(baseDir));
			return next(null, file);
		}

		replace(baseDir, file.contents.toString(), function(err, contents) {
			if (!err) {
				file.contents = new Buffer(contents);
			}
			next(err, file);
		});
	});
};

var streamReplace = module.exports.streamReplace = function(baseDir) {
	var chunks = [], len = 0;
	return through(function(chunk, enc, next) {
		chunks.push(chunk);
		len += chunk.length;
		next();
	}, function(next) {
		var self = this;
		replace(baseDir, Buffer.concat(chunks, len).toString(), function(err, contents) {
			chunks = null;
			if (!err) {
				self.push(new Buffer(contents));
			}

			return next(err);
		});
	});
}

var replace = module.exports.replace = function(baseDir, contents, callback) {
	var matches = [], m;
		
	// сначала найдём все вставки
	while (m = reInclude.exec(contents)) {
		matches.push(m);
	}

	// в обратном поряке и асинхронном режиме заменяем SSI-вставки на содержимое
	// файлов
	var step = function() {
		if (!matches.length) {
			return callback(null, contents);
		}

		var m = matches.pop();
		fs.readFile(path.resolve(baseDir, m[1]), 'utf8', function(err, cn) {
			if (err) {
				return callback(err);
			}

			contents = contents.slice(0, m.index) + cn + contents.slice(m.index + m[0].length);
			step();
		});
	};

	step();
};