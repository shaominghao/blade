/**
 * {{dao}} DAO Class
 *
 * @author genify(caijf@corp)
 */
"use strict"
// variables
let log = require('../util/log');

/**
 * {{dao}} DAO Class
 *
 * @extends NDao
 */
class {{dao}}Dao extends require('./NDao'){
    /**
     * Create a {{dao}} DAO instance
     */
    constructor() {
        super();
        this._Model = require('../model/db/{{model}}');
    }


}
// export {{dao}}Dao class
module.exports = {{dao}}Dao;