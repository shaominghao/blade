/**
 * User DAO Class
 *
 */
"use strict";
// variables

/**
 * User DAO Class
 *
 * @extends NDao
 */
class UserDao extends require('./BDao'){
    /**
     * Create a User DAO instance
     */
    constructor() {
        super();
        this._Model = require('../model/User');
    }

    /**
     * get user by email
     *
     * @param  {String} email - user email
     * @return {model/db/User} - user model
     */
    *login(user) {
        return user;
    }

}
// export UserDao class
module.exports = UserDao;