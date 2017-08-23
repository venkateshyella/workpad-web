/**
 * Created by Vikas on 06/06/17.
 */
(function () {
	"use strict";

	angular.module('app.services')
	.service('FormFieldService', [
	                          '$q', 'Connect',
	                          'mDialog', '$mdToast',
	                          'blockUI', 'Lang','DataProvider','URL',
	                          'AppCoreUtilityServices','Session','$filter',
	                          FormFieldService
	                          ]);

	function FormFieldService($q, Connect, Dialog, $mdToast, blockUI, Lang, 
			               DataProvider, URL, AppCoreUtilityServices, Session, $filter) {

		var LANG = Lang.en.data;
		
		var _modelToEntityParser = {};
		
		function registerParser(fieldType, def){
			_modelToEntityParser[fieldType] = def;
		}
		
		function parseTextField(model){
			
			var _fieldModel = {};
			_fieldModel.keyName = model.name;//model.selectedType.type;
			_fieldModel.keyType = "string";
			_fieldModel.keyValue = model.label;

			return _fieldModel;
		}
		
		function parseIntField(model){
			
			var _fieldModel = {};
			_fieldModel.keyName = model.name;//model.selectedType.type;
			_fieldModel.keyType = "int";
			_fieldModel.keyValue = model.label;

			return _fieldModel;
		}
		
		
		
		function parseCheckboxField(model){
			 var _fieldModel = {};
			
			_fieldModel.type = model.selectedType.type;
			_fieldModel.name = model.name;
			_fieldModel.label = model.label;
			
			return _fieldModel;
		}
		
		function parseRadioButtonField(model){
			 var _fieldModel = {};
				
				_fieldModel.type = model.selectedType.type;
				_fieldModel.name = model.name;
				_fieldModel.label = model.label;
				
				return _fieldModel;
		}
		
		function parseTextAreaField(model){
			
			var _fieldModel = {};
			_fieldModel.type = model.selectedType.type;
			_fieldModel.name = model.name;
			_fieldModel.label = model.label;
			_fieldModel.required = model.validations.isRequired;
			_fieldModel.data = "";

			return _fieldModel;
		}
		
		function _init(){
			registerParser("string", parseTextField);
			registerParser("textarea", parseTextAreaField);
			registerParser("checkbox", parseCheckboxField);
			registerParser("radio", parseRadioButtonField);
		}
		
		_init();

		
		
		function parseFieldModelToEntity(type, fieldModel){
			var fieldParser = _modelToEntityParser[type];
			return fieldParser(fieldModel);
		}
	
		return {
			
			parseFieldModelToEntity: parseFieldModelToEntity
		}

	}

})();