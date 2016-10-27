'use strict';
/**
 * 包装并生成路由
 */

var Router = require('koa-router');

const methodMap = {
    get: ['get'],
    post: ['post'],
    put: ['put'],
    delete: ['del'],
    patch: ['patch'],
    head: ['head'],
    all: ['get', 'post', 'put', 'del', 'patch', 'head']
};
const methods = Object.keys(methodMap);
// 空函数
var plainFunc = function*(next) {yield next;};
// 异步请求终结函数
var finApiFunc = function*(next) {
    yield next;
};
// 视图请求终结函数
var finWebFunc = function*(next) {
    let header = this.request.header;
    if((header['x-requested-with'] || '').toLowerCase() === 'xhr') {
        // ignore
    } else {
        let data = Object.assign({}, this.response.body);
        yield this.render(this.tpl, data);
    }
};

module.exports = function getRouter(map, flag) {
    let router = Router();
    let urls = Object.keys(map);
    for(let url of urls) {
        let item = map[url];
        let isRegexp = item.isRegexp || false;
        let before = item.before || plainFunc;
        let after = item.after || plainFunc;
        let fin = item.fin || flag === 'api' ? finApiFunc : flag === 'web' ? finWebFunc : plainFunc;

        for(let method of methods) {
            if(item.hasOwnProperty(method) && typeof item[method] === 'function') {
                let func = item[method];
                let routes = methodMap[method];

                for(let route of routes) {
                    // 注册路由
                    if(isRegexp) {
                        // 使用正则作为路由
                        url = new RegExp(url);
                    }
                    router[route](url, before, func, after, fin);
                }
            }
        }
    }

    return router;
};
