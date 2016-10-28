/**
 * Redis Cache Class
 *
 * @author genify(caijf@corp)
 */
"use strict";
// variables
let redis = require('redis'),
    wrap  = require('thunkify-wrap');
// redis config
const CONFIG = process.appConfig.redis||{};
// redis yield support
const CO_REDIS = ['set','get','del','expire'];
// default config options
const DEFAULT = {
    // TODO
};
/**
 * Redis Cache Class
 *
 * @extends Cache
 */
class Redis extends require('./BCache'){
    /**
     * Create Redis Cache instance
     */
    constructor() {
        super();
        let ret = redis.createClient(
            Object.assign(
                {},DEFAULT,CONFIG
            )
        );
        this._client = wrap(ret,CO_REDIS);
    }

    /**
     * wrapper key in redis
     * @private
     * @param  {String} key - source key
     * @return {String} target key
     */
    _wrapKey(key) {
        let prefix = CONFIG.key||'nei_';
        if (key.indexOf(prefix)===0){
            return key;
        }
        return prefix+key;
    }

    /**
     * get data from cache
     * @param  {String}   dataKey - key of data
     * @param  {Variable} defaultValue - default value of key
     * @return {Variable} data from cache
     */
    *get(dataKey, defaultValue) {
        let key = this._wrapKey(dataKey);
        super.get(key, defaultValue);
        let ret = yield this._client.get(key);
        if (ret){
            ret = JSON.parse(ret);
        }
        if (ret==null){
            ret = defaultValue;
        }
        return ret;
    }

    /**
     * set data to cache
     * @param  {String}   dataKey - key of data
     * @param  {Variable} value - data to cache
     * @param  {Number}   ttl - expire time
     * @return {Void}
     */
    *set(dataKey, value, ttl) {
        let key = this._wrapKey(dataKey);
        super.set(key, value, ttl);
        yield this._client.set(
            key,JSON.stringify(value)
        );
        yield this.expire(key,ttl);
    }

    /**
     * set batch data to cache
     * @param  {Array}    keys - key list of data
     * @param  {Variable} value - data to cache
     * @param  {Number}   ttl - expire time
     * @return {Void}
     */
    *setBatch(keys, value, ttl){
        for(let i=0,it;it=keys[i];i++){
            yield this.set(it,value,ttl);
        }
    }

    /**
     * remove data with key from cache
     * @param  {String} dataKey - data key
     * @return {Void}
     */
    *remove(dataKey) {
        let key = this._wrapKey(dataKey);
        super.remove(key);
        yield this._client.del(key);
    }

    /**
     * alias of remove
     * @param  {String} key - data key
     * @return {Void}
     */
    *destroy(key) {
        yield this.remove(key);
    }
    
    /**
     * update expire time
     * @param  {String} dataKey - key of data
     * @param  {Number} ttl - expire time
     * @return {Void}
     */
    *expire(dataKey, ttl) {
        // check arguments
        let key = this._wrapKey(dataKey);
        if (ttl==null){
            ttl = CONFIG.expire;
        }
        if (ttl!=null){
            super.expire(key, ttl);
            yield this._client.expire(key,ttl);
        }
    }
}
// export Redis class
module.exports = Redis;