# Static SSI

Gulp-задача для замены [SSI-вставок](https://en.wikipedia.org/wiki/Server_Side_Includes) внутри файлов на их содержимое. Пока поддерживается только `<!--#include file="..."-->`.

```js
var gulp = require('gulp');
var ssi = require('static-ssi');

gulp.src('./index.html')
.pipe(ssi())
.pipe(gulp.dest());
```