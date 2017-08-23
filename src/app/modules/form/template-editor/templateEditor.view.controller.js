/**
 * Created by sudhir on 13/10/15.
 */


;
(function () {
	"use strict";

	angular.module('app')
		.controller('TemplateEditorViewController', [
			'$scope', '$stateParams', '$controller', '$timeout',
			'DataProvider', 'FormService', 'TemplateManagerUiProvider',
			'JobService',
			'mDialog', 'Lang',
			TemplateEditorViewController
		])
	;

	function TemplateEditorViewController($scope, $stateParams, $controller
		, $timeout
		, DataProvider, FormService, TemplateManagerUiProvider
		, JobService
		, Dialog, Lang) {

		var self = this
			, tplId = $stateParams.id ? parseInt($stateParams.id) : null
			, prefillArguments = {
				name: $stateParams.name,
				desc: $stateParams.desc
			}
			, EDITOR_FORM_NAME = "templateEditorForm"
			, LANG = Lang.en.data
			;

		$scope.ui = {
			flags: {
				editorMode: 'edit'
			}
		};
		$scope.LANG = LANG.TEMPLATE_EDITOR;
		$scope.form = {};
		$scope.formModel = {};

		$scope.resetFormModel = _initFormModelAndFlags;
		$scope.submit = submit;
		$scope.askAndDeleteTemplateModel = askAndDeleteTemplateModel;
		$scope.restoreTemplateModel = restoreTemplateModel;
		$scope.templateEditorCtrl = {
			selectAndAddNewField: selectAndAddNewField,
			removeField: removeField
		};
		$scope.useTemplateInAJob = useTemplateInAJob;
		$scope.isTemplateValid = isTemplateValid;

		angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));
		self.templateDataLoader = self.initializeViewDataBaseController('templateModel',
			fetchTemplateModel, findTemplateModel);

		angular.extend(self, $controller('FormBaseController', {$scope: $scope}));
		//angular.extend(self, self.initializeEditorToolbar(EDITOR_TOOLBAR_NAME, EDITOR_FORM_NAME));
		angular.extend(self, self.initializeForm(EDITOR_FORM_NAME, {
			submitFn: saveAndUpdateTemplateModel,
			messages: {
				inProgress: "Saving template..",
				success: "Saved!",
				error: ""
			}
		}));

		init();

		function init() {
			if (!tplId) $scope.ui.flags.editorMode = 'new';
			_initFormModelAndFlags();

			$timeout(function () {
				if (prefillArguments.name || prefillArguments.desc) {
					$scope.form[EDITOR_FORM_NAME].$setDirty();
				}
			}, 500);
		}

		function submit() {
			if (!isTemplateValid()) {
				Dialog.alert({
					title: LANG.TEMPLATE_EDITOR.DIALOG.INVALID_TEMPLATE.TITLE,
					content: LANG.TEMPLATE_EDITOR.DIALOG.INVALID_TEMPLATE.CONTENT,
					ok: LANG.BUTTON.OK
				})
			} else {
				self[EDITOR_FORM_NAME].submit()
					.then(function () {
						$scope.form[EDITOR_FORM_NAME].$setPristine();
					})
					.catch(function () {
						$scope.form[EDITOR_FORM_NAME].$setDirty();
					})
				;
			}
		}

		function isTemplateValid() {
			var templateFormModel = $scope.formModel[EDITOR_FORM_NAME];
			if (templateFormModel.template && !templateFormModel.template.length > 0) {
				return false;
			}
			return true;
		}

		function useTemplateInAJob() {
			var jobOwnerFinder = JobService.contentProvider.myJobListFinder();

			Dialog.showSearchSelector(jobOwnerFinder, {
				title: "Select Job",
				itemListUrl: 'app/modules/job/templates/job-itemList.partial.html'
			})
				.then(function (job) {
					Dialog.confirm({
						title: "Add Form",
						content: "Confirm add new form to job"
					})
						.then(function () {
							$scope.appProgressBlocker.start('Adding form to job');
							job.addNewForm(tplId, {
								name: $scope.formModel.templateEditorForm.name,
							})
								.then(function (res) {
									$scope.appProgressBlocker.stop();
								})
								.catch(function (err) {
									$scope.appProgressBlocker.stop(err.respMsg, {
										status: 'isError',
										action: 'ok'
									});
								})
							;
						})
					;
				})
				.catch(function (err) {
					console.log(err);
				})
			;
		}

		function selectAndAddNewField($event) {
			var fields = [];
			angular.forEach(FormService.getAvailableFields(), function (field, key) {
				fields.push({
					text: key,
					value: field
				})
			});

			Dialog.showListDialog(fields, {$event: $event})
				.then(function (selection) {
					var fieldDef
						, newField
						, fieldDefinition
						;
					fieldDef = selection.value;
					//newField = FormService.createNewFormFieldInstance(fieldDef.type);
					fieldDefinition = FormService.getFieldDefinition(fieldDef.type);
					if (!fieldDefinition) {
						console.error('field "' + type + '" was not found. Please define this field before using it');
					} else {
						newField = DataProvider.resource.FormField.createInstance({
							keyType: fieldDef.type,
							validation: fieldDefinition.validators,
							templateOptions: {
								definition: fieldDefinition,
								fieldModel: fieldDef.fieldData.fieldModel || {}
							}
						});

					}

					addNewField(newField);

				})
		}

		function removeField(fieldName, $event) {
			if (!angular.isArray($scope.formModel[EDITOR_FORM_NAME].template)) {
				return null;
			} else {
				var index = _.findIndex($scope.formModel[EDITOR_FORM_NAME].template,
					function (field) {
						return field.keyName == fieldName;
					});

				if (index >= 0) {
					if (tplId) {
						//DataProvider.resource.FormTemplate.eject($scope.formModel[EDITOR_FORM_NAME].template[index].keyName)
						DataProvider.resource.FormField.eject(fieldName);
					} else {
						$scope.formModel[EDITOR_FORM_NAME].template.splice(index, 1)
					}
					$scope.form[EDITOR_FORM_NAME].$setDirty();
				}
			}
		}

		function addNewField(formField) {
			!angular.isArray($scope.formModel[EDITOR_FORM_NAME].template)
			&& ($scope.formModel[EDITOR_FORM_NAME].template = []);

			if (tplId) {
				var templateUpdateObject = [];
				templateUpdateObject.push(formField);
				DataProvider.resource.FormTemplate.inject({
					templateId: tplId,
					template: templateUpdateObject
				});
			} else {
				$scope.formModel[EDITOR_FORM_NAME].template.push(formField);
			}

			//$scope.formModel[EDITOR_FORM_NAME].template.push(formField);
			$scope.form[EDITOR_FORM_NAME].$setDirty();
		}

		function fetchTemplateModel() {
			$timeout(function () {
				return findTemplateModel();
			}, 500);
		}

		function saveAndUpdateTemplateModel() {
			console.log($scope.formModel);
			var promise;
			if (tplId) {
				promise = DataProvider.resource.FormTemplate.update(tplId, $scope.formModel[EDITOR_FORM_NAME])
			} else {
				promise = DataProvider.resource.FormTemplate.create($scope.formModel[EDITOR_FORM_NAME]);
			}
			promise
				.then(function (res) {
					console.log(res);
				})
				.catch(function (err) {
					console.log(err)
				})
			;
			return promise;
		}

		function askAndDeleteTemplateModel() {
			Dialog.confirm({
				content: "Do you wish to Delete this template",
				ok: "Delete",
				cancel: "Cancel"
			})
				.then(function (res) {
					$scope.appProgressBlocker.start("Deleting..");
					DataProvider.resource.FormTemplate.destroy($scope.formModel[EDITOR_FORM_NAME].templateId)
						.then(function (deletdId) {
							$scope.appProgressBlocker.stop(res.respMsg, {
								status: 'isSuccess'
							});
							$scope.transitionBack();
						})
						.catch(function (err) {
							$scope.appProgressBlocker.stop(err.respMsg, {
								status: 'isError',
								action: 'Ok'
							})
						})
					;
				})
			;
		}

		function _initFormModelAndFlags() {
			if (!tplId) {
				$scope.formModel[EDITOR_FORM_NAME] = {};
				angular.extend($scope.formModel[EDITOR_FORM_NAME], angular.copy(prefillArguments));
				$scope.formModel[EDITOR_FORM_NAME].template = [];
				self.savedFormModel = angular.copy($scope.formModel[EDITOR_FORM_NAME]);
			} else {
				$scope.formModel[EDITOR_FORM_NAME]
					= angular.copy(findTemplateModel());
				self.savedFormModel = findTemplateModel().toJSON({all: true});

				// init edit flags
				$scope.ui.flags.canEditTemplate = $scope.formModel[EDITOR_FORM_NAME].canEdit
			}
		}

		function restoreTemplateModel() {
			if (tplId) {
				DataProvider.resource.FormField.ejectAll({
					where: {
						keyName: {
							in: _.pluck(findTemplateModel().template, 'keyName')
						}
					}
				});

				DataProvider.resource.FormTemplate.inject({
					templateId: tplId,
					template: angular.copy(self.savedFormModel.template)
				});
				$scope.formModel[EDITOR_FORM_NAME]
					= angular.copy(findTemplateModel());
				$timeout(angular.noop);
			} else {
				$scope.formModel[EDITOR_FORM_NAME] = angular.copy(self.savedFormModel);
			}
			$scope.form[EDITOR_FORM_NAME] && $scope.form[EDITOR_FORM_NAME].$setPristine();
		}

		function findTemplateModel() {
			return DataProvider.resource.FormTemplate.get(tplId)
		}

	}

})();