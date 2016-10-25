/**
 *  {{model}} ViewModel Class
 *  Auto Generate By Sql2ModelConverter
 *
 *  @author genify(caijf@corp)
 */
"use strict"
// variable transform bewteen model and viewmodel
// viewmodel_field:model_field
const TRANSFORM = {
    // TODO
};
// variable validation
const VALIDATION = {
    // TODO
};
/**
 * Base View Model Class
 *
 * @extends ViewModel
 */
class {{model}} extends require('./ViewModel'){
    /**
     * Create a View Model
     *
     * @param  {Object} data - model data
     */
    constructor(data) {
        super(data);
        this._setValidation(VALIDATION);
        this._setTransform(TRANSFORM);
        this._set(data);
    }
    /**
     * get Model class bind with ViewModel
     * @return {Model} - Model class
     */
    getModel() {
        return require('../db/{{model}}');
    }
}
// export {{model}} class
module.exports = {{model}};