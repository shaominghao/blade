/**
 *  {{model}} Model Class
 *  Auto Generate By Sql2ModelConverter
 *  
 *  @author
 */
"use strict"
// variables
let Model = require('./Model');
// {{model}} primary fields
const PRIMARY = {{primary}};
// {{model}} fields definition
const FIELDS = {
{%- for x in fields %}
    /**
     * {{x.comment}}
     * @type {Object}
     */
    {{FD(x.name)}}: {
        type: '{{TP(x.type)}}',
        defaultValue: {{DV(x.value,x.type)}}{% if x.primary %},
        primary: !0{% endif %}
    }{% if !loop.last %},{% endif -%}
{% endfor %}
};
/**
 * Base Model Class
 *
 * @extends Model
 */
class {{model}} extends Model{
    /**
     * get ViewModel class bind with Model
     * @return {ViewModel} - ViewModel class
     */
    getViewModel() {
        return require('../vm/{{model}}');
    }
}
{{model}}.props('{{name}}', FIELDS, PRIMARY);
// export {{model}} class
module.exports = {{model}};