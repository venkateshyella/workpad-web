/**
 * Created by sudhir on 26/10/15.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.service('TaskWorkflowRunner', [
			'$q', 'DataProvider', 'mDialog', 'blockUI', 'TASK_LIFECYCLE_EVENT',
			TaskWorkflowRunner])
	;

	function TaskWorkflowRunner($q, DataProvider, Dialog, blockUI, TASK_LIFECYCLE_EVENT) {
		return {
			showAddFormDialog: showAddFormDialog,
			onTaskLifeCycleEventTrigger: onTaskLifeCycleEventTrigger,
			showFormSubmitDialog: showFormSubmitDialog
		};

		/* Task life cycle management block */

		function onTaskLifeCycleEventTrigger(taskModel, eventName) {

			Dialog.show({
				controller: ['$scope', '$mdDialog', 'Lang', taskStatusChangeDialogController],
				templateUrl: 'app/modules/task/templates/task-statusChange.dialog.tpl.html'
			});

			function taskStatusChangeDialogController($scope, $mdDialog, Lang) {

				var LANG = Lang.en.data;

				$scope.taskModel = taskModel;


				taskModel.loadForms().then(function (data) {
					console.log(data);

					$scope.availableForms = taskModel.getFormsByFilter({
						isSubmitted: false,
						triggerCode: TASK_LIFECYCLE_EVENT[eventName]
					});
				});


				$scope.lifecycleEvent = eventName;

				$scope.form = {};
				$scope.formModel = {};
				$scope.formModel.taskStatusChange = {};
				$scope.isMandatory = false;


				$scope.dialogHeading = LANG.TASK.BUTTON[eventName] + " Task";
				$scope.infoMsgOfForms = LANG.TASK.LABEL.PENDING_FORMS_TEXT[eventName];

				if (eventName == "TRY_FINISH" || eventName == "TRY_REJECT") {
					$scope.isMandatory = true;
				}

				$scope.showFormSubmissionDialog = function showFormSubmissionDialog(formModel) {
					showFormSubmitDialog(formModel);
				};

				$scope.cancel = function () {
					$mdDialog.hide();
				}
				$scope.submit = function submit() {
					var comment = $scope.formModel.comment;
					switchJobChangeEvent(taskModel, eventName, comment);
					$mdDialog.hide();
				}
			}


		}


		function showFormSubmitDialog(form) {
			var dialogOptions = {
				locals: {
					form: form
				},
				templateUrl: 'app/modules/form/templates/form-submit.dialog.tpl.html',
				controller: ['$scope', '$mdDialog', '$timeout', 'DataProvider', 'form',
					FormSubmitDialogController],
				controllerAs: 'formSubmitCtrl'
			};

			Dialog.show(dialogOptions);

			function FormSubmitDialogController($scope, $mdDialog, $timeout, DataProvider, form) {
				$scope.cancel = $mdDialog.cancel;

				$scope.isFormValid = isFormValid;

				$scope.submit = function submitForm() {
					var formValidationResult = form.validate();

					if (formValidationResult.length > 0) {
						// Form has errors.
						return;
					}
					blockUI.start('submitting form');
					form.submit()
						.then(function (res) {
							console.log(res);
							blockUI.stop(res.respMsg, {
								status: 'isSuccess'
							})

							$mdDialog.hide().then(function () {


								console.log("dialog closed");

							});
						})
						.catch(function (err) {
							blockUI.stop(err.respMsg, {
								status: 'isError',
								action: 'Ok'
							})
						})
					;

					function _submitFormData() {
						var deferred = $q.defer();
						var formJSON = form.toJSON({filter: 'submit'});
						Connect.post(URL.JOB_FORM_SUBMIT, formJSON)
							.then(function (res) {
								deferred[res.iSuccess ? 'resolve' : 'reject'](res);
							})
							.catch(function (err) {
								deferred.reject(err);
							})
						;
						return deferred.promise;
					}
				};

				DataProvider.resource.Form.find(form.formId, {
						bypassCache: true
					})
					.then(function (res) {
						isFormValid();
						$scope.formModel = DataProvider.resource.Form.get(form.formId);
						$timeout(angular.noop);
					})
					.catch(function (err) {
						console.log(err);
					})
				;
				function isFormValid() {
					if (!form || !form.validate) return false;
					var formValidationResult = form.validate();
					if (formValidationResult.length > 0) {
						$scope.formError = formValidationResult;
						return false;
					} else {
						$scope.formError = [];
						return true;
					}
				}

			}
		}

		function switchJobChangeEvent(taskModel, eventName, comment) {


			var tryEventName;
			switch (eventName) {
				case "TRY_START":
					tryEventName = 'try_start';
					break;
				case "TRY_STOP":
					tryEventName = 'try_stop';
					break;
				case "TRY_RESUME":
					tryEventName = 'try_resume';
					break;
				case "TRY_FINISH":
					tryEventName = 'try_finish';
					break;
				case "TRY_CLOSE":
					tryEventName = 'try_close';
					break;
				case "TRY_REJECT":
					tryEventName = 'try_reject';
					break;
				case "TRY_CANCEL":
					tryEventName = 'try_cancel';
					break;

			}

			taskModel[tryEventName](comment)
				.then(function (res) {
					/*$timeout(function () {
					 });*/
				})
				.catch(function (err) {
					Dialog.alert({
						content: err.respMsg,
						ok: "Ok"
					})
				})
				.finally(function () {
				});

		}

		function showAddFormDialog(taskId, templateId, options) {
			var deferred = $q.defer()
				, taskModel = DataProvider.resource.Task.get(taskId)
				, template = DataProvider.resource.FormTemplate.get(templateId)
				, _dialogOptions = {
					templateUrl: 'app/modules/task/templates/task-form-add.dialog.tpl.html',
					controller: ['$scope', '$mdDialog', 'blockUI', 'Lang', 'task', 'template',
						AddFormToTaskDialogController],
					controllerAs: 'taskFormCreateCtrl',
					locals: {
						task: taskModel,
						template: template
					}
				}
				;

			Dialog.show(_dialogOptions);

			return deferred.promise;

			function AddFormToTaskDialogController($scope, $mdDialog, blockUI, Lang, task, template) {
				var self = this;
				$scope.task = task;
				$scope.template = template;
				$scope.form = {};
				$scope.formModel = {
					name: template.name + "",
					desc: null,
					lifecycleEvent: null
				};

				self.LANG = Lang.en.data;
				self.TASK_LIFECYCLE_EVENT = TASK_LIFECYCLE_EVENT;
				self.cancel = $mdDialog.cancel;
				self.taskLifecycleEvents = _.invert(TASK_LIFECYCLE_EVENT);

				$scope.isAddNewFormFormValid = function () {
					return $scope.formModel.lifecycleEvent != null;
				};

				self.sendAddFormRequest = function sendAddFormRequest() {
					blockUI.start('Adding new form');
					var eventCode = self.TASK_LIFECYCLE_EVENT[$scope.formModel.lifecycleEvent];
					task.addNewForm(template.templateId, {
							event: eventCode,
							name: $scope.formModel.name,
							desc: $scope.formModel.desc
						})
						.then(function (res) {
							blockUI.stop(res.respMsg, {
								status: 'isSuccess'
							})
							$mdDialog.hide().then(function () {
								console.log("dialog closed");
							});

						}).catch(function (err) {
						blockUI.stop(err.respMsg, {
							status: 'isError',
							action: "Ok"
						})
					}).finally(function () {
					})
				}
			}


		}


	}

})();