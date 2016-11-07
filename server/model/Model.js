/**
 *  Base Model Class
 */
"use strict";
// variables
let util = require('util');
// common fields
const FIELDS = {
    // TODO
};
// type transform
const TRANSFORM = {
    'Number': function(v){
        v = parseInt(v,10);
        return isNaN(v)?null:v;
    },
    'Date': function(v){
        return Date.parse(v)||0;
    },

    // convert to DB field name
    // abcDefGhi -> abc_def_ghi
    toDBFieldName: function (v) {
        return v.replace(/[A-Z]/g,function($1){
            return '_'+$1.toLowerCase();
        });
    },
    // convert to Model field name
    // abc_def_ghi -> abcDefGhi
    toMDFieldName: function (v) {
        return v.replace(/_([a-z])/g,function($1,$2){
            return $2.toUpperCase();
        });
    }
};
/**
 * Base Model Class
 */
class Model extends require('../BObject'){
    /**
     * config Model fields
     *
     * @param  {String} table  - table name
     * @param  {Object} fields - table fields config
     * @param  {Array}  primary - primary fields
     * @return {Void}
     */
    static props(table, fields, primary) {
        // save table name
        this._table = table;
        // save table fields
        this._fields = Object.assign(
            {},FIELDS,fields
        );
        // save primary fields
        this._primary = primary||['id'];
    }

    /**
     * check is primary field
     *
     * @param  {String} field - field name
     * @return {Boolean} is primary field
     */
    static isPrimary(field){
        return this._primary.indexOf(field)>=0;
    }

    /**
     * get field config with name
     * @param  {String} name - field name
     * @return {Object} field config object
     */
    static getField(name) {
        if (name==null){
            return this._fields;
        }
        return this._fields[name];
    }

    /**
     * get table name of bind model
     * @return {String} table name
     */
    static getTableName() {
        return this._table;
    }

    /**
     * get fields sql for table
     * @param  {Object} config  - config object
     * @param  {Boolean} config.table - use table name as prefix
     * @param  {Boolean} config.alias - use alias for field name
     * @param  {Object}  config.funcs - field function config
     * @return {String} sql fields
     */
    static getFieldSQL(config, fields) {
        let ret = [],
            prefix = '',
            list = this._fields,
            table = this.getTableName(),
            funcs = config.funcs||{};
        // check use table name prefix
        config = config||{};
        if (config.table){
            prefix = util.format(
                '`%s`.',table
            );
        }
        // generate fields list
        if (!fields){
            fields = Object.keys(list);
        }
        fields.forEach(function(key){
            let suffix = '',
                name = TRANSFORM.toDBFieldName(key);
            if (config.alias){
                suffix = util.format(
                    ' AS `%s.%s`',table,name
                );
            }
            // check function
            let wrap = '%s',
                func = (funcs[key]||'').toUpperCase();
            if (!!func){
                if (func==='DISTINCT'){
                    wrap = `${func} %s`;
                }else{
                    wrap = `${func}(%s)`;
                }
            }
            let str = util.format(
                '%s`%s`%s',
                prefix,name,suffix
            );
            ret.push(util.format(wrap,str));
        });
        return ret.join(', ');
    }

    /**
     * parse sql conditions
     *
     * @private
     * @param  {Object} conds - conditions object
     * @param  {Object} options - config object
     * @param  {String} options.prefix - table prefix
     * @param  {Array}  options.args   - arguments result list
     * @param  {Array}  options.conds  - conditions result list
     * @return {Void}
     */
    static _parseCondition(conds,options) {
        let args = options.args||[],
            carr = options.conds||[],
            prefix = options.prefix||'';
        Object.keys(conds).forEach(function(fd){
            // op:'=',value:'xxxxx'
            let it = conds[fd], val;
            // console.log(conds);
            if (!it.op){
                it = {value:it,op:'='};
                if (Array.isArray(it.value)){
                    if (it.value.length>1){
                        it.op = 'in';
                    }else{
                        it.value = it.value[0];
                    }
                }
            }
            if (Array.isArray(it.value)){
                args.push.apply(args,it.value);
                val = '('+new Array(it.value.length).join('?,')+'?)';
            }else{
                val = '?';
                args.push(it.value);
            }
            // `table1`.`fields` in (?,?,?)
            let cdt = util.format(
                '%s`%s` %s %s',
                prefix,TRANSFORM.toDBFieldName(fd),it.op,val
            );
            carr.push(cdt);
        });
    }

