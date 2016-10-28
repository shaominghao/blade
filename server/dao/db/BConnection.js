/**
 * Abstract Connection Class
 *
 */
"use strict";
// variables
/**
 * Abstract Connection Class
 * 
 * @extends NObject
 */
class BConnection extends require('../../BObject'){
    /**
     * begin transaction
     * @return {Void}
     */
    static beginTransaction() {
        // TODO
    }

    /**
     * end transaction
     * @return {Void}
     */
    static endTransaction() {
        // TODO
    }
    
    /**
     * execute sql statement
     * @param  {String} sql - sql statement
     * @param  {Array}  args - sql parameters
     * @return {Object} result for sql statement
     */
    exec(sql, args) {
        // TODO
    }
}
// export NConnection class
module.exports = BConnection;