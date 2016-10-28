/**
 * Base Service Class
 *
 */
"use strict";
// variables
let mysql = require('../dao/db/Mysql');
/**
 * Base Service Class
 *
 * @extends NObject
 */
class BService extends require('../BObject'){
    /**
     * Create a Service instance
     */
    constructor() {
        super();
        // TODO
    }
    
    /**
     * begin transaction
     *
     * @protected
     * @return {Void}
     */
    *_beginTransaction() {
        yield mysql.beginTransaction();
    }
    
    /**
     * end transaction
     *
     * @protected
     * @return {Void}
     */
    *_endTransaction() {
        yield mysql.endTransaction();
    }
    
    /**
     * convert model to json objet
     *
     * @protected
     * @param  {Model|Array} model - model object
     * @return {Object|Array} json object
     */
    _unwrap(model) {
        // convert array object
        if (Array.isArray(model)){
            let ret = [];
            model.forEach(function(it){
                ret.push(this._unwrap(it));
            },this);
            return ret;
        }
        // convert model to object
        if (model.toViewModel){
            model = model.toViewModel();
        }
        if (model.toNObject){
            model = model.toNObject();
        }
        return model;
    }
}
// export NService class
module.exports = BService;