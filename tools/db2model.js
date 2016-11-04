/**
 * Created by hzshaominghao on 2016/10/25.
 */

var fs = require('fs'),
    swig = require('swig');
var mysql = require('mysql');


var parseDB = function(config, cb){
    var connection = mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        database: 'information_schema'
    });
    connection.connect();
    //查询
    connection.query(`select * from COLUMNS where TABLE_SCHEMA='${config.database}'`, function(err, rows, fields) {
        if (err) throw err;
        cb(rows);
    });
    //关闭连接
    connection.end();
};
/**
 * parse and cache template
 * @param  {Object} map - template map
 * @return {Object} template result map
 */
var parseTemplate = function(map){
    Object.keys(map).forEach(function(name){
        console.log('parse template %s',map[name]);
        map[name] = swig.compileFile(
            __dirname+map[name],{
                autoescape: !1
            }
        );
    });
    return map;
};
/**
 * run sql to model converter
 * @return {Void}
 */
var run = function(){
    var root = 'D:/workspace_nodejs/blade/tools/data/',
        file = __dirname+'/./sql/blade.sql',
        svcout = root+'service/',
        daoout = root+'dao/',
        output = root+'model/';

    parseDB({
            "database": "blade",
            "host": "127.0.0.1",
            "port": 3306,
            "user": "root",
            "password": "root"
        }, function(rows) {
            var ret = {},name;
            for(var row of rows){
                name = row.TABLE_NAME;
                ret[name] = ret[name] || [];
                var it = {
                    name: row.COLUMN_NAME,
                    type: row.DATA_TYPE,
                    length: row.CHARACTER_MAXIMUM_LENGTH,
                    value: row.COLUMN_DEFAULT,
                    comment: row.COLUMN_COMMENT,
                    primary: row.COLUMN_KEY == 'PRI' ? !0 : 0
                };

                if(row.COLUMN_KEY == 'PRI'){
                    ret[name].primary = row.COLUMN_NAME;
                }
                ret[name].push(it);
            }
        var tables = ret;

        var tpl = parseTemplate({
            mdl:'/model/model.js',
            vml:'/model/viewmodel.js',
            svc:'/model/service.js',
            dao:'/model/dao.js'
        });
        var dmap = {
            Number: 0,
            String: "''",
            Date: 0
        };
        var tmap = {
            INT:'Number',
            BIGINT:'Number',
            TINYINT:'Number',
            VARCHAR:'String',
            TEXT:'String',
            TIMESTAMP:'Date',
            DATETIME:'Date'
        };
        Object.keys(tables).forEach(function(name){
            var opt = {
                name:name,
                fields:tables[name],
                primary:tables[name].primary,
                JS:function(v){
                    return JSON.stringify(v);
                },
                CV:function(v){
                    return v.replace(/^[a-z]/,function($1){
                        return $1.toUpperCase();
                    });
                },
                DV:function(v,t){
                    t = opt.TP(t);
                    if (t==='Date'||v.indexOf('CURRENT_TIMESTAMP')>=0){
                        return 0;
                    }
                    if (v===''||v==='NULL'){
                        return dmap[t];
                    }
                    return v;
                },
                TP:function(v){
                    v = v.split('(')[0];
                    return tmap[v]||'String';
                },
                FD:function(v){
                    return v.replace(/_([a-z])/g,function($1,$2){
                        return $2.toUpperCase();
                    });
                }
            };
            opt.model = opt.FD(
                opt.CV(opt.name)
            );
            var file = output+opt.model+'.js';
            console.log('output %s',file);
            fs.writeFileSync(file,tpl.mdl(opt));

        });

        }
    );

};
run();
