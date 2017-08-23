;
(function() {
    "use strict";

    angular.module('app')
        .controller('PeopleTagViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog',
                                                '$timeout', 'Lang', 'Session', 'State', 'PeopleInvitationService', PeopleTagViewController])


    function PeopleTagViewController($scope, $stateParams, blockUI, DataProvider, Dialog, 
    		$timeout, Lang, Session, State, PeopleInvitationService) {

        console.log("In PeopleTagViewController");

         var LANG = Lang.en.data;
         var tag = true;

        $scope.xtras.selectedTabIndex = 1;
        $scope.onTaggedPeopleListItemClick = onTaggedPeopleListItemClick;
        
        $scope.PeopleTagData = {
            taggedPeople: [],
            pgInfo: {
                pageSize: 25,
                currPage: 1
            }
        };

        $scope.isNextPageAvailable = false;
        $scope.loadingNext = false;
        $scope.loadNext = loadNext;

        var _rawResponse;

        function getTaggedMembers() {

            if ($scope.PeopleTagData.taggedPeople.length == 0) {

                blockUI.start("Loading Tagged Members..", {
                    status: 'isLoading'
                });

            }

            var _params = {
                tag: tag,
                pageSize: $scope.PeopleTagData.pgInfo.pageSize,
                pageNumber: $scope.PeopleTagData.pgInfo.currPage
            };
            PeopleInvitationService.peopleTaggedStatusList(_params).then(function(res) {
                
                $scope.loadingNext = false;
                angular.forEach(res.resp.results, function(value, key) {
                    $scope.PeopleTagData.taggedPeople.push(value);
                });
                console.log("$scope.PeopleTagData.taggedPeople ---> "+JSON.stringify($scope.PeopleTagData.taggedPeople));
                _rawResponse = res; 
               // $timeout();
                checkNextPgAvailability();


            }, null, function(rawResponse) {
                _rawResponse = rawResponse;
            }).catch(function(error) {
                console.log(error);
            }).finally(function() {
                blockUI.stop();
            });
        }
        
        function _initPeopleTagView() {
        	getTaggedMembers();
        }
        
        function checkNextPgAvailability() {
            var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
            $scope.isNextPageAvailable = $scope.PeopleTagData.taggedPeople.length < totalResults;
          
        }
        
        function loadNext() {
            $scope.loadingNext = true;
            $scope.PeopleTagData.pgInfo.currPage += 1;
            getTaggedMembers();
        }
        
        function onTaggedPeopleListItemClick(user, $event) {
            return State.transitionTo('root.app.user', {
                id: user.id
            });

        }
        
        $scope.unTagUser = function(userId){
        	var params = {
        			userId: userId,
        			tag: false
        	};
        	
        	PeopleInvitationService.tagOrUntagPeople(params).then(function(res){
        		if(res.responseCode == 0){
        			Dialog.alert(res.respMsg);
        			var _user = {id: userId};
        			var userObj = _.find($scope.PeopleTagData.taggedPeople, {user: _user});
        			if(userObj){
        				_.remove($scope.PeopleTagData.taggedPeople, userObj);
        			}
        		}
        		
        	}, function(err){
        		blockUI.stop();
        		Dialog.alert(err.respMsg);
        	}).catch(function(error) {
        		blockUI.stop();
        		Dialog.alert(error.respMsg);
        	})
        	.finally(function(response){
        		blockUI.stop();
        	});
        	
        };
       
        _initPeopleTagView();
    }


})();