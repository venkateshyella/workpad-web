/**
 * Created by sandeep on 16/02/17.
 */
(function () {
	"use strict";
	angular.module('app.services')
	.service('AuditService', ['$q', 'Connect','mDialog','blockUI', 'Lang','DataProvider',
	                          'URL','Session','$timeout',
	                          auditService]);

	function auditService($q, Connect, Dialog , blockUI, Lang, 
			DataProvider, URL, Session, $timeout) {

		function showAudit(url, params, title, res) {
			var deferred = $q.defer(), showAuditDialogOptions;
			showAuditDialogOptions = {
					controller: ['$scope', 'blockUI', 'mDialog', auditDialogController],
					templateUrl: 'app/modules/audit/auditDisplay.dialog.tpl.html',
					clickOutsideToClose:false
			}
			Dialog.show(showAuditDialogOptions)
			.then(function (res) {
				deferred.resolve(res)
			})
			.catch(function (err) {
				deferred.reject(err);
			})
			.finally(function () {
			});
			return deferred.promise;

			function auditDialogController($scope, blockUI, mDialog) {
				var _rawResponse;
				$scope.LANG = Lang.en.data;
				
				function init() {
					$scope.title = "Audit";
					$scope.auditData = {
							audit: [],
							pgInfo: {
								pageSize: 25,
								currPage: 1
							}
					};
					$scope.isNextPageAvailable = false;
					$scope.loadingNext = false;
					$scope.fetchMoreAudits = fetchMoreAudits;
					$scope.isLoading = true;
					
					if (res.results.length > 0) {
//						$timeout( function() {
							$scope.loadingNext = false;
							angular.forEach(res.results, function (value, key) {
								$scope.auditData.audit.push(value);
							});
							isNextAuditPageAvailable(res.paginationMetaData.totalResults);
							$scope.isLoading = false;
//						},1000);
					}
				}

				$scope.MU = {
						getDisplayDateTime:mobos.Utils.getDisplayDateTime
				}
				
				$scope.close = function () {
					mDialog.hide();
				}

				function isNextAuditPageAvailable(total) {
					var totalResults = total;
					if ($scope.auditData.audit.length < totalResults) {
						$scope.isNextPageAvailable = true;
					} else {
						$scope.isNextPageAvailable = false;
					}
				}

				function fetchMoreAudits() {
					$scope.loadingNext = true;
					$scope.auditData.pgInfo.currPage += 1;
					fetchAuditData(url,params);
				}

				function fetchAuditData(url, params) {
					var _params = {
							userSessionId:Session.id,
							catId: params.catId,
							catType:params.catType,
							pageSize: $scope.auditData.pgInfo.pageSize,
							pageNumber: $scope.auditData.pgInfo.currPage,
					};
					
					if (params.groupId) {
						_params.groupId = params.groupId;
					}
					
					if (params.orgId) {
						_params.orgId = params.orgId;
					}
					
					connectAuditData(url, _params).then(function (res) {
						if (res.isSuccess) {
							$scope.loadingNext = false;
							angular.forEach(res.resp.results, function (value, key) {
								$scope.auditData.audit.push(value);
							});
							isNextAuditPageAvailable(res.resp.paginationMetaData.totalResults);
						}
					}).catch(function (error) {
						Dialog.alert({
							content: error.respMsg,
							ok: "Ok"
						});
					}).finally(function () {
					});
				}
				init();
			}
		}

		function connectAuditData(url, params) {
			var deferred = $q.defer();
			
			Connect.get(url, params)
			.then(function (res) {
				deferred.resolve(res);
			})
			.catch(function (err) {
				deferred.reject(err);
			});

			return deferred.promise;
		}

		function checkAuditList(url, params) {
			var deferred = $q.defer();
			
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			
			connectAuditData(url, params)
			.then(function (res) {
				deferred.resolve(res.resp);
			})
			.catch(function (err) {
				deferred.reject(err);
			}).finally(function () {
				blockUI.stop();
			});

			return deferred.promise;
		}

		return {
			showAudit : showAudit,
			checkAuditList : checkAuditList
		}
	}
})();