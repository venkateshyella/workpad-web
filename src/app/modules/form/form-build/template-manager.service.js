/**
 * Created by sudhir on 13/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.service('TemplateManagerUiProvider', [
			'$q', '$timeout', 'mDialog',
			'DataProvider', 'FormFieldService','JOB_STATUS',
			TemplateManagerUiProvider
		])
	;

	function TemplateManagerUiProvider($q, $timeout
		, Dialog
		, DataProvider, FormFieldService, JOB_STATUS) {
		return {
			askAndCreateNewTemplate: askAndCreateNewTemplate,
			createNewFields: createNewFields,
			editFormFields: editFormFields
		};

		function askAndCreateNewTemplate() {
			var deferred = $q.defer();

			var dialogOptions = {
				templateUrl: "app/modules/form/templates/template_creator.dialog.tpl.html",
				controller: ['$scope', '$mdDialog', '$controller', '$timeout',
					createTemplateDialogController],
					clickOutsideToClose:false
			};

			function createTemplateDialogController($scope, $mdDialog, $controller, $timeout) {
				var self = this;
				$scope.form = {};

				angular.extend(self, $controller('FormBaseController', {$scope: $scope}));
				angular.extend(self, self.initializeForm('templateCreate', {
					submitFn: sendTemplateCreateRequest,
					messages: {
						inProgress: "Creating new template",
						success: "New Template",
						error: ""
					}
				}));
				$scope.cancel = $mdDialog.cancel;
				$scope.submit = submit;

				function sendTemplateCreateRequest() {
					console.log($scope.formModel.templateCreate);
					return $timeout(function () {
						return DataProvider.resource.FormTemplate.create({
							_interim: true,
							name: $scope.formModel.templateCreate.name,
							templates: []
						}, {
							//adapter: 'DL_localStorage'
						});
					});
					//return DataProvider.resource.FormTemplate.createInstance({
					//	name: $scope.formModel.templateCreate.templateName,
					//	templates: []
					//});
				}

				function submit() {
					$mdDialog.hide($scope.formModel.templateCreate);
				}

			}

			Dialog.show(dialogOptions)
				.then(function (newTemplateInstance) {
					deferred.resolve(newTemplateInstance);
				})
			;

			return deferred.promise;
		}
		
		
		
		/*-----------------------------------------------
		 * create form fields
		 * ----------------------------------------------
		 */
		
		function createNewFields(isEdit, fieldsList) {
			var deferred = $q.defer();
			
			//var editableModelsCopy = angular.extend({},fieldsList);

			var dialogOptions = {
				templateUrl: "app/modules/form/templates/addFields.dailog.tpl.html",
				controller: ['$scope', '$mdDialog', '$controller', '$timeout',
					createTemplateDialogController],
					clickOutsideToClose:false
			};

			function createTemplateDialogController($scope, $mdDialog, $controller, $timeout) {
				var self = this;
				$scope.form = {};
				$scope.fieldNumber = 1;
				$scope.isEdit = isEdit;
				
				function FormFieldModel(id) {
					this.fieldId = id;
				    this.name = "";
				    this.types = [ {type : "string", value: "Text"}, 
				                   {type : "radio", value: "Radio"},
				    			   {type : "checkbox", value: "Checkbox"},
				    			   {type : "textarea", value: "Text Area"}
				                  ];
				    this.selectedType = this.types[0];
				    this.label = "";
				    this.showFieldProps = false;
				    this.isValidator = false;
				    this.validations = {
				    		required: {isApplied: false, value: false},
				    		minLength: {isApplied: false, value: 0},
				    		maxLength: {isApplied: false, value: 0}
				    };
				    
				    this.owner = {
				    		userId: -1,
				    		userJobRole: "" 
				    };

				    this.fieldConditions = {
				    		showPredefFlag: false,
				    		hasPredefinedValue:false
				    };
				    
				    this.remove = false;
				}
				 
				FormFieldModel.prototype = {
				    getFieldsByType: function(type) {
				    	//@TODO
				      return this;
				    },
				    
				    fieldCount: function(count) {
				    	this.count=count;
				    	this.getPreparedFieldByType(this.selectedType.type);
				    	return this;
				    },
				    
				    getPreparedFieldByType: function(type,fromType) {
				    	switch (type) {
						case 'string':
							this.groupFields = [];
							this.showFieldProps = false;
							//this.textValue = "";
							this.validations.required.isApplied = true;
							
							if(this.isValidator){
								this.validations.minLength.isApplied = true;
								this.validations.maxLength.isApplied = true;
							}
							
							//this.fieldConditions.showPredefFlag = true;	
							// this.fieldConditions.hasPredefinedValue = false;
							
							return this;
							break;
							
						case 'radio':
							
							if (fromType) {
								this.count = 2;
							}
							
							this.groupFields = [];
							this.groupFieldName = (this.groupFieldName && this.groupFieldName.length > 0) ? this.groupFieldName.length : "";
							this.showFieldProps = true;
							this.minValue = 2;
							
							if (!this.count || this.count < 2) {
								this.count = 2;
							}
							
							for(var i = 0; i < this.count; i++){
								var grpField = {};
								grpField.label = "";
								grpField.value = "";
								grpField.isSelected = false;
								this.groupFields.push(grpField);
							}
							
							this.validations.required.isApplied = true;
							this.groupFieldValue = "";
							
							this.fieldConditions = {};
							
							return this;
							break;	
							
						case 'checkbox':

							if (fromType) {
								this.count = 1;
							}
							
							this.minValue = 1;
							
							if (!this.count || this.count < 1) {
								this.count = 1;
							}
							
							this.groupFields = [];
							this.groupFieldName = (this.groupFieldName && this.groupFieldName.length > 0) ? this.groupFieldName.length : "";
							this.showFieldProps = true;
							for(var i = 0; i < this.count; i++){
								var grpField = {};
								grpField.label = "";
								grpField.value = "";
								grpField.isSelected = false;
								this.groupFields.push(grpField);
							}
							
							if(this.isValidator){
								this.validations.required.isApplied = true;
							}
							
							this.fieldConditions = {};
							
							return this;
							break;
							
						case 'textarea':
							this.groupFields = [];
							this.showFieldProps = false;
							//this.textValue = "";
							this.validations.required.isApplied = true;
							
							if(this.isValidator){
								this.validations.minLength.isApplied = true;
								this.validations.maxLength.isApplied = true;
							}
							
							//this.fieldConditions.showPredefFlag = true;	
							// this.fieldConditions.hasPredefinedValue = false;
							
							return this;
							break;
							
						default : 	return this;
						
					 }
				    	
				    }	
				};
				
				
				
				
				function _init(){
					$scope.newfields = [ ];
					if(!isEdit){
						var _field = new FormFieldModel($scope.fieldNumber);
						_field.getPreparedFieldByType('string');
						$scope.newfields.push(_field);
					}else{
						$scope.newfields = fieldsList;
					}
				}
				
				_init();
				
				
				$scope.cancel = $mdDialog.cancel;
				$scope.submit = submit;
				$scope.addNewField = addNewField;
				$scope.removeNewField = removeNewField;
				$scope.updateField = updateField;
				
				
				function cancel(){
					var ind = _.findIndex($scope.newfields, {"name":editableModelCopy.name});
					if(ind > -1){
						$scope.newfields[ind] = editableModelCopy;
					}
					
				}

				function sendAddFieldsRequest() {
					
				}

				function submit() {
					$mdDialog.hide($scope.newfields);
				}
				
				
				function addNewField(){
					$scope.fieldNumber = $scope.fieldNumber + 1;
					var newField = new FormFieldModel($scope.fieldNumber);
					$scope.newfields.push(newField.getPreparedFieldByType(newField.selectedType.type));
				}
				
				function removeNewField(fieldIdParam){
					_.remove($scope.newfields, {"fieldId": fieldIdParam});
				}
				
				function updateField(field){
					//$scope.fieldNumber = $scope.fieldNumber + 1;
					var ind = _.findIndex($scope.newfields, {"id":field.id});
					if(ind > -1){
						$scope.newfields[ind] = field;
					}
					
					$mdDialog.hide($scope.newfields);
					
				}
				

			}

			Dialog.show(dialogOptions)
				.then(function (newFields) {
					var newFieldEntities = [];
					for(var i = 0; i < newFields.length; i++){
						newFieldEntities.push(newFields[i]);
						//(FormFieldService.parseFieldModelToEntity(newFields[i].selectedType.type, newFields[i]));
					}
					
					deferred.resolve(newFieldEntities);
				});

			return deferred.promise;
		}
		
		
		
		/*-----------------------------------------------
		 * Edit form fields
		 * ----------------------------------------------
		 */
		
		function editFormFields(fieldsList, isDelete, jobStatusAllowed, jobStatus){

			var deferred = $q.defer();
			
			//var editableModelsCopy = angular.extend({},fieldsList);

			var dialogOptions = {
				templateUrl: "app/modules/form/templates/addFields.dailog.tpl.html",
				controller: ['$scope', '$mdDialog', '$controller', '$timeout', 'JOB_FORM_FIELD_DEF','$filter',
					editTemplateDialogController],
					clickOutsideToClose:false
			};

			function editTemplateDialogController($scope, $mdDialog, $controller, $timeout, JOB_FORM_FIELD_DEF, $filter) {
				var self = this;
				
				$scope.jobStatus = jobStatus;
				
				$scope.isDeleteFieldsAvailable = true;
				
				$scope.jobStatusStart = JOB_STATUS.START;
				
				$scope.form = {};
				$scope.fieldNumber = 1;
				$scope.isEdit = !isDelete;
				$scope.isDelete = isDelete;
				$scope.jobStatusAllowed = jobStatusAllowed;
				$scope.FIELD_DEF_TYPE = JOB_FORM_FIELD_DEF;
				
				if (fieldsList){ 
					if (jobStatus == JOB_STATUS.START) {
						for ( var i = 0; i < fieldsList.length; i++) {
							if (fieldsList[i].definitionType == "postdefined" && fieldsList[i].canEdit) {
								$scope.isAnyPostdefined = true;
								break;
							}
						}

					}else{
						for ( var i = 0; i < fieldsList.length; i++) {
							if (fieldsList[i].canEdit) {
								$scope.hasFieldAccess = true;
								break;
							}
						}
					}
				}
				
				$scope.checkDeleteButtonStatus = function(newfields){
					var newTemp = $filter("filter")(newfields, {remove:true});
					if (newTemp.length>0) {
						$scope.isDeleteFieldsAvailable = false;
					} else {
						$scope.isDeleteFieldsAvailable = true;
					}
				}
				
				function FormFieldModel(id) {
					this.fieldId = id;
					this.id = -1;
				    this.name = "";
				    this.types = [ {type : "string", value: "Text"}, 
				                   {type : "radio", value: "Radio"},
				    			   {type : "checkbox", value: "Checkbox"},
				    			   {type : "textarea", value: "Text Area"}
				                  ];
				    this.selectedType = this.types[0];
				    this.label = "";
				    this.showFieldProps = false;
				    this.isValidator = false;
				    this.validations = {
				    		required: {isApplied: false, value: false},
				    		minLength: {isApplied: false, value: 0},
				    		maxLength: {isApplied: false, value: 0}
				    };
				    
				    this.owner = {
				    		userId: -1,
				    		userJobRole: "" 
				    };

				    this.fieldConditions = {
				    		showPredefFlag: false,
				    		hasPredefinedValue:false
				    };
				    
				    this.remove = false;
				}
				 
				FormFieldModel.prototype = {
				    getFieldsByType: function(type) {
				    	//@TODO
				      return this;
				    },
				    fieldCount: function(count) {
				    	this.count=count;
				    	this.getPreparedFieldByType(this.selectedType.type);
				    	return this;
				    },
				    removeGroupField: function(index){
				    	this.groupFields.splice(index, 1);
				    	this.count = this.groupFields.length;
				    	this.oldGroupFields.splice(index, 1);
				    },
				    getPreparedFieldByType: function(type) {
				    	switch (type) {
						case 'string':
							this.showFieldProps = false;
							//this.textValue = "";
							this.validations.required.isApplied = true;
							if(this.isValidator){
								this.validations.minLength.isApplied = true;
								this.validations.maxLength.isApplied = true;
							}
							
							this.selectedType = this.types[0];
							//this.fieldConditions.showPredefFlag = true;	
							// this.fieldConditions.hasPredefinedValue = false;
							
							return this;
							break;
							
						case 'radio':
							
							if( !this.oldGroupFields || (this.oldGroupFields && this.oldGroupFields.length == 0)){
								this.oldGroupFields = this.groupFields;
							}
							//var oldGroupFields = this.groupFields;
							
							this.groupFields = []
							
							if (!this.count || (this.count < this.oldGroupFields.length)) {
								this.count = this.oldGroupFields.length;
							}
							
							this.minValue = 2;
							
							for(var i = 0; i < this.count; i++){
								var grpField = {};
								grpField.label = "";
								grpField.value = "";
								grpField.isSelected = false;
								this.groupFields.push(grpField);
							}
							
							for ( var j = 0; j < this.oldGroupFields.length; j++) {
								
								if (this.groupFields[j]) {
									this.groupFields[j] = this.oldGroupFields[j];	
								}
							}
							
							
							this.groupFieldName = (this.groupFieldName && this.groupFieldName.length > 0) ? this.groupFieldName.length : "";
							this.showFieldProps = true;
							
							
							//this.groupFieldValue = "";
							this.selectedType = this.types[1];
							this.fieldConditions = {};
							
							return this;
							break;	
							
						case 'checkbox':
							
							if( !this.oldGroupFields || (this.oldGroupFields && this.oldGroupFields.length == 0)){
								this.oldGroupFields = this.groupFields;
							}
							
							//var oldCGroupFields = this.groupFields;
							
							this.groupFields = []
							
							if (!this.count || (this.count < this.oldGroupFields.length)) {
								this.count = this.oldGroupFields.length;
							}
							
							this.minValue = 1;
							
							for(var i = 0; i < this.count; i++){
								var grpField = {};
								grpField.label = "";
								grpField.value = "";
								grpField.isSelected = false;
								this.groupFields.push(grpField);
							}
							
							for ( var j = 0; j < this.oldGroupFields.length; j++) {
								
								if (this.groupFields[j]) {
									this.groupFields[j] = this.oldGroupFields[j];	
								}
							}
							
							this.groupFieldName = (this.groupFieldName && this.groupFieldName.length > 0) ? this.groupFieldName.length : "";
							this.showFieldProps = true;
							
							this.selectedType = this.types[2];
							this.fieldConditions = {};
							
							return this;
							break;
							
						case 'textarea':
							this.showFieldProps = false;
							//this.textValue = "";
							this.validations.required.isApplied = true;
							if(this.isValidator){
								this.validations.minLength.isApplied = true;
								this.validations.maxLength.isApplied = true;
							}
							
							this.selectedType = this.types[3];
							//this.fieldConditions.showPredefFlag = true;	
							// this.fieldConditions.hasPredefinedValue = false;
							
							return this;
							break;
							
						default : 	return this;
						
					 }
				    	
				    }	
				};
				
				
				
				
				function _initEdit(){
					$scope.newfields = [ ];
					for(var i = 0; i < fieldsList.length; i++){
						var _field = new FormFieldModel(i+1);
						var _fieldCopy = angular.copy(fieldsList[i]);
						var prepField = angular.extend(_field, _fieldCopy);
						
						$scope.newfields.push(prepField.getPreparedFieldByType(prepField.selectedType.type));
					}
					
					$scope.cancel = $mdDialog.cancel;
					$scope.submit = submit;
					$scope.addNewField = addNewField;
					$scope.removeNewField = removeNewField;
					$scope.updateField = updateField;
				}
				
				
				function cancel(){
					var ind = _.findIndex($scope.newfields, {"name":editableModelCopy.name});
					if(ind > -1){
						$scope.newfields[ind] = editableModelCopy;
					}
					
				}

				function sendAddFieldsRequest() {
					
				}

				function submit() {
					$mdDialog.hide($scope.newfields);
				}
				
				
				function addNewField(){
					$scope.fieldNumber = $scope.fieldNumber + 1;
					$scope.newfields.push(new FormFieldModel($scope.fieldNumber));
				}
				
				function removeNewField(id){
					var ind = _.findIndex($scope.newfields, {"id": id});
					_.remove($scope.newfields, {"id": id});
				}
				
				function updateField(allfields){
					//$scope.fieldNumber = $scope.fieldNumber + 1;
					for(var i = 0; i < allfields.length; i++){
						var ind = _.findIndex($scope.newfields, {"id":allfields[i].id});
						if(ind > -1){
							$scope.newfields[ind] = allfields[i];
						}
					}
					
					
					$mdDialog.hide($scope.newfields);
					
				}
				
				_initEdit();

			}

			Dialog.show(dialogOptions)
				.then(function (newFields) {
					var newFieldEntities = [];
					for(var i = 0; i < newFields.length; i++){
						newFields[i].oldGroupFields && (delete newFields[i].oldGroupFields); 
						newFieldEntities.push(newFields[i]);
						//(FormFieldService.parseFieldModelToEntity(newFields[i].selectedType.type, newFields[i]));
					}
					
					deferred.resolve(newFieldEntities);
				});

			return deferred.promise;
		
		}
		
	}
})();