/**
 * Created by sandeep on 03/07/17.
 */
;
(function() {
	"use strict";

	angular.module('app')
	.controller('AuditForensicsViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session','$rootScope','uiGridConstants','$http','AppCoreUtilityServices','$q', AuditForensicsViewController])


	function AuditForensicsViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, $rootScope,uiGridConstants,$http, AppCoreUtilityServices,$q) {
		
		console.log("In AuditForensicsViewController");
		
		$scope.LANG = Lang.data;
		if($stateParams.org != null ){
			$scope.orgTabCtrl.orgModel =  $stateParams.org;	
		}
		
		$scope.maxDate = new Date().toString();
		
		$scope.audit = {
				data: [],
				totalCount:0,
				sort: null,
				pgInfo: {
					pageSize: 25,
					currPage: 1
				}
		};
		
		$scope.viewMore = function(obj){
				var _deferred = $q.defer(), showMoreAuditDialogOptions;

				showMoreAuditDialogOptions = {
						controller: ['$scope', '$mdDialog', '$timeout','Lang',
						             ShowMoreAuditDialogController],
						             templateUrl: 'app/modules/wp-audit/showMoreAudit.dialog.tpl.html',
						             clickOutsideToClose:false,
				};
				
				Dialog.show(showMoreAuditDialogOptions)
				.then(function (res) {
					_deferred.resolve(res);
				})
				.catch(function (err) {
					_deferred.reject(err);
				})
				.finally(function () {
				});
				
				function ShowMoreAuditDialogController($scope, $mdDialog, $timeout,Lang) {
					$scope.desc = "";
					$scope.LANG = Lang.data;
					$scope.entityAuditProperties = [];
					$scope.summary = [];

					if (obj.desc)
						$scope.desc = obj.desc;
					if (obj.summary)
						$scope.summaryData = obj.summary;

					$scope.getDisplayDate_DDMMYYYYHHMMSS =  mobos.Utils.createDateFormatter('DD/MM/YYYY HH:mm:ss');

					angular.forEach(obj.entityAuditProperties, function (value, key) {
						var property = {};
						angular.extend(property, value);
 						if (property.propertyType == 'Timestamp') {
							if (property.propertyNewValue)
								property.propertyNewValue = $scope.getDisplayDate_DDMMYYYYHHMMSS(parseFloat(property.propertyNewValue));
							if (property.propertyOldValue)
								property.propertyOldValue = $scope.getDisplayDate_DDMMYYYYHHMMSS(parseFloat(property.propertyOldValue));
						}
						$scope.entityAuditProperties.push(property);
					});

					$scope.cancel = function(ev) {
						Dialog.hide();
					};
				}
				
				return _deferred.promise;
			
		}
		
		$scope.toRedirectAuditPage = function(obj) {
			switch (obj.catType) {
			
			case 1:
				if (obj.catId) {
					$scope.sharedData.sideMenu.currItem = 'my_orgs';
					$scope.transitionTo('root.app.org-dashboard.orgInfo', {
						orgId: parseInt(obj.catId)
					}, {
						REPLACE_STATE: true
					});
				}
				break;
			case 2:
				if (obj.orgId && obj.catId) {
					$scope.sharedData.sideMenu.currItem = 'my_orgs';
					$scope.transitionTo('root.app.group-dashboard.groupInfo', {
						orgId: parseInt(obj.orgId),
						groupId: parseInt(obj.catId)
					}, {
						REPLACE_STATE: true
					});
				}
				break;
			case 3:
				if (obj.catId) {
					$scope.sharedData.sideMenu.currItem = 'my_orgs';
					$scope.transitionTo('root.app.job-view.jobProfile', {
						jobId: parseInt(obj.catId),
					}, {
						REPLACE_STATE: true
					});
				}
				break;
			case 4:
				if (obj.parentCatId && obj.catId) {
					$scope.sharedData.sideMenu.currItem = 'my_orgs';
					$scope.transitionTo('root.app.task-dashboard.taskProfile', {
						jobId: parseInt(obj.parentCatId),
						taskId: parseInt(obj.catId)
					}, {
						REPLACE_STATE: true
					});
				}
				break;
				
			default:
				null;
			}
		}
		
		 $scope.gridOptions = {
					paginationPageSize: $scope.audit.pgInfo.pageSize,
					useExternalPagination: true,
					useExternalSorting: true,
					enableColumnMenus: false,
					columnDefs: [
					             { name: 'Date',field: 'updateTime',width: 160},
					             { name: 'User',field: 'fullName', cellTemplate:'<div style="padding:3px;">{{row.entity[col.field]}}</div>',width: 170	},
					             { name: 'Event Type',field: 'actionType',width: 120},
					             { name: 'Event Details', field: 'desc',enableSorting:false, cellTemplate:'<div style="padding:3px; cursor: pointer;" ng-click="grid.appScope.toRedirectAuditPage(row.entity)">{{row.entity[col.field]}}</div> <a ng-if="row.entity.entityAuditProperties.length > 0 || row.entity.summary.length > 0" style ="float:right;padding:3px; color:#285ebb; cursor: pointer;" class="ng-binding" ng-click="grid.appScope.viewMore(row.entity)">More</a>'}
					             ],
					             onRegisterApi: function(gridApi) {
					            	 $scope.gridApi = gridApi;
					            	 $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
					            		 if (sortColumns.length == 0) {
					            			 $scope.audit.sort = null;
					            		 } else {
					            			 console.log("sortColumn : "+sortColumns[0].field+", sortType : "+sortColumns[0].sort.direction);
					            			 if ($scope.searchModel) {
					            				 $scope.searchModel.moduleType = $scope.moduleTypes[0].code;
					            				 $scope.searchModel.sortColumn = sortColumns[0].field;
						            			 $scope.searchModel.sortType = sortColumns[0].sort.direction;
											} else {
												 $scope.searchModel.sortColumn = sortColumns[0].field;
						            			 $scope.searchModel.sortType = sortColumns[0].sort.direction;
											}
					            			 getAuditData($scope.searchModel);
					            		 }
					            		 
					            	 });
					            	 gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
					            		 $scope.audit.pgInfo.currPage = newPage;
					            		 $scope.audit.pgInfo.pageSize = pageSize;
					            		 getAuditData($scope.searchModel);
					            	 });
					             }
			};
		 
		 function fetchModuleLookpTypes() {
				var _deferred = $q.defer();
				
				$scope.moduleTypes=[];
				DataProvider.resource.WPAudit.lookUpTypes({"type":"AUDIT_MODULE"}).then(function (res) {
					if (res.length > 0) {
						angular.forEach(res, function (value, key) {
							$scope.moduleTypes.push(value);
						});
					};
					_deferred.resolve(res);
				}, null, function (rawResponse) {
					_rawResponse = rawResponse;
				}).catch(function (error) {
					Dialog.alert({
						content: error.respMsg,
						ok: $scope.LANG.BUTTON.OK
					});
					_deferred.reject(error);
				}).finally(function () {
					blockUI.stop();
				});
				return _deferred.promise;
			}
		 
		 function init() {
			 fetchEventLookpTypes();
			 fetchModuleLookpTypes().then(function (res) {
				 getAuditData();	
			 });
			 $scope.dateFormat = "yyyy-MM-dd";
			 $scope.searchModel = {};
			 $scope.onSearchClick = onSearchClick;
			 $scope.onResetClick = onResetClick;
			 var startdate = new Date($scope.orgTabCtrl.orgModel.createTime);
			 startdate.setDate(startdate.getDate() - 1);
			 $scope.minDate = startdate.toString();
		 }
		
		function fetchEventLookpTypes() {
			$scope.eventTypes=[];
			DataProvider.resource.WPAudit.lookUpTypes({"type":"AUDIT_ACTION_TYPE"}).then(function (res) {
				if (res.length > 0) {
					angular.forEach(res, function (value, key) {
						$scope.eventTypes.push(value);
					});
				};
			}, null, function (rawResponse) {
				_rawResponse = rawResponse;
			}).catch(function (error) {
				Dialog.alert({
					content: error.respMsg,
					ok: $scope.LANG.BUTTON.OK
				});
			}).finally(function () {
				blockUI.stop();
			});
		}
		
		function onSearchClick(model,form){
			$scope.audit = {
					data: [],
					totalCount:0,
					sort: null,
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
			};
			
			if (model.fromDate) {
				model.fromDatee = new Date(model.fromDate);
				model.fromDatee.setHours(0,0,0,0);
				model.fromDatee = model.fromDatee.getTime();
			}
			
			if (model.endDate) {
				var d = new Date(model.endDate);
			    d.setHours(23,59,59,999);
				model.endDatee = d.getTime();
			}
			
		
		if ($scope.audit.data.length > 0)
			$scope.gridApi.pagination.seek(1);

			getAuditData(model);
//			onResetClick(form);
		}
		
		function onResetClick(form){
			$scope.searchModel = {};
			form.audit_search = {};
			form.$setPristine();
			form.$setUntouched();
			$scope.searchModel.moduleType = $scope.moduleTypes[0].code;
			if ($scope.audit.data.length > 0) 
				$scope.gridApi.pagination.seek(1);
			getAuditData($scope.searchModel);
		}
		
		
		function getAuditData(model){
			var _deferred = $q.defer();
			
				blockUI.start("Loading ...", {
					status: 'isLoading'
				});
				
			var _params = {};
			
			if (model) {
				_params = {
						orgId:$stateParams.orgId,
						eventType:model.eventType,
						formDate:model.fromDatee,
						endDate:model.endDatee,
//						userName:encodeURI(model.userName),
						moduleType:model.moduleType,
						pageSize: $scope.audit.pgInfo.pageSize,
						pageNumber: $scope.audit.pgInfo.currPage,
						sortColumn : model.sortColumn,
						sortType : model.sortType
				};
				
				if (model.userName) {
					_params.userName=encodeURI(model.userName);
				}
			} else {
				$scope.searchModel.moduleType = $scope.moduleTypes[0].code;
				_params = {
						orgId:$stateParams.orgId,
						moduleType : $scope.moduleTypes[0].code,
						pageSize: $scope.audit.pgInfo.pageSize,
						pageNumber: $scope.audit.pgInfo.currPage,
				};
			}
		
			
			
			DataProvider.resource.WPAudit.auditSearch(_params).then(function (res) {
				$scope.audit.totalCount = res.paginationMetaData.totalResults;
				$scope.audit.data = [];
				if (res.results.length > 0) {
					angular.forEach(res.results, function (value, key) {
						value.fullName=value.user.userFirstName+" "+value.user.userLastName;
						value.updateTime=$scope.MU.getDisplayDate_DDMMYYYYHHMMSS(value.updateTime);
						$scope.audit.data.push(value);
						if ($scope.audit.data.length == res.results.length) {
							getPage();
						}
					});

				} else {
					$scope.audit.data = [];
					getPage();
				}
				_deferred.resolve(res);
			}, null, function (rawResponse) {
				_rawResponse = rawResponse;
			}).catch(function (error) {
				Dialog.alert({
					content: error.respMsg,
					ok: $scope.LANG.BUTTON.OK
				});
				_deferred.reject(error);
			}).finally(function () {
				blockUI.stop();
			});

		}
			  function getPage() {
			          
					$scope.gridOptions.totalItems = $scope.audit.totalCount;
				/*	$scope.pageSizes = [];
					var j = 0; 
					for ( var i = 25; i < $scope.audit.totalCount;) {
						$scope.pageSizes[j] = i;
						i = i+$scope.audit.pgInfo.pageSize;
						j++;
					}
					*/
					$scope.gridOptions.paginationPageSizes = [$scope.audit.pgInfo.pageSize];
//					var firstRow = ($scope.audit.pgInfo.currPage - 1) * $scope.audit.pgInfo.pageSize;
//					$scope.gridOptions.data = [];
//					$scope.gridOptions.data = $scope.audit.data.slice(firstRow, firstRow + $scope.audit.pgInfo.pageSize);
					$scope.gridOptions.data = $scope.audit.data;
					
//					 $scope.gridOptions.onRegisterApi = function(gridApi){
//			             $scope.gridApi = gridApi;
//			          };
					
				};
				
				init();
			 
	};


})();