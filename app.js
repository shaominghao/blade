
'use strict';

exports.start = function(options) {
    // init parameters
    var opt = {
        port   : 80,
        source : !1
    };
    Object.assign(opt,options);
    // init config
    process.appConfig = Object.assign({
        appRoot: __dirname
    },require('./server/config/develop.json'));
    // create a server
    var app = new (require('./server/arch/BServer'))({
        port : opt.port,
        view : {
            resolver : "EJSResolver"
        },
        roots:{
            "appRoot"    : __dirname,
            "webRoot"    : "/public/",
            "webPath"    : "/server/controller/web/",
            "apiPath"    : "/server/controller/api/"
        },
        routes  : require('./server/config/router.json')
    });
    // start up server

    app.start();
};
