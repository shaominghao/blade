/**
 * {{dao}} Service Class
 *
 * @author
 */
"use strict"
// variables
let log = require('../util/log');

/**
 * {{dao}} Service Class
 *
 * @extends NService
 */
class {{dao}}Service extends require('./NService'){
    /**
     * Create a User Service instance
     */
    constructor() {
        super();
        this._dao = new (require('../dao/{{dao}}Dao'))();
    }

    // TODO

}
// export {{dao}}Service class
module.exports = {{dao}}Service;