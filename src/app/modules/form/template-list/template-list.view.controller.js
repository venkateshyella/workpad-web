/**
 * Created by sudhir on 14/10/15.
 */


;
(function () {
	"use strict";

	angular.module('app')
		.controller('TemplateListViewController', [
			'$scope', '$controller', 'JobService', 'DataProvider', 'TemplateManagerUiProvider',
			'mDialog',
			TemplateListViewController])
	;

	function TemplateListViewController($scope, $controller, JobService, DataProvider
		, TemplateManagerUiProvider, Dialog) {
		var self = this;

		angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));
		self.userTemplateLoader = self.initializeViewDataBaseController('userTemplates',
			fetchTemplates, findTemplates);

		$scope.refresh = refresh;
		$scope.askAndCreateNewTemplate = askAndCreateNewTemplate;

		refresh();

		function refresh(options) {
			$scope.userTemplates.refresh()
				.then(function () {
					$scope.userTemplateData = self.userTemplateLoader.userTemplates.data;
					//console.log($scope.userTemplateData);
				});
		}

		function askAndCreateNewTemplate() {
			TemplateManagerUiProvider.askAndCreateNewTemplate()
				.then(function (templateInstance) {
					$scope.transitionTo('root.app.template-edit', {
						name: templateInstance.name,
						desc: templateInstance.desc
					})
				});
		}

		function findTemplates() {
			return DataProvider.resource.FormTemplate.getAll();
		}

		function fetchTemplates() {
			var args = {};
			return DataProvider.resource.FormTemplate.findAll(args, {bypassCache: true});
		}

	}

})();