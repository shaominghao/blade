/**
 * DataTypeController API Controller Class
 *
 * @author shaomh (hzshaominghao@corp.netease.com)
 */
'use strict';
let User = require('../../model/User');


class UserController extends require('../../arch/BController') {

    constructor(context, next) {
        super(context, next);

    }

    *login(){
        let res = this._context.response;
        let body = this._context.body;
        let session = this._context.session;

        let data = {
            id: 123,
            name: 'test123'
        };
        try {
            this._userService = new (require('../../service/UserService'))();
        }catch(err){
            console.log(err.stack || err);
        }

        let model = new User(data);
        let ret = yield this._userService.login(model);
        this._context.model = this.wrapRet(ret);
        yield super.next();
    }
}

module.exports = UserController;