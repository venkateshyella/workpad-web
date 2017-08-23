;
(function() {
    "use strict";

    angular.module('app')
        .controller('PeopleInvitesViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog',
                                                    '$timeout', 'Lang', 'Session', 'State', 'PeopleInvitationService', 
                                                    'INVITES_STATUS','$rootScope', PeopleInvitesViewController])


    function PeopleInvitesViewController($scope, $stateParams, blockUI, DataProvider, Dialog, 
    		$timeout, Lang, Session, State, PeopleInvitationService,
    		INVITES_STATUS, $rootScope) {

        console.log("In PeopleInvitesViewController");

         var LANG = Lang.en.data;


        $scope.xtras.selectedTabIndex = 1;

        $scope.peopleViewData = {
            people: [],
            pgInfo: {
                pageSize: 25,
                currPage: 1
            }
        };

        $scope.isNextPageAvailable = false;
        $scope.loadingNext = false;
        $scope.loadNext = loadNext;

        $scope.invitesStatus = INVITES_STATUS;
        
        var _rawResponse;
        
        function _initTab(){
        	$scope.tabs.allowedActions = ['INVITE_STATUS'];
        	$scope.isContextMenuRequired = true;
        	$scope.tabs.allowedActions.action = function(){
        		
        	};
        }

        function getInvitedMembers() {

            //if ($scope.peopleViewData.people.length == 0) {

                blockUI.start("Loading Invited Members..", {
                    status: 'isLoading'
                });

           // }

            var _params = {
                pageSize: $scope.peopleViewData.pgInfo.pageSize,
                pageNumber: $scope.peopleViewData.pgInfo.currPage
            };
            PeopleInvitationService.getInvitesList(_params).then(function(res) {
                
                $scope.loadingNext = false;
                angular.forEach(res.resp.results, function(value, key) {
                    $scope.peopleViewData.people.push(value);
                });
                _rawResponse = res; 
               // $timeout();
                checkNextPgAvailability();

                blockUI.stop();

            }, null, function(rawResponse) {
            	blockUI.stop();
                _rawResponse = rawResponse;
            }).catch(function(error) {
                console.log(error);
            }).finally(function() {
                blockUI.stop();
            });
        }

        function initPeopleInvitesView() {
        	//_initTab();
        	 $scope.peopleViewData = {
        	            people: [],
        	            pgInfo: {
        	                pageSize: 25,
        	                currPage: 1
        	            }
        	        };
        	getInvitedMembers();
        }
        
        function checkNextPgAvailability() {
            var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
            if ($scope.peopleViewData.people.length < totalResults) {
                $scope.isNextPageAvailable = true;
            } else {
                $scope.isNextPageAvailable = false;
            }
        }

       function loadNext() {
            $scope.loadingNext = true;
            $scope.peopleViewData.pgInfo.currPage += 1;
            getInvitedMembers();
        }
        
        $rootScope.invitePeople = function(){
			PeopleInvitationService.invitePeople().then(function (data) {
				initPeopleInvitesView();
				
			}, function (error) {
				$state.transitionTo('root.app.people.invites', {}, {
					REPLACE_STATE: true
				});
			});   
			
        };
        
        initPeopleInvitesView();
    }


})();