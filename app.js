
'use strict';

let path = require('path');
var Server = require('./src/server/server').server;
var onerror = require('./src/server/error/error');

process.appConfig = require('./src/config/develop.json');

let server = new Server({
    port: 3000,
    controller: {
        web: path.join(__dirname, './server/controller/web'),
        api: path.join(__dirname, './server/controller/api')
    },
    filter:  path.join(__dirname, './server/filter/'),
    serverRoot: __dirname,
    webRoot: './public',
    viewRoot: isOnline||isTest ? './template' : './view',
    uploadRoot: './uploads',
    downloadRoot: './downloads',
    loggerRoot: './log',
    onerror: onerror
}).on('error', function(err, ctx) {
    console.log(err.stack);
});

global.logger = server.logger;
