/**
 * Base Controller Class
 *
 * @author genify(caijf@corp)
 */
'use strict';


/**
 * Base Controller Class
 *
 * @extends NObject
 */
class NController extends require('../BObject') {
    /**
     * Create a Controller
     * @param  {KoaContext} context - koa context object
     * @param  {GeneratorFunction} next - next process
     */
    constructor(context, next) {
        super();
        this.model = {};
        this._next = next;
        this._context = context;
    }

    /**
     * do next process
     * @return {Void}
     */
    *next() {
        if (!!this._next){
            yield this._next;
        }
    }

    /**
     * redirect to url
     * @param  {String} url - redirect target
     * @return {Void}
     */
    redirect(url) {
        if (!!this._context){
            this._context.response.redirect(url);
        }
    }

    /**
     * set cookie
     * @param {String} key - cookie key
     * @param {String} value - cookie value
     * @param {options} options 
     * @return {Void}
     */
    setCookie(key, value, options) {
        if (!!this._context && !!this._context.cookies && this._context.cookies.set) {
            this._context.cookies.set(key, value, options || {});
        }
    }

    /**
     * get cookie
     * @param {String} key - cookie key
     * @return {Object}
     */
    getCookie(key) {
        if (!!this._context && !!this._context.cookies && this._context.cookies.get) {
            return this._context.cookies.get(key);
        }
    }

    /**
     * wrap return response
     * @param {Object} response - json response from service
     * @return {Object} - json response with status code and message
     */
    wrapRet(response) {
        return {
            result: response
        };
    }
}
// export NController class
module.exports = NController;