/**
 * User Service Class
 *
 */
'use strict';

class UserService extends require('./BService') {
    constructor() {
        super();
        this._dao = new (require('../dao/UserDao'))();
        this._cache = new (require('../dao/cache/Redis'))();
    }

    /**
     * create a user record
     * @param  {model/db/User} user - user model
     * @return {model/db/User} user to be created
     */
    *login(user) {
        return yield this._dao.login(user);
        return "vdf";
    }
}
// export UserService class
module.exports = UserService;