angular.module('app.modules')
.directive("dynamicName",function($compile){
    return {
        restrict:"A",
        terminal:true,
        priority:1000,
        link:function(scope,element,attrs){
            element.attr('name', scope.$eval(attrs.dynamicName));
            element.removeAttr("dynamic-name");
            $compile(element)(scope);
        }
    }
});






;(function () {
	"use strict";

	angular.module('app')
		.directive('dynamicFormField', ['$timeout','$compile','AppCoreUtilityServices',
		                                'TemplateManagerUiProvider','JOB_FORM_FIELD_DEF', DynamicFormFieldDirective])
	;

	function DynamicFormFieldDirective($timeout, $compile, AppCoreUtilityServices, 
			                            TemplateManagerUiProvider, JOB_FORM_FIELD_DEF) {


		var _templates =  {string_field_path: 'app/modules/form/templates/string-field/string-preview.partial.html',
						   checkbox_field_path: 'app/modules/form/templates/checkbox-field/checkbox-preview.partial.html',
						   radio_field_path: 'app/modules/form/templates/radio-field/radio-preview.partial.html',
						   textarea_field_path: 'app/modules/form/templates/string-field/textarea-preview.partial.html'
		                   };
		
		                  

		function preLink(scope, elem, attrs) {

		}

		function postLink(scope, elem, attrs, ctrls) {
			
			var fieldPreviewTemplate = _templates[scope.fieldModel.selectedType.type+"_field_path"];

			if(fieldPreviewTemplate){
				AppCoreUtilityServices.getTemplate(fieldPreviewTemplate)
				.then(function (resp) {
					elem.append($compile(resp.data)(scope));
				});	
			}
			
			
			scope.editFieldModel = function(model){
				TemplateManagerUiProvider.createNewFields(true, model);
			};
			
			scope.deleteFieldModel = function(model){
				_.remove(scope.fieldsList, {"name": model.name});
			};
			
			scope.FIELD_DEF = JOB_FORM_FIELD_DEF;
			
		}
		
		
		function dynamicFormFieldController($scope, $q){
			
		}
		
		
		return {
			restrict: 'E',
			link: {
				pre: preLink,
				post: postLink
			},
			scope: {
				fieldModel: '=',
				fieldsList: '=',
				canDisable: '=',
				jobDynamicForm:'=',
				isJobInProgress:'='
			},
			template: '<div></div>',
			controller: ['$scope', '$q', dynamicFormFieldController]
		};

	}

})();

