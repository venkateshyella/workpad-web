;
(function() {
    "use strict";

    angular.module('app')
        .controller('PeopleSearchViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog',
                                                   '$timeout', 'Lang', 'Session', 'State', 'PeopleInvitationService',
                                                   '$q','URL', PeopleSearchViewController])


    function PeopleSearchViewController($scope, $stateParams, blockUI, DataProvider, Dialog, 
    		                             $timeout, Lang, Session, State, PeopleInvitationService,
    		                             $q, URL) {

        console.log("In PeopleSearchViewController");

         var LANG = Lang.en.data;


        $scope.xtras.selectedTabIndex = 1;

        $scope.peopleSearchData = {
            people: [],
            pgInfo: {
                pageSize: 25,
                currPage: 1
            }
        };

        $scope.isNextPageAvailable = false;
        $scope.loadingNext = false;
       // $scope.loadNext = loadNext;

        

        function _initPeopleSearchView() {
        	$scope.searchForm = {};
        	$scope.searchFormModel = {};
        	_initSkillSearch();
        	_initLocationSearch();
        }
        
        
        function _initSkillSearch(){
        	$scope.newSkillName = "";
			$scope.searchText = "";
			$scope.searchTextChange = searchTextChange;
			$scope.addSkill = addSkill;
			$scope.selectedItemChange = selectedItemChange;
			$scope.querySearch = querySearch;
			$scope.searchStatusText = "";
			$scope.skillObj = {};
			$scope.skillObj.skillName = "";
			$scope.skillObj.enable = false;
			
			$scope.resetSearchModel = resetSearchModel;
			
			function searchTextChange($model, text) {
				console.info('Text changed to ' + text);
				if (text && text.length < 1) {
					$scope.skillObj.skillName = "";
					$scope.skillObj.enable = false;
				}
			}

			function addSkill(skillName, skillDesc, skillRating) {
				
				if (skillName && skillName.length > 0) {
					$scope.skillObj.skillName = skillName;
					$scope.skillObj.enable = true;
				}

				// $scope.submit();
			};

			function selectedItemChange(item) {
				if (item) {
					console.log("selected Item");
					$scope.isAddSkillDisabled = false;
				}
			}

			function querySearch(searchText) {
				var deferred;
				var query = searchText || "";
				if (query) {
					deferred = $q.defer();
					Connect.get(URL.ADDSKILL, {
							name: query
						})
						.then(function (resp) {
							if (resp.responseCode != 0) {
								// Connection Error
								$scope.addSkills = [];
								$scope.searchStatusText = resp.respMsg;
							} else {
								var skills = resp.resp;
								$scope.addSkills = skills;
								$scope.searchStatusText = query;
							}

							if (resp.resp.length == 0) {
								$scope.isDisabled = false;
								$scope.isAddSkillDisabled = true;
							}

							/*if ($scope.searchStatusText.indexOf("No matches found") >= 0) {
							 $scope.isDisabled = false;
							 }*/
							//$scope.$emit('newSkillAdd', {skill :query});
							deferred.resolve($scope.addSkills);
						})
						.catch(function (error) {
							$scope.searchStatusText = LANG.ERROR.NETWORK_FAILURE;
							deferred.reject(error);
						});
					return deferred.promise;
				}
			}

        }
        
        
        
        function _initLocationSearch(){
        	$scope.newLocationName = "";
			$scope.searchLocationText = "";
			$scope.searchLocationTextChange = searchLocationTextChange;
			$scope.addLocation = addLocation;
			$scope.selectedLocItemChange = selectedLocItemChange;
			$scope.queryLocSearch = queryLocSearch;
			$scope.searchLocStatusText = "";
			$scope.locObj = {};
			$scope.locObj.locationName = "";
			$scope.locObj.enable = false;

			function searchLocationTextChange($model, text) {
				//console.info('Text changed to ' + text);
				if (text && text.length < 1) {
					$scope.locObj.locationName = "";
					$scope.locObj.enable = false;
				}
			}

			function addLocation(locName) {
				
				if (locName && locName.length > 0) {
					$scope.locObj.locationName = locName;
					$scope.locObj.enable = true;
				}

				// $scope.submit();
			};

			function selectedLocItemChange(item) {
				if (item) {
					console.log("selected Item");
					$scope.isAddLocDisabled = false;
				}
			}

			function queryLocSearch(searchText) {
				var deferred;
				var query = searchText || "";
				if (query) {
					deferred = $q.defer();
					Connect.get(URL.CITY_LIST, {
						cityName: query
						})
						.then(function (resp) {
							if (resp.responseCode != 0) {
								// Connection Error
								$scope.addLocations = [];
								$scope.searchLocStatusText = resp.respMsg;
							} else {
								var locations = resp.resp;
								$scope.addLocations = locations.results;
								$scope.searchLocStatusText = query;
							}

							if (resp.resp.length == 0) {
								$scope.isAddLocDisabled = true;
							}

							
							deferred.resolve($scope.addLocations);
						})
						.catch(function (error) {
							$scope.searchLocStatusText = LANG.ERROR.NETWORK_FAILURE;
							deferred.reject(error);
						});
					return deferred.promise;
				}
			}

        }
        
        
        
        $scope.searchPeople = function(){
        	var _params = {};
        	$scope.peopleSearchData.people = [];
        	
        	if($scope.searchFormModel.name && $scope.searchFormModel.name.trim().length > 0){
        		_params.name = $scope.searchFormModel.name;
        	}

        	if($scope.newSkillName && $scope.newSkillName.name && $scope.newSkillName.name.trim().length > 0){
        		_params.skill = $scope.newSkillName.name;
        	}

        	if($scope.newLocationName && $scope.newLocationName.name && $scope.newLocationName.name.trim().length > 0){
        		_params.location = $scope.newLocationName.name;
        	}

        	blockUI.start("Searching", {
        		status: 'isLoading'
        	});

        	PeopleInvitationService.searchPeople(_params).then(function(res){
        		$scope.peopleSearchData.people = res.results;
        		
        		if(res.results && res.results.length == 0){
        			Dialog.alert("No results found.");
        		}
        		
        		resetSearchModel();
        		
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
        
        
        $scope.tagUser = function(userId){
        	var params = {
        			userId: userId,
        			tag: true
        	};
        	
        	PeopleInvitationService.tagOrUntagPeople(params).then(function(res){
        		if(res.responseCode == 0){
        			Dialog.alert(res.respMsg);
        			var _user = {id: userId};
        			var userObj = _.find($scope.peopleSearchData.people, {user: _user});
        			if(userObj){
        				userObj.tagStatus = true;
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
        
        function resetSearchModel(){
        	$scope.searchFormModel.name = "";
        	$scope.skillObj.skillName = "";
        	$scope.skillObj.enable = false;
        	$scope.locObj.locationName = "";
        	$scope.locObj.enable = false;
        	
        	$scope.newSkillName = "";
        	$scope.newLocationName = "";
        	$scope.searchLocationText = undefined;
        	$scope.searchText = undefined;
        }
        
        
        _initPeopleSearchView();

    }


})();