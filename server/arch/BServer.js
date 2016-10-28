/**
 * Created by hzshaominghao on 2016/10/25.
 */
"use strict";
// variables
let path = require('path'),
    koa  = require('koa');
let redisStore = require('koa-redis');
// default static config
const STATIC = {
    defer  : !1,
    maxage : 30*24*60*60*1000
};

/**
 * Base Server Class
 *
 * @extends NObject
 */
class BServer extends require('../BObject'){
    /**
     * Create an App Server
     *
     * @param  {Object} options - server config object
     * @param  {Number} options.port     - server listen port
     * @param  {String} options.hostname - server hostname
     * @param  {Object} options.session  - session config
     * @param  {Object} options.view     - view resolver config
     * @param  {Object} options.roots    - root path config
     * @param  {Object} options.routes   - router config
     * @param  {Object} options.filters  - filter config
     */
    constructor(options) {
        super();
        // save server options
        this._options = [options.port||'80'];
        if (options.hostname){
            this._options.push(options.hostname);
        }

        this._app = koa();
        // error handler
        this._app.on('error',this._handleException.bind(this));
        // overwrite session store
        let sess = {
            key:'BLADE_SESSIONID',
            store: redisStore(process.appConfig.redis)
        };
        // add common middleware
        this.use([
            require('koa-better-body')(),
            require('koa-generic-session')(sess),
            require('../middleware/router')(options),
            require('koa-static')(
                path.join(
                    options.roots.appRoot,
                    options.roots.webRoot
                ),STATIC
            )
        ]);
    }

    /**
     * handle error
     * @private
     * @param  {Error} err - error information
     * @return {Void}
     */
    _handleException(err) {
        log.error(err);
    }

    /**
     * support use middleware list
     * @param  {Array|GeneratorFunction} mw - middlewares
     * @return {Void}
     */
    use(mw) {
        if (Array.isArray(mw)){
            mw.forEach(this.use,this);
            return;
        }
        this._app.use(mw);
    }

    /**
     * startup server
     * @return {Void}
     */
    start() {
        if (!this._server){
            this._server = this._app.listen.apply(
                this._app,this._options
            );
        }
    }

    /**
     * stop server
     * @return {Void}
     */
    stop() {
        if (!!this._server){
            this._server.close();
            delete this._server;
        }
    }
}
// export NServer class
module.exports = BServer;