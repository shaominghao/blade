/**
 * Created by hzshaominghao on 2016/10/25.
 */

var fs = require('fs'),
    swig = require('swig');
/**
 * dump sql file content
 * @param  {String} file - file path
 * @return {Array}  content split by new line
 */
var dumpSQL = function(file){
    console.log('dump sql %s',file);
    var content = fs.readFileSync(file,{
        encoding:'utf-8'
    });
    return (content||'').split(/\r\n|\r|\n/);
};
/**
 * parse SQL table config
 * @param  {Array} lines - sql content lines
 * @return {Object} table config
 */
var parseSQL = function(lines){
    console.log('parse sql content');
    var ret = {},name;
    lines.forEach(function(line){
        // create table
        if (line.indexOf('CREATE TABLE')==0){
            if (/`(.*?)`/.test(line)){
                name = RegExp.$1;
                ret[name] = [];
                console.log('find table %s',name);
            }
            return;
        }
        // primary key
        if (/^\s*PRIMARY\s+KEY\s+\((.+?)\)/.test(line)){
            var arr = RegExp.$1.replace(/`/g,'').split(/\s*,\s*/);
            ret[name].primary = JSON.stringify(arr);
            return;
        }
        // table fields
        if (/^\s+`(.*?)`/.test(line)){
            var it = {
                name:RegExp.$1
            };
            ret[name].push(it);
            console.log('find field %s',it.name);
            // dump primary key
            if (line.indexOf('AUTO_INCREMENT')>0){
                it.primary = !0;
            }
            // dump type
            if (/`\s+(.+?)\s/.test(line)){
                it.type = RegExp.$1;
            }
            // dump default value
            if (/DEFAULT\s('.*?')/.test(line)){
                it.value = RegExp.$1;
            }else if (/DEFAULT\s(.+?)\s/.test(line)){
                it.value = RegExp.$1;
            }
            // dump comment string
            if (/COMMENT\s'(.+?)'/.test(line)){
                it.comment = RegExp.$1.replace(/\\n/g,' ');
            }
        }
        // ignore other line
    });
    return ret;
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
 * parse dao name
 * @param model
 */
var DAONAME = {
    Bisgroup:'BisGroup',
    Datatype:'DataType',
    Progroup:'ProGroup',
    ProgroupUser:'ProGroupUser',
    ProgroupVerification:'ProGroupVer',
    ProgroupVerificationOp:'ProgroupVerOP',
    SpecificationVarmap:'SpecificationVarMap',
    Usrappeal:'UserAppeal',
    Usrlogin:'UserLogin',
    InterfaceTestcase:'TestCase'
};
var parseDAOName = function(model){
    return DAONAME[model]||model;
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
    var tables = parseSQL(
        dumpSQL(file)
    );
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
        // not overwrite view model
        // var file = output+'vm/'+opt.model+'.js';
        // if (!fs.existsSync(file)){
        //     console.log('output %s',file);
        //     fs.writeFileSync(file,tpl.vml(opt));
        // }
        opt.dao = parseDAOName(opt.model);
        // // not overwrite dao
        // var file = daoout+opt.dao+'Dao.js';
        // if (!fs.existsSync(file)){
        //     console.log('output %s',file);
        //     fs.writeFileSync(file,tpl.dao(opt));
        // }
        // // not overwrite service
        // var file = svcout+opt.dao+'Service.js';
        // if (!fs.existsSync(file)){
        //     console.log('output %s',file);
        //     fs.writeFileSync(file,tpl.svc(opt));
        // }
    });
};
run();