    /**
     * parse sql join conditions
     *
     * @private
     * @param  {Array}  joins - join config list
     * @param  {Object} options - config object
     * @param  {Array}  options.args   - arguments result list
     * @param  {Array}  options.conds  - conditions result list
     * @param  {Array}  options.fields - fields result list
     * @param  {Array}  options.tables - tables result list
     * @return {Void}
     */
    static _parseConditionJoins(joins,options){
        let tarr = options.tables||[],
            farr = options.fields||[],
            carr = options.conds||[],
            args = options.args||[];
        joins.forEach(function(it){
            // table:'', fkmap:{f1:'f2'}, field:['f1','f2','f3'], conds:{}
            let tab = it.table,
                alias = it.alias, prefix;
            // check alias
            if (!alias){
                prefix = '`'+tab+'`';
                tarr.push(prefix);
            }else{
                prefix = '`'+alias+'`';
                tarr.push(util.format(
                    '`%s` AS `%s`',tab,alias
                ));
            }
            alias = alias||tab;
            // check export fields
            if (it.field){
                it.field.forEach(function(fld){
                    let cdt = util.format(
                        '`%s`.`%s` AS `%s.%s`',
                        alias,fld,alias,fld
                    );
                    farr.push(cdt);
                });
            }
            // check foreign key map
            if (it.fkmap){
                Object.keys(it.fkmap).forEach(function(fld){
                    let cdt = util.format(
                        '`%s`.`%s`=%s.`%s`',
                        alias,fld,tarr[0],it.fkmap[fld]
                    );
                    carr.push(cdt);
                });
            }
            // check join conditions
            if (it.conds){
                this._parseCondition(
                    it.conds,{
                        args:args,
                        conds:carr,
                        prefix:prefix+'.'
                    }
                );
            }
        },this);
    }

    /**
     * parse order condition
     *
     * @private
     * @param  {Object}  order
     * @param  {String}  order.field - order field name
     * @param  {Boolean} order.desc -  sort type
     * @param  {String}  table - table name
     * @return {String}  order statement
     */
    static _parseConditionOrder(order, table) {
        if (Array.isArray(order)){
            let ret;
            order.some(function(it){
                ret = this._parseConditionOrder(
                    it.order, it.alias||it.table
                );
                return !!ret;
            },this);
            return ret;
        }
        if (!!order){
            let tb = '';
            if (!!table){
                tb = table+'.';
            }
            return util.format(
                'ORDER BY `%s%s` %s',tb,
                TRANSFORM.toDBFieldName(order.field),
                !order.desc?'ASC':'DESC'
            );
        }
    }

    /**
     * parse page condition
     *
     * @private
     * @param  {Object} pages - page information
     * @param  {Number} pages.offset - page offset
     * @param  {Number} pages.limit  - page limit
     * @return {String} page statement
     */
    static _parseConditionLimit(pages) {
        pages = pages||{};
        let ret = [];
        ['limit','offset'].forEach(function(it){
            let val = parseInt(pages[it]);
            if (!isNaN(val)){
                ret.push(it.toUpperCase(),val);
            }
        });
        return ret.join(' ');
    }

