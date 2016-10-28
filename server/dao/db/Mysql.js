/**
 * Mysql Connection Class
 *
 * @author genify(caijf@corp)
 */
"use strict";
// variables
let mysql = require('mysql'),
    wrap  = require('thunkify-wrap');
// default config
const DEFAULT = {
    dateStrings         : !0,
    multipleStatements  : !0
};
// mysql connection yield support
const CO_MYSQL = [
    'query','release',
    'beginTransaction',
    'commit','rollback'
];
/**
 * Mysql Connection Class
 *
 * @extends Connection
 */
class Mysql extends require('./BConnection'){
    /**
     * get Connection Pool
     * @return {Object} Connection Pool Object
     */
    static getPool() {
        if (!this._pool){
            this._pool = wrap(mysql.createPool(
                Object.assign(
                    {},DEFAULT,
                    process.appConfig.database
                )
            ));
        }
        return this._pool;
    }

    /**
     * get connection from pool
     * @private
     * @return {Connection} - connection
     */
    static *getConnection() {
        if (this._conn){
            return this._conn;
        }
        let pool = this.getPool(),
            conn = yield pool.getConnection();
        return wrap(conn,CO_MYSQL);
    }

    /**
     * begin transaction
     * @return {Void}
     */
    static *beginTransaction() {
        super.beginTransaction();
        if (this._conn){
            this._ref++;
            return;
        }
        this._ref = 0;
        this._conn = yield this.getConnection();
        yield this._conn.beginTransaction();
    }

    /**
     * end transaction
     * @return {Void}
     */
    static *endTransaction() {
        super.endTransaction();
        if (!this._conn){
            return;
        }
        if (!!this._ref){
            this._ref--;
            return;
        }
        try{
            yield this._conn.commit();
        }catch(ex){
            yield this._conn.rollback();
            throw ex;
        }finally{
            this._conn.release();
            delete this._conn;
        }
    }
    
    /**
     * execute sql statement
     * @param  {String} sql - sql statement
     * @param  {Array}  args - sql parameters
     * @return {Object} result for sql statement
     */
    *exec(sql, args) {
        super.exec(sql, args);
        let ret = null,
            parent = this.constructor,
            conn = yield parent.getConnection();
        try{
            let t = +new Date;
            ret = yield conn.query(sql,args||[])
            // 0-result 1-fields
            ret = (ret||[])[0];
        }finally{
            if (conn!=parent._conn){
                conn.release();
            }
        }
        return ret;
    }
}
// export Connection class
module.exports = Mysql;