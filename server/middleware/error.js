/**
 * Error handling middleware
 *
 */
'use strict';
// variables
let NError  = require('../error/NError');

module.exports = function*(next) {
    try {
        yield next;
    } catch (err) {
        if (err instanceof NError) {
            this.response.body = err.toNObject();
        }
    }
};