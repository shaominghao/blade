/**
 * Base DAO Class
 *
 */
"use strict";
// variables
let Mysql = require('./db/Mysql');
// user exported fields
const USER_EXPORT_FIELD = [
    "id","email","username",
    "realname","realname_pinyin"
];
// bisgroup exported fields
const BISGROUP_EXPORT_FIELD = [
    "id","name","name_pinyin","description"
];
// progroup exported fields
const PROGROUP_EXPORT_FIELD = [
    "role","user_id","progroup_id"
];
/**
 * Base DAO Class
 *
 * @extends NObject
 */
class BDao extends require('../BObject'){
    /**
     * Create a DAO instance
     */
    constructor() {
        super();
        // sub class should bind the model class
        this._Model = null;
        this._cache = new (require('./cache/Redis'))();
        this._database = new Mysql();
    }

    /**
     * begin transaction
     *
     * @protected
     * @return {Void}
     */
    *_beginTransaction() {
        yield Mysql.beginTransaction();
    }

    /**
     * end transaction
     *
     * @protected
     * @return {Void}
     */
    *_endTransaction() {
        yield Mysql.endTransaction();
    }

    /**
     * get model name for dao
     *
     * @return {String} model name
     */
    getModelName() {
        return this._Model.name;
    }

    /**
     * get redis cache key
     * @protected
     * @param  {String} key - data key
     * @return {String} cache key
     */
    _getCacheKey(key) {
        key = key==null?'default':key;
        return [this._Model.getTableName(),key].join('_');
    }

    /**
     * get user join condition
     *
     * @protected
     * @return {Array} user join conditions
     */
    _getUserJoins() {
        let ret = [];
        if (this._Model.getField('respoId')){
            ret.push({
                table:'user',
                alias:'respo',
                fkmap:{id:'respo_id'},
                field:USER_EXPORT_FIELD
            });
        }
        if (this._Model.getField('creatorId')){
            ret.push({
                table:'user',
                alias:'creator',
                fkmap:{id:'creator_id'},
                field:USER_EXPORT_FIELD
            });
        }
        if (this._Model.getField('groupId')){
            ret.push({
                table:'bisgroup',
                alias:'group',
                fkmap:{id:'group_id'},
                field:BISGROUP_EXPORT_FIELD
            });
        }
        return ret;
    }

    /**
     * get project group join conditions
     *
     * @protected
     * @param  {Number} uid - user id
     * @return {Array} progroup_user join conditions
     */
    _getProGroupJoins(uid) {
        let ret = [],
            field = 'progroup_id';
        // for progroup model
        if (!this._Model.getField('progroupId')){
            field = 'id';
        }
        ret.push({
            table:'progroup_user',
            alias:'user',
            fkmap:{progroup_id:field},
            conds:{user_id:uid},
            field:PROGROUP_EXPORT_FIELD
        });
        return ret;
    }

    /**
     * get user and project group join condition
     *
     * @protected
     * @param  {Number} uid - user id
     * @return {Array} user and project group join conditions
     */
    _getUserProGroupJoins(uid) {
        let ret = this._getUserJoins(),
            arr = this._getProGroupJoins(uid);
        ret.push.apply(ret,arr);
        return ret;
    }

    /**
     * get data from cache
     * @protected
     * @param  {Number} id - model id
     * @return {Object} model json object
     */
    *_findInCache(id) {
        let key = this._getCacheKey(id);
        return yield this._cache.get(key);
    }

    /**
     * save data to cache
     * @protected
     * @param  {Number} id - model id
     * @return {Void}
     */
    *_saveToCache(id, data) {
        let key = this._getCacheKey(id);
        yield this._cache.set(key,data);
    }

    /**
     * remove data from cache
     * @protected
     * @param  {Number} id - model id
     * @return {Void}
     */
    *_removeFromCache(id) {
        let key = this._getCacheKey(id);
        yield this._cache.remove(key);
    }

    /**
     * do something with cache
     * @protected
     * @param  {String} key - cache key
     * @param  {GeneratorFunction} func - do something
     * @return {Variable} result
     */
    *_doWithCache(key,func) {
        // check role from cache
        let ckey = this._getCacheKey(key),
            cret = yield this._cache.get(ckey);
        if (cret!=null){
            return cret;
        }
        // get role from database
        cret = yield func.call(this);
        // save to cache
        if (cret!=null){
            yield this._cache.set(ckey,cret);
        }
        return cret;
    }

    /**
     * search result with sql and args
     * @private
     * @param  {String} sql  - sql statement
     * @param  {Array}  args - sql parameters placeholder
     * @return {Array}  search result
     */
    *_search(sql, args) {
        // illegal search call
        if (!sql){
            return;
        }
        // search from database
        let rec = yield this._database.exec(
            sql, args
        );
        // generate result
        let ret = [];
        rec.forEach(
            function(it) {
                ret.push(this.wrap(it));
            },this
        );
        return ret;
    }

    /**
     * search model list with condition,
     * use __FIELDS__ and __TABLE__ variables as fields and table name placeholder
     *
     * ```sql
     * SELECT
     *      __FIELDS__
     * FROM
     *      __TABLE__,`progroup_user`
     * WHERE
     *      __TABLE__.`id`=`progroup_user`.`user_id` and __TABLE__.`id`=?
     * ```
     *
     * @param  {String} sql     - search sql statement
     * @param  {Object} options - search condition
     * @param  {Array}  options.args    - parameters placeholder in sql statement
     * @param  {Object} options.context - other parameters placeholder in sql statement
     * @return {Array}  model list
     */
    *searchWithSQL(sql, options) {
        // build context
        let context = {
            TABLE: this._Model.getTableName(),
            FIELDS: this._Model.getFieldSQL({
                table:!0
            })
        };
        Object.assign(context,options.context);
        // replace placeholder
        sql = (sql||'').replace(
            /__([A-Z]+?)__/g,function($1,$2){
                return context[$2]||$1;
            }
        );
        // search result
        return yield this._search(sql,options.args);
    }

