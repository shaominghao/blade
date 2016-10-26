
'use strict';
/**
 * Created by hzshaominghao on 2016/10/25.
 */

var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');

var koa = require('koa');
var session = require('koa-generic-session');
var redisStore = require('koa-redis');
var bodyParser = require('koa-body');
var render = require('koa-ejs');
var staticFile = require('koa-static');
var wrapRouter = require('./router');

class Server extends EventEmitter {
    constructor(config) {
        super();

        this.config = config;
        this.app = koa();
        this.app.config = config;

        this.init();
        this.listen();
    }
    /**
     * 初始化app
     */
    init() {
        // render
        render(this.app, {
            root: path.join(this.config.serverRoot, this.config.viewRoot || '/views'),
            layout: false,
            viewExt: 'ejs',
            cache: true
        });


        // staticFile
        this.app.use(staticFile(path.join(this.config.serverRoot, this.config.webRoot || '/webapp')));

        // bodyParser
        let bodyOpt = {
            strict: false
        };
        if(this.config.uploadRoot) {
            // 存在文件上传的情况
            let uploadDir = path.join(this.config.serverRoot, this.config.uploadRoot);
            try {
                fs.accessSync(uploadDir);
            } catch(ex) {
                fs.mkdirSync(uploadDir);
            }

            bodyOpt = Object.assign({
                multipart: true,
                formidable:{uploadDir}
            }, bodyOpt);
        }
        this.app.use(bodyParser(bodyOpt));

        // session
        this.app.keys = ['THIS IS A SECRECT'];
        this.app.use(session({
            store: redisStore(process.appConfig.redis)
        }));

        // xhr or view error
        let errFunc = this.config.onerror
        if(errFunc && typeof errFunc && errFunc.constructor.name === 'GeneratorFunction') {
            this.app.use(function*(next) {
                try {
                    yield next;
                } catch(err) {
                    yield *errFunc.call(this, err);
                }
            });
        }

        // filter & controller
        if(this.config.controller) {
            let controller = this.config.controller;
            // 视图
            if(controller.web) this.config.controllerWeb = controller.web;
            // 异步接口
            if(controller.api) this.config.controllerApi = controller.api;
        }
        let rArr = ['filter', 'controllerApi', 'controllerWeb'];
        for(let item of rArr) {
            let dirpath = this.config[item];
            let flag = item === 'controllerWeb' ? 'web' : item === 'controllerApi' ? 'api' : '';
            let routes = [];
            if(dirpath) {
                let stat = fs.statSync(dirpath);
                if(!stat.isDirectory()) return;

                let subs = fs.readdirSync(dirpath);
                for(let file of subs) {
                    let filePath = path.join(dirpath, file);
                    if(fs.statSync(filePath).isFile() && path.extname(filePath) === '.js') {
                        routes.push(require(filePath));
                    }
                }

                for(let route of routes) {
                    if(typeof route === 'object') {
                        route = wrapRouter(route, flag);
                        this.app.use(route.routes())
                            .use(route.allowedMethods());
                    }
                }
            }
        }

        // app error
        this.app.on('error', (err, ctx) => this.emit('error', err, ctx));
    }
    /**
     * 监听
     */
    listen() {
        this.app.listen(this.config.port);
        console.log(`listening on port: ${this.config.port}`);
    }
}

module.exports = Server;
