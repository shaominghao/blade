/**
 * Router Delegate Middleware
 *
 */
"use strict";
// variables
let util = require('util'),
    path = require('path');
/**
 * Router Delegate， Routes rule config
 *
 * ```json
 * {
 *      "get /page":{
 *          "view": "/page",
 *          "action": "SiteController.home"
 *      },
 *
 *      "get /api/user": "UserController.get",
 *      "get /api/users: "UserController.search",
 *      "post /api/user/add": "UserController.create",
 *      "patch /api/user/:id": "UserController.update",
 *      "delete /api/user/:id": "UserController.remove"
 * }
 * ```
 *
 * @param {Object} options - config options
 * @param {Object} options.routes - route rule config
 * @param {Object} options.roots  - root path config
 * @param {String} options.roots.appRoot  - app root path
 * @param {String} options.roots.webRoot  - web root path
 * @param {String} options.roots.webPath  - web controller root path
 * @param {String} options.roots.apiPath  - api controller root path
 */
module.exports = function(options){
    // parse resource root
    let roots  = options.roots,
        routes = options.routes,
        apiRoot = path.join(
            roots.appRoot,
            roots.apiPath||'/controller/api/'
        ),
        webRoot = path.join(
            roots.appRoot,
            roots.webPath||'/controller/web/'
        );
    // map routers
    let router = new (require('koa-router'))();
    Object.keys(routes).forEach(function(key){
        // ['get','/login']
        let arr = key.split(/\s+/);
        // default request method is get
        if (arr.length<2){
            arr.unshift('get');
        }
        let func = router[arr[0].toLowerCase()];
        // method not supported
        if (!func){
            return;
        }
        // map url to controller method
        let it = routes[key],
            root = apiRoot,
            action = it,
            view = null;
        // page request
        if (util.isObject(it)&&!!it.view){
            root = webRoot;
            view = it.view;
            action = it.action;
        }
        // parse Controller and method name
        // ['UserController','login']
        let brr = action.split('.'),
            method = brr[1],
            file = path.join(root,brr[0]+'.js');
        // map url to controller method
        func.call(router,arr[1],function *(next){
            if (!!view){
                this.viewFile = view;
            }
            let ctrl = new (require(file))(
                this, next
            );
            yield ctrl[method]();
            // save model to context
            this.model = this.model||ctrl.model;
            this.body = this.model;
        });
    });
    return router.routes();
};