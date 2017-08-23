/**
 * Created by sudhir on 21/1/16.
 */

angular.module('app')
	.service('JobTimeSheetWorkflow', [
		'$q', '$timeout', 'Dialog', 'Lang',
		function ($q, $timeout, Dialog, Lang) {
			"use strict";

			var LANG = Lang.en.data;
			var defaultTimeSheetDialogConfig = {
				templateUrl: "",
				controller: ['$scope', '$mdDialog',
					SubmitTimeSheetDialogController]
			};

			return {
				runSubmitTimeSheetWorkflow: runSubmitTimeSheetWorkflow
			};

			function runSubmitTimeSheetWorkflow(timeSheetData, dialogConfig, params) {
				var deferred = $q.defer()
					, _config = angular.extend({}, defaultTimeSheetDialogConfig, dialogConfig)
					, _params = angular.extend({}, params, {
						BUTTON: LANG.BUTTON
					})
					;

				Dialog.show(_config)
					.then(function (res) {
						deferred.resolve(res);
					})
					.catch(function (err) {
						deferred.reject(err);
					})
				;

				return deferred.promise;

				function SubmitTimeSheetDialogController($scope, $mdDialog) {
					angular.extend($scope, _params, {
						cancel: $mdDialog.cancel,
						submit: function () {
							return $timeout(angular.noop, 1000);
						}
					}, {
						timeSheet: timeSheetData
					})
				}

			}

		}
	])
;