    /**
     * generate select sql statement with condition
     *
     * ```sql
     * SELECT
     *      `user`.`id` AS `user.id`,`progroup_user`.`role` AS `progroup_user.role`
     * FROM
     *      `user`,`progroup_user`
     * WHERE
     *      `user`.`id`=`progroup_user`.`user_id` and `progroup_id`=?
     * ```
     *
     * @private
     * @param  {Object} options - conditions config
     * @param  {Object} options.field - table field config, e.g.  {field1:'DISTINCT','*':'count'}
     * @param  {Object} options.order - order field and sort type, e.g. {field:'create_time',desc:!0}
     * @param  {Object} options.pages - recorder page information, e.g. {offset:0,limit:10}
     * @param  {Object} options.conds - conditions for table, e.g. {field1:{op:'!=',value:id}}
     * @param  {Array}  options.joins - table join config, e.g [{table:'xxxx',alias:'xxx',fkmap:{f1:'f2'},conds:{f1:{op:'>',value:id}}}]
     * @return {Object} conditions result, e.g. {sql:'',args:[]}
     */
    static toSearchSQL(options) {
        let fields,
            opt = {
                table:!!options.joins,
                alias:!!options.joins
            };
        // check field config
        if (options.field){
            opt.funcs = options.field;
            fields = Object.keys(options.field);
        }
        let farr = [this.getFieldSQL(opt,fields)],  // fields list
            tarr = ['`'+this.getTableName()+'`'],   // table join list
            carr = [],                              // condition list
            args = [];                              // arguments list
        // check conditions for own table
        if (options.conds){
            let prefix = '';
            if (opt.table){
                prefix = tarr[0]+'.';
            }
            this._parseCondition(
                options.conds,{
                    args:args,
                    conds:carr,
                    prefix:prefix
                }
            );
        }
        // check conditions for join table
        if (options.joins){
            this._parseConditionJoins(
                options.joins,{
                    tables:tarr,
                    fields:farr,
                    conds:carr,
                    args:args
                }
            );
        }
        // check order
        let order = this._parseConditionOrder(
            options.order,opt.table?this.getTableName():''
        );
        if (!order){
            order = this._parseConditionOrder(options.joins);
        }
        // generate result
        return {
            args:args,
            sql:util.format(
                'SELECT %s FROM %s WHERE %s %s %s',
                farr.join(','),tarr.join(','),
                carr.join(' AND '),order||'',
                this._parseConditionLimit(options.pages)
            ).trim()
        };
    }

    /**
     * generate delete sql statement
     *
     * ```sql
     * DELETE FROM `tb` WHERE id=?;
     * ```
     *
     * @param  {Object} conds - filter condisitons
     * @return {Object} sql result, e.g. {sql:'',args:[]}
     */
    static toDeleteSQL(conds) {
        let arr = [],
            ret = {args:[]};
        if (!!conds){
            this._parseCondition(conds,{
                conds:arr,
                args:ret.args
            });
        }
        ret.sql = util.format(
            'DELETE FROM `%s` WHERE %s;',
            this.getTableName(),
            arr.join(' AND ')
        );
        return ret;
    }

    /**
     * constructor of Model
     * @param {Object} data - model data
     */
    constructor(data) {
        super(data);
        this.ext = {};
        this._set(data);
    }

    /**
     * set model data
     * @private
     * @param  {Object} data - model data
     * @return {Void}
     */
    _set(data) {
        let table = this.constructor.getTableName();
        Object.keys(data).forEach(function(key){
            let fed = key,
                tab = table,
                arr = (key||'').split('.');
            // table.field -> field
            if (arr.length>1){
                tab = arr[0];
                fed = arr[1];
            }
            // check field in join table
            fed = TRANSFORM.toMDFieldName(fed);
            if (tab!==table){
                let ret = this.ext[tab]||{};
                ret[fed] = data[key];
                this.ext[tab] = ret;
                return;
            }
            // property only in table fields
            let it = this.constructor.getField(fed);
            if(it!=null){
                let val = data[key],
                    func = TRANSFORM[it.type];
                if(!!func){
                    val = func(val);
                }
                this[fed] = val;
            }
        },this);
    }

