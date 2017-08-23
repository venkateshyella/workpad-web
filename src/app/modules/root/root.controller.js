;
(function () {
	"use strict";

	angular.module('app')
		.controller('RootController', RootController);


	function RootController($scope,$rootScope,Dialog, $state, Connect, $q, URL, blockUI, Session, BootService, $window, DEFAULT_ENDPOINT, Ping, APP_INFO) {
		var TAG = "[RootController] ";
		$rootScope.redirectOnSessionExpire = function(){
			//$rootScope.afterSessionExpire = true;
			//$state.go('root.login',{}, {reload:true});
			window.location.reload();
		};
		
		$rootScope.APP_VERSION = APP_INFO.version.web;
		
		BootService.waitForAppReady().then(function(res){
			$scope.isBootProcessCompleted = true;
		});

		$rootScope.showTermsConditions = function() { 
			var termsConditionsDialogOptions;

			termsConditionsDialogOptions = {
					controller: ['$scope', '$mdDialog', '$timeout',
					             TermsConditionsController],
					             templateUrl: 'app/default/termsAndConditions.html',
					             clickOutsideToClose:false,
			};

			Dialog.show(termsConditionsDialogOptions)
			.then(function (res) {
			})
			.catch(function (err) {
			})
			.finally(function () {
			});

			function TermsConditionsController($scope, $mdDialog, $timeout) {
				
				$scope.cancel = function(){
					$mdDialog.hide();
				}
			}
			
		}

		$rootScope.supportAndFeedBack = function(fromLogin) {
			

			var feedBackDialogOptions;

			feedBackDialogOptions = {
					controller: ['$scope', '$mdDialog', '$timeout',
					             FeedBackController],
					             templateUrl: 'app/default/feedBack.html',
					             clickOutsideToClose:false,
			};

			Dialog.show(feedBackDialogOptions)
			.then(function (res) {
			})
			.catch(function (err) {
			})
			.finally(function () {
			});

			function FeedBackController($scope, $mdDialog, $timeout) {
				$scope.feedBack = {};
				
				$scope.fromLogin = fromLogin;
				
				$scope.feedBackTypes = [
				                        { label: 'Comments', value: -501 },
				                        { label: 'Bug Reports', value: -502 },
				                        { label: 'Questions', value: -503 }
				                        ];
				
				$scope.feedBack.feedbackType = $scope.feedBackTypes[0].value;

				$scope.cancel = function(){
					$mdDialog.hide();
				}
				
				function requestFeedback(feedback) {
					var deferred = $q.defer();

					Connect.post(URL.SUPPORT_FEEDBACK, feedback)
					.then(function (res) {
						deferred.resolve(res);
					})
					.catch(function (err) {
						deferred.reject(err);
					});
					
					return deferred.promise;
				}

				$scope.submit = function(feedback){
					
					if (!fromLogin) {
						feedback.userSessionId = Session.id; 
					}
					
					blockUI.start("Loading...", {
						status: 'isLoading'
					});
					
					requestFeedback(feedback).then(function (res) {
						Dialog.alert({
							content: res.respMsg,
							ok: "Ok"
						});
						
					}).catch(function (err) {
						Dialog.alert({
							title:"Support and Feedback Failed",
							content: err.respMsg,
							ok: "Ok"
						});
					}).finally(function () {
						blockUI.stop();
					});
				}
				
			}   
		}	 
		
		function fillAppVersion(){
			Ping.send().then(function (res) {
				$rootScope.appVersion = res.appDetails.version;
			}).catch(function (error) {
			});
		}
		fillAppVersion();
		
	}


	RootController.$inject = ['$scope','$rootScope','mDialog', '$state', 'Connect', '$q', 'URL', 'blockUI', 'Session', 'BootService','$window', 'DEFAULT_ENDPOINT','Ping', 'APP_INFO'];

})();
