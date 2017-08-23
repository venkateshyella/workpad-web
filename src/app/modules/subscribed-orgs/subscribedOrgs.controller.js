/**
 * Created by sandeep on 17/01/2017.
 */
;(function () {

  angular.module('app')
    .controller('SubscribedOrgsViewController', [
      '$scope', '$timeout', 'Connect', 'URL','$q','blockUI','$state','$stateParams','DataProvider','$controller','Session',
       'mDialog', 'Lang','$braintree',
       SubscribedOrgsViewController]);

  function SubscribedOrgsViewController($scope, $timeout, Connect, URL,$q,blockUI,
		  $state, $stateParams, DataProvider, $controller, Session, Dialog, Lang,$braintree) {
	  
	  var self = this,
	  _rawResponse,
	LANG = Lang.en.data;
	  
	  _init();

		function _init() {
			angular.extend(self, $controller('ViewDataBaseController', {
				$scope: $scope
			}));
			$scope.OrgData = {
				orgList: [],
				pgInfo: {
					pageSize: 25,
					currPage: 1
				}
			};
			$scope.loadingNext = false;
			getOrgList();
			$scope.loadNext = loadNext;
		}
		
		function getOrgList() {
			blockUI.start("Loading . . .", {
				status: 'isLoading'
			});

			var _params = {
					pageSize: $scope.OrgData.pgInfo.pageSize,
					pageNumber: $scope.OrgData.pgInfo.currPage,
					userId:Session.userId
			};

			DataProvider.resource.Organisation.getOwnedOrgList(_params, {
				bypassCache: true
			}).then(function (res) {
				$scope.loadingNext = false;
				angular.forEach(res.results, function (value, key) {
					$scope.OrgData.orgList.push(value);
				});
				$timeout();
				checkNextPgAvailability(res.paginationMetaData);
			}, null, function (rawResponse) {
				_rawResponse = rawResponse;
			}).catch(function (error) {
				Dialog.alert(error.respMsg);
				console.log(error);
			}).finally(function () {
				blockUI.stop();
			});
		}
		
		function checkNextPgAvailability(paginationMetaData) {
			var totalResults = paginationMetaData.totalResults;
			if ($scope.OrgData.orgList.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			}
		}
		
		function loadNext() {
			$scope.loadingNext = true;
			$scope.OrgData.pgInfo.currPage += 1;
			getOrgList();
		}
		
	  $scope.subscriptionItems = function(orgId) {
		  $scope.transitionTo('root.app.subscription', {
			  orgId:orgId
            }, {
                REPLACE_STATE: false
            });
	  }
  }

})();