    /**
     * prepare dump field information
     * @protected
     * @return {Objct} field information, e.g. {fields:[],args:[]}
     */
    _prepareField() {
        let ret = {fields:[],args:[],primary:[],prgs:[]};
        Object.keys(this).forEach(function(field){
            let it = this.constructor.getField(field);
            // ignore field if
            // - illegal field
            // - auto increase field
            // - timestamp field
            if (!it||it.primary||it.type==='Date'){
                return;
            }
            // check value
            let value = this[field],
                func = TRANSFORM[it.type];
            if (!!func){
                value = func(value);
            }
            // insert not-null field and value
            if (value!=null){
                let farr = ret.fields;
                let args = ret.args;
                field = TRANSFORM.toDBFieldName(field);
                if (this.constructor.isPrimary(field)){
                    farr = ret.primary;
                    args = ret.prgs;
                }
                farr.push(util.format('`%s`',field));
                args.push(value);
            }
        },this);
        return ret;
    }

    /**
     * generate select sql statement with condition
     *
     * ```sql
     * SELECT
     *      `user`.`id` AS `user.id`,`progroup_user`.`role` AS `progroup_user.role`
     * FROM
     *      `user`,`progroup_user`
     * WHERE
     *      `user`.`id`=`progroup_user`.`user_id` and `progroup_id`=?
     * ```
     *
     * @param  {Array} conds - conditions for model table
     * @param  {Array} joins - join config object list
     * @param  {Object} join - join config object
     * @param  {String} join.table - join table name
     * @param  {Object} join.fkmap - foreign key map
     * @param  {Array}  join.field - fields want to export
     * @param  {Object} join.conds - join field map, e.g {'id':'user_id'}
     * @return {Object} sql result, e.g. {sql:'',args:[]}
     */
    toSearchSQL() {
        return this.constructor.toSearchSQL.apply(
            this.constructor,arguments
        );
    }

    /**
     * generate delete sql statement
     *
     * ```sql
     * DELETE FROM `tb` WHERE id=?;
     * ```
     *
     * @return {Object} sql result, e.g. {sql:'',args:[]}
     */
    toDeleteSQL() {
        return this.constructor.toDeleteSQL.apply(
            this.constructor, arguments
        );
    }

    /**
     * generate insert sql statement
     *
     * ```sql
     * INSERT INTO `tb` (`f1`, `f2`, `f3`) VALUES (?, ?, ?);
     * ```
     *
     * @return {Object} sql result, e.g. {sql:'',args:[]}
     */
    toInsertSQL() {
        let ret = this._prepareField();
        ret.fields.push.apply(ret.fields,ret.primary);
        ret.args.push.apply(ret.args,ret.prgs);
        return {
            args:ret.args,
            sql:util.format(
                'INSERT INTO `%s` (%s) VALUES (%s);',
                this.constructor.getTableName(),
                ret.fields.join(', '),
                new Array(ret.args.length).join('?, ')+'?'
            )
        };
    }

    /**
     * generate update sql statement
     *
     * ```sql
     * UPDATE `tb` SET `f1`=?, `f2`=? WHERE id=?;
     * ```
     *
     * @return {Object} sql result, e.g. {sql:'',args:[]}
     */
    toUpdateSQL(conds) {
        // parse fields
        let ret = this._prepareField();
        if (!conds){
            if (!ret.primary.length){
                conds = {id:this.id};
            }else{
                conds = {};
                ret.primary.forEach(function(field,index){
                    conds[field.replace(/`/g,'')] = ret.prgs[index];
                });
            }
        }
        // parse conditions
        let arr = [];
        this.constructor._parseCondition(
            conds,{
                conds:arr,
                args:ret.args
            }
        );
        return {
            args:ret.args,
            sql:util.format(
                'UPDATE `%s` SET %s WHERE %s;',
                this.constructor.getTableName(),
                ret.fields.join('=?, ')+'=?',
                arr.join(' AND ')
            )
        };
    }

    /**
     * convert to view model
     * @return {ViewModel} - view model instance
     */
    toViewModel() {
        return new (this.getViewModel())(this);
    }

    /**
     * serialize to json string
     * 
     * @return {String} json string
     */
    toNObjectString() {
        let fields = this.constructor.getField();
        return JSON.stringify(
            this,Object.keys(fields)
        );
    }
}
// export Model class
module.exports = Model;