const browserify = require('browserify')
const fs = require('fs')

browserify().require('./index.js', {expose: 'ieee1888'})
    .transform('brfs', { global: true }).bundle().pipe(fs.createWriteStream('ieee1888.js'))
