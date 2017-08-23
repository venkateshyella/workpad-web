/**
 * Created by sandeep on 30/03/17.
 */
(function () {
	"use strict";
	angular.module('app.services')
	.service('chatThreadService', ['$q', 'Connect','mDialog', '$mdToast','blockUI', 'Lang','DataProvider',
	                               'URL','Session',
	                               chatThreadService]);
	function chatThreadService($q, Connect, Dialog, $mdToast , blockUI, Lang, 
			DataProvider, URL, Session) {
		var LANG = Lang.en.data;

		var _self = this;
		var userId = Session.userId;

		function createChatThread(params) {
			var deferred = $q.defer(), createChatThreadOption;
			createChatThreadOption = {
					controller: ['$scope', '$stateParams', '$mdDialog', 'blockUI', 'mDialog','$timeout','$q', CreateChatThreadController],
					templateUrl: 'app/modules/chat/createChatThread.dialog.tpl.html',
					clickOutsideToClose:false
			}
			Dialog.show(createChatThreadOption)
			.then(function (res) {
				deferred.resolve(res)
			})
			.catch(function (err) {
				deferred.reject(err);
			})
			.finally(function () {
			});
			return deferred.promise;
			function CreateChatThreadController($scope, $stateParams, $mdDialog, blockUI, mDialog, $timeout, $q) {
				$scope.form = {};
				$scope.formModel = {};
				
				$scope.close = function() {
					$mdDialog.cancel();
				}
				
				$scope.submitToCreateThread = function(model) {
					blockUI.start("Creating Chat Thread", {
						status: 'isLoading'
					});
					
					model.catId = params.catId;
					model.catType = params.catType;
					
					DataProvider.resource.ChatMessage.createChatThread(model)
					.then(function (res) {
						$mdDialog.hide(res);
					}, function (error) {
						blockUI.stop(error.respMsg, {
							status: 'isError',
							action: 'Ok'
						});
						$mdDialog.cancel(error);
					}).finally(function () {
						blockUI.stop();
					});
				};
				
			};
		}


		return {
			createChatThread : createChatThread
		}
	}
})();
