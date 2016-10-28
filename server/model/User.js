/**
 *  User Model Class
 *  
 */
"use strict";
// variables
let Model = require('./Model');
// User primary fields
const PRIMARY = ["id"];
// User fields definition
const FIELDS = {
    /**
     * 用户标识
     * @type {Object}
     */
    id: {
        type: 'Number',
        defaultValue: 0,
        primary: !0
    },
    /**
     * 用户账号，对于第三方登录的账号，此处保存第三方过来的账号
     * @type {Object}
     */
    name: {
        type: 'String',
        defaultValue: ''
    }
};
/**
 * Base Model Class
 *
 * @extends Model
 */
class User extends Model{
    
}
User.props('user', FIELDS, PRIMARY);
// export User class
module.exports = User;