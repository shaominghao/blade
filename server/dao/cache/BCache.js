/**
 * Abstract Cache Class
 *
 * @author genify(caijf@corp)
 */
"use strict";
// variables
/**
 * Abstract Cache Class
 *
 * @extends NObject
 */
class BCache extends require('../../BObject'){
    /**
     * get data from cache
     * @param  {String}   key - key of data
     * @param  {Variable} defaultValue - default value of key
     * @return {Variable} data from cache
     */
    get(key, defaultValue) {
        // TODO
    }

    /**
     * set data to cache
     * @param  {String}   key - key of data
     * @param  {Variable} value - data to cache
     * @param  {Number}   ttl - expire time
     * @return {Void}
     */
    set(key, value, ttl) {
        // TODO
    }

    /**
     * remove data with key from cache
     * @param  {String} key - data key
     * @return {Void}
     */
    remove(key) {
        // TODO
    }

    /**
     * alias of remove
     * @param  {String} key - data key
     * @return {Void}
     */
    destroy(key) {
        this.remove(key);
    }
    
    /**
     * update expire time
     * @param  {String} key - key of data
     * @param  {Number} ttl - expire time
     * @return {Void}
     */
    expire(key, ttl) {
        // TODO
    }
}
// export NCache class
module.exports = BCache;