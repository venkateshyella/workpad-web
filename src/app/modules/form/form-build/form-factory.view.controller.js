/**
 * Created by sudhir on 8/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.controller('FormFactoryViewController', ['$scope', '$stateParams',
			'DataProvider', 'FormService', 'TemplateManagerUiProvider', 'State',
			'mDialog',
			FormFactoryViewController
		])
	;

	function FormFactoryViewController($scope, $stateParams
		, DataProvider, FormService, TemplateManagerUiProvider, State, Dialog) {
		var tplId = $stateParams.tplId || null
			, tplModel = tplId
				? DataProvider.FormTemplate.get(tplId)
				: DataProvider.resource.FormTemplate.createInstance()
			;

		$scope.selectAndAddNewField = selectAndAddNewField;
		$scope.submit = submit;

		$scope.askAndCreateNewTemplate = function () {
			TemplateManagerUiProvider.askAndCreateNewTemplate()
				.then(function (templateInstance) {
					State.transitionTo('root.app.template-edit', {
						name: templateInstance.name,
						desc: templateInstance.desc
					})
				});
		};

		_initMockForm();

		function _initMockForm() {
			$scope.mockFields = [];
			var fieldDefinition
				, newStringField
				, newNumberField
				, newCheckboxField,newToggleField
				, newDatePickerField
				, newUploadField
				, newFilelinkField
				;

			/*newStringField = DataProvider.resource.FormField.createInstance({
				keyType: 'string',
				validation: {
					length: {
						minimum: 5
					},
					presence :false
				},
				templateOptions: {
					definition: FormService.getFieldDefinition('string'),
					fieldModel: {
						label: "Hello"
					}
				}
			});
			$scope.mockFields.push(newStringField); */
			

			/*	newNumberField = DataProvider.resource.FormField.createInstance({
				keyType: 'number',
				validation: {},
				templateOptions: {
					definition: FormService.getFieldDefinition('number'),
					fieldModel: {
						label: "Enter value" 
					}
				}
			});
			$scope.mockFields.push(newNumberField); */


		/*	newCheckboxField = DataProvider.resource.FormField.createInstance({
				keyType: 'checkbox',
				validation: {},
				templateOptions: {
					definition: FormService.getFieldDefinition('checkbox'),
					fieldModel: {
						label: "Select checkbox list",
						desc: "This is a test field for checkbox",
						checkBoxListData: [{
							name: "CB1",
							selected: true
						}, {
							name: "CB2",
							selected: true
						}]
					}
				}
			});
			$scope.mockFields.push(newCheckboxField);*/

      /*newToggleField = DataProvider.resource.FormField.createInstance({
				keyType: 'toggle',
				validation: {
					presence :true
				},
				templateOptions: {
					definition: FormService.getFieldDefinition('toggle'),
					fieldModel: {
						label: "toggle switch",
						desc: "This is a discription field for toggle"
					}
				}
			}); 
			$scope.mockFields.push(newToggleField); */

     /* newDatePickerField = DataProvider.resource.FormField.createInstance({
				keyType: 'datepicker',
				validation: {},
				templateOptions: {
					definition: FormService.getFieldDefinition('datepicker'),
					fieldModel: {
						label: "Date picker",
						desc: "This is a date picker field"
					}
				}
			});
			$scope.mockFields.push(newDatePickerField); */


			newUploadField = DataProvider.resource.FormField.createInstance({
				keyType: 'upload',
				validation: {
					presence :false
				},
				templateOptions: {
					definition: FormService.getFieldDefinition('upload'),
					fieldModel: {
						label: "Upload File"
					}
				}
			});
			$scope.mockFields.push(newUploadField);




			/*newFilelinkField = DataProvider.resource.FormField.createInstance({
				keyType: 'filelink',
				validation: {
					presence :false
				},
				templateOptions: {
					definition: FormService.getFieldDefinition('filelink'),
					fieldModel: {
						label: "Link File"
					}
				}
			});
			$scope.mockFields.push(newFilelinkField);*/

		}

		function selectAndAddNewField() {
			Dialog.show({
				templateUrl: "",
				controller: ['$scope', function ($scope) {
				}]
			});
		}

		function submit(formModel) {
			var payload = [];
			angular.forEach(formModel, function(formField) {
				payload.push(formField.toJSON());
			});

			console.log(payload);
		}

	}

})();