    /**
     * search with conditions
     *
     * ```sql
     * SELECT
     *      `table1`.`field1` AS `table1.field1`, `table2`.`field1` AS `table2.field1`
     * FROM
     *      `table1`,`table2`
     * WHERE
     *      `table1`.`field3`=`table2`.`field4` AND `table1`.`field5`=?
     * ```
     *
     * @param  {Object} options - conditions config
     * @param  {Object} options.field - table field config, e.g.  {field1:'DISTINCT'}
     * @param  {Object} options.conds - conditions for table, e.g. {field1:{op:'=',value:id}}
     * @param  {Object} options.joins - table join config, e.g {table1:{fkmap:{f1:'f2'},conds:{f1:{op:'=',value:id}}}}
     * @return {Array}  model list
     */
    *search(options) {
        let ret = this._Model.toSearchSQL(options);
        return yield this._search(ret.sql,ret.args);
    }

    /**
     * get model by id
     *
     * @param  {Number} id - model id
     * @return {model/db/Model} model object to find
     */
    *find(id) {
        return (yield this.findBatch([id]))[0];
    }

    /**
     * get multiple models
     *
     * @param  {Array} ids - id list
     * @return {model/db/Model} model list
     */
    *findBatch(ids) {
        let rec = yield this.search({
            conds:{id:ids},
            joins:this._getUserJoins()
        });
        if (rec.length!==ids.length){
        }
        return rec;
    }

    /**
     * create a model record
     * 
     * @param  {model/db/Model} model - model object
     * @return {model/db/Model} model object to be inserted
     */
    *create(model) {
        return (yield this.createBatch([model]))[0];
    }

    /**
     * create model batch
     *
     * @param  {Array} models - model list
     * @return {Array} model created in database
     */
    *createBatch(models) {
        // generate sql and args
        let sqls = [], args = [];
        models.forEach(function(it){
            let ret = it.toInsertSQL();
            sqls.push(ret.sql);
            args.push.apply(args,ret.args);
        });
        // execute sql
        let rec = yield this._database.exec(
            sqls.join(''), args
        );
        if (!Array.isArray(rec)){
            rec = [rec];
        }
        // dump created ids
        let ids = [];
        rec.forEach(function(it){
            ids.push(it.insertId);
        });
        // check insert model type
        if (this._Model!=models[0].constructor){
            return ids;
        }
        return yield this.findBatch(ids);
    }

    /**
     * update a model record
     *
     * @param  {model/db/Model} model - model object
     * @return {model/db/Model} model object to be updated
     */
    *update(model) {
        return (yield this.updateBatch(model,[model.id]))[0];
    }

    /**
     * update multiple models
     *
     * @param  {model/db/Model} model - model object
     * @param  {Array} ids   - ids need updated
     * @return {Array} model list of updated
     */
    *updateBatch(model, ids) {
        let ret = model.toUpdateSQL({
                id:ids
            }),
            rec = yield this._database.exec(
                ret.sql,ret.args
            );
        if (rec.affectedRows!==ids.length){
        }
        // check insert model type
        if (this._Model!=model.constructor){
            return ids;
        }
        return yield this.findBatch(ids);
    }

    /**
     * update batch models
     *
     * @param  {Array} models - model list
     * @return {Void}
     */
    *updateBatchModels(models) {
        // generate sql and args
        let sqls = [], args = [];
        models.forEach(function(it){
            let ret = it.toUpdateSQL();
            sqls.push(ret.sql);
            args.push.apply(args,ret.args);
        });
        // execute sql
        let rec = yield this._database.exec(
            sqls.join(''), args
        );
    }

    /**
     * remove a model record
     * @param  {Number} id - model id
     * @return {model/db/Model} model object removed
     */
    *remove(id) {
        return (yield this.removeBatch([id]))[0];
    }

    /**
     * remove multiple models
     *
     * @protected
     * @param  {Array} ids - id list to be removed
     * @param  {model/db/Model} model removed
     * @return {Void}
     */
    *_removeBatch(ids, models) {
        let ret = this._Model.toDeleteSQL({
                id:ids
            }),
            rec = yield this._database.exec(
                ret.sql, ret.args
            );
        if (rec.affectedRows!==ids.length){
        }
        return models;
    }

    /**
     * remove multiple models
     *
     * @param  {Array} ids - id list to be removed
     * @return {Array} model list removed
     */
    *removeBatch(ids) {
        let models = yield this.findBatch(ids);
        return yield this._removeBatch(ids, models);
    }

    /**
     * wrapper a json to a Model
     * @param  {Object} data - json data
     * @return {model/db/Model} model object the dao bind
     */
    wrap(data) {
        if (Array.isArray(data)){
            let ret = [];
            data.forEach(function(it){
                ret.push(this.wrap(it));
            },this);
            return ret;
        }
        if (data instanceof this._Model){
            return data;
        }
        return new this._Model(data);
    }
}
// export BDao class
module.exports = BDao;