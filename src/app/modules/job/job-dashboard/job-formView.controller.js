
(function() {
	"use strict";

	angular.module('app')
		.controller('JobFormViewController', [
			'$scope','$log','mDialog','$rootScope','$stateParams','TemplateManagerUiProvider',
			'DataProvider', 'blockUI', 'Lang','AuditService','CATEGORY_TYPE','URL','JOB_FORM_FIELD_DEF', 
			'JOB_STATUS',JobFormViewController
		]);
	
	function JobFormViewController($scope,$log,Dialog,$rootScope,$stateParams, TemplateManagerUiProvider,
			DataProvider, blockUI, Lang, AuditService, CATEGORY_TYPE, URL, JOB_FORM_FIELD_DEF, 
			JOB_STATUS) {
		
		var jobId = $stateParams.jobId;
		var LANG = Lang.en.data;
		
		$scope.JobTabCtrl.tab_curr = 'TAB_FORM';
		// we would get this from the api
		$scope.entity={ name : "Job Form", 
							fields : []
						  };
		$scope.formModel = {
				fields : []
		};
		
		$scope.FIELD_DEF = JOB_FORM_FIELD_DEF;
		
		$scope.canDisable = true;
		$scope.JOB_STATUS = JOB_STATUS;
		
		
		$scope.formFieldEntity = {};
		
//		$scope.JobTabCtrl.jobModel = DataProvider.resource.Job.get($stateParams.jobId);
		
		var jobModel = $scope.JobTabCtrl.jobModel;
		
		function fetchJobDetails() {
			return DataProvider.resource.Job.find(jobId, {
					bypassCache: true
				})
				.then(function (jobModel) {
					$scope.JobTabCtrl.jobModel = jobModel;
					return jobModel;
				});
		}
		
		function init(){
			fetchJobDetails();
		}
		
		//init();
		
	    /*$scope.entity = {
	      name : "Course", 
	      fields :
	        [
	          {type: "text", name: "firstname", label: "Name" , required: true, data:""},
	          {type: "radio", name: "color_id", label: "Colors" , options:[{id: 1, name: "orange"},{id: 2, name: "pink"},{id: 3, name: "gray"},{id: 4, name: "cyan"}], required: true, data:""},
	          {type: "email", name: "emailUser", label: "Email" , required: true, data:""},
	          {type: "text", name: "city", label: "City" , required: true, data:""},
	          {type: "password", name: "pass", label: "Password" , min: 6, max:20, required: true, data:""},
	          {type: "select", name: "teacher_id", label: "Teacher" , options:[{name: "Mark"},{name: "Claire"},{name: "Daniel"},{name: "Gary"}], required: true, data:""},
	          {type: "checkbox", name: "car_id", label: "Cars" , options:[{id: 1, name: "bmw"},{id: 2, name: "audi"},{id: 3, name: "porche"},{id: 4, name: "jaguar"}], required: true, data:""},
	          {type: "textarea", name: "description", label: "description" , required: true, data:""}
	        ]
	      };*/

		//$scope.entity.fields.push({type: "text", name: "Job Name", label: "Job Name" , required: true, data:""});
		//$scope.entity.fields.push({type: "text", name: "Job Description", label: "Job Status Description" , required: true, data:""});
		//$scope.entity.fields.push({type: "checkbox", name: "car_id", label: "Job Status" , options:[{id: 1, name: "In Progress"},{id: 2, name: "Completed"}]});
		
		
		
	      $scope.submitJobForm = function(isEdit){
	    	  
	    	  blockUI.start("Updating Form");
	    	 
	    	  
	        var jobFormModel = {};
	        jobFormModel.formFields = [];
	        jobFormModel.name = $scope.JobTabCtrl.jobModel.title+" Job Form";
	        jobFormModel.desc = $scope.JobTabCtrl.jobModel.title+" Job Form";
	        jobFormModel.jobId = $scope.JobTabCtrl.jobModel.id;
	        //jobFormModel.form_template_id = $scope.JobTabCtrl.jobModel.id;
	        //jobFormModel.create_date = (new Date()).getTime();
	        
	        if($scope.formModel.fields.length > 0){
				for(var i = 0; i < $scope.formModel.fields.length; i++){
					var fieldObj = {};
					fieldObj.keyName = $scope.formModel.fields[i].name;
					fieldObj.keyType = $scope.formModel.fields[i].selectedType.type;
					fieldObj.keyValue = $scope.formModel.fields[i].label;
					fieldObj.templateOptions = $scope.formModel.fields[i];
					fieldObj.definitionType = $scope.formModel.fields[i].definitionType;
					fieldObj.id = $scope.formModel.fields[i].id;
					fieldObj.canEdit = $scope.formModel.fields[i].canEdit;
					fieldObj.userId = $scope.formModel.fields[i].userId;
					fieldObj.remove = $scope.formModel.fields[i].remove;
					fieldObj.fieldSelectedCount = getFieldSelectedCount($scope.formModel.fields[i]);
					
					jobFormModel.formFields.push(fieldObj);
				}
			}
	        
	        if(isEdit){
	        	
	        	jobFormModel.id = $scope.JobTabCtrl.jobModel.form.id;
	        	
	        	DataProvider.resource.Form.updateForm(jobFormModel)
				.then(function (resFormModel) {
					var resJobFormModel = resFormModel;
					initJobFormView();
					$scope.canDisable = true;
					 blockUI.stop("Form Updated Successfully", {
							status: 'isSuccess',
							action: LANG.BUTTON.OK
						});
				},
				function(err){
					initJobFormView();
					blockUI.stop();
					Dialog.alert({
						content: err.respMsg,
						ok: "Ok"
					});
				});
	        	
	        }else{
	        	 DataProvider.resource.Form.createForm(jobFormModel)
					.then(function (resFormModel) {
						var resJobFormModel = resFormModel.resp;
						$scope.JobTabCtrl.jobModel.form = resJobFormModel;
						$scope.JobTabCtrl.jobModel.form.id = resJobFormModel.formId;
						initJobFormView();
						$scope.canDisable = false;
						blockUI.stop("Form Updated Successfully", {
							status: 'isSuccess',
							action: LANG.BUTTON.OK
						});
						$scope.isFormExist = false;
					},
					function(err){
						initJobFormView();
						blockUI.stop();
						Dialog.alert({
							content: err.respMsg,
							ok: "Ok"
						});
					});
	        }

	        
	      };
//
//	      $scope.fetchJobDetails()
//			.then(function () {
//				getFormMenuList();
//				fetchAllJobForms();
//			});
	      
	      function initJobFormView() {
	    	  getFormMenuList();
	    	  fetchJobDetails().then(function(job){
	    		  $scope.isJobInProgress = ($scope.JobTabCtrl.jobModel.status == JOB_STATUS.FINISH || $scope.JobTabCtrl.jobModel.status == JOB_STATUS.CLOSE);
	    		  fetchAllJobForms();  
	    	  });
			}
	      
	      
	      function fetchAllJobForms(){
	    	  $scope.JobTabCtrl.jobModel.form &&
	    	  DataProvider.resource.Form.viewForm({id: $scope.JobTabCtrl.jobModel.form.id})
				.then(function (jobForms) {
					var form = jobForms;
					$scope.formModel = {
							fields : []
					};
					
					if (form && form.formId) {
						$scope.isFormExist = true;
					}
					
					if(form && !!form.fields && form.fields.length > 0){
						$scope.formModel.formId = form.formId;
						for(var i = 0; i < form.fields.length; i++){
							 
							form.fields[i].templateOptions.canEdit = form.fields[i].canEdit;
							form.fields[i].templateOptions.id = form.fields[i].id;
							form.fields[i].templateOptions.definitionType = form.fields[i].definitionType;
							form.fields[i].templateOptions.userId = form.fields[i].userId;
							$scope.formModel.fields.push(form.fields[i].templateOptions);
						}
						$scope.isUpdate = true;
						$scope.isFormExist = false;
					}
				});
	      }
	      
	      function getFormMenuList() {

				$scope.JobTabCtrl.optionMenuItems.TAB_FORM = [];

				var formMenuItems = [{
					name: "Add Fields",
					action: createFieldsClicked,
					isAllowed: !($scope.JobTabCtrl.jobModel.status == JOB_STATUS.FINISH || $scope.JobTabCtrl.jobModel.status == JOB_STATUS.CLOSE)
				},
				{
					name: "Edit Fields",
					action: editFieldsClicked,
					isAllowed: !($scope.JobTabCtrl.jobModel.status == JOB_STATUS.FINISH || $scope.JobTabCtrl.jobModel.status == JOB_STATUS.CLOSE)
				},
				{
					name: "Delete Fields",
					action: deleteFieldsClicked,
					isAllowed: !($scope.JobTabCtrl.jobModel.status == JOB_STATUS.FINISH || $scope.JobTabCtrl.jobModel.status == JOB_STATUS.CLOSE)
				},
				{
					name: "Audit",
					action: auditClicked,
					isAllowed: true
				}];
				angular.forEach(formMenuItems, function (menuItem) {
					if (menuItem.isAllowed) {
						$scope.JobTabCtrl.optionMenuItems.TAB_FORM.push(menuItem);
					}
				});
			}
	      
	      function createFieldsClicked(){
				TemplateManagerUiProvider.createNewFields()
				.then(function(newFields){
					if(newFields && newFields.length > 0){
						$scope.entity.fields = newFields;
						for(var i = 0; i < newFields.length; i++){
							$scope.formModel.fields.push(newFields[i]);
						}
						if ($scope.isFormExist) {
							$scope.submitJobForm($scope.isFormExist);
						} else {
							$scope.submitJobForm($scope.isUpdate);
						}
						
					}
				});
			}
	      
	      
	      function editFieldsClicked(){
	    	  
	    	  var isJobStatusActionsAllowed = ($scope.JobTabCtrl.jobModel.status != JOB_STATUS.START) && ($scope.JobTabCtrl.jobModel.status != JOB_STATUS.FINISH);
	    	  
	    	  TemplateManagerUiProvider.editFormFields($scope.formModel.fields, false, isJobStatusActionsAllowed, $scope.JobTabCtrl.jobModel.status)
	    	  .then(function(newFields){
					if(newFields && newFields.length > 0){
						$scope.formModel.fields = [];
						$scope.entity.fields = newFields;
						for(var i = 0; i < newFields.length; i++){
							if(newFields[i].canEdit){
								$scope.formModel.fields.push(newFields[i]);
							}
						}
						
						$scope.submitJobForm(true);
					}
				});
			}
	      
	      function deleteFieldsClicked(){
	    	  var isJobStatusActionsAllowed = ($scope.JobTabCtrl.jobModel.status != JOB_STATUS.START) && ($scope.JobTabCtrl.jobModel.status != JOB_STATUS.FINISH);
	    	  TemplateManagerUiProvider.editFormFields($scope.formModel.fields, true, isJobStatusActionsAllowed,  $scope.JobTabCtrl.jobModel.status)
	    	  .then(function(newFields){
					if(newFields && newFields.length > 0){
						$scope.formModel.fields = [];
						$scope.entity.fields = newFields;
						for(var i = 0; i < newFields.length; i++){
						//	if(!newFields[i].remove){
								$scope.formModel.fields.push(newFields[i]);
						//	}
						}
						
						$scope.submitJobForm(true);
					}
				});
			}
	      
	      function auditClicked() {
				var params = {};
				params.catId = $stateParams.jobId;
				params.catType = CATEGORY_TYPE.JOB;

				blockUI.start("Fetching Audit data");
				AuditService.checkAuditList(URL.FORM_AUDIT,params).then(function (res) {
					if (res.results.length > 0) {
						var title = "";
						blockUI.stop();

						AuditService.showAudit(URL.FORM_AUDIT,params,title, res).then(function (res) {

						}).catch(function (err) {
							Dialog.alert({
								content: err.message,
								ok: "Ok"
							});
						});
					} else{
						blockUI.stop("No Audits available", {
							status: 'isSuccess',
							action: LANG.BUTTON.OK
						})
					}
				})
				.catch(function (err) {
					Dialog.alert({
						content: err.message,
						ok: "Ok"
					});
				}).finally(function () {
					blockUI.stop();
				});
			}
			
	      function filterUserEditFields(formFields){
	    	  var editableFields = [];
	    	  for(var i = 0; i < formFields.length; i++){
	    		  if(formFields[i].canEdit){
	    			  editableFields.push(formFields[i]);
	    		  }
	    	  }
	    	  
	    	  return editableFields;
	      }
	      
	      function getFieldSelectedCount(field){
	    	  var selCount = 0;
	    	  
	    	  switch(field.selectedType.type){
	    	  	case "radio":
	    	  		if(field.groupFieldValue && field.groupFieldValue.length > 0){
	    	  			selCount = 1;
	    	  		}
	    	  		break;
	    	  		
	    	  	case "checkbox":
	    	  		if(field.groupFields && field.groupFields.length > 0){
	    	  			for(var i = 0; i < field.groupFields.length; i++){
	    	  				field.groupFields[i].isSelected && selCount++;
	    	  			}
	    	  		}
	    	  		break;
	    	  		
	    	  	 default: selCount = 0;	
	    	  }
	    	  
	    	  return selCount;
	      }
	      
	      
	      initJobFormView();
	}
	
	
})();
