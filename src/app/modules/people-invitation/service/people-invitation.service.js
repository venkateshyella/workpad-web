/**
 * Created by Vikas on 23/03/17.
 */

;
(function () {
	"use strict";

	angular.module('app')
		.service('PeopleInvitationService', PeopleInvitationService);

	function PeopleInvitationService($q, $timeout, Session, DataProvider, AUDIT, URL, EVENT, Dialog, blockUI) {

		function searchPeople(params) {
			var deferred = $q.defer();

			DataProvider.resource.People.searchPeople({
					name: params.name,
					skill: params.skill,
					location: params.location
				})
				.then(function (res) {
					deferred.resolve(res);
				}, function (error) {
					deferred.reject(error)
				});

			return deferred.promise;
		}
		
		function peopleTaggedStatusList(params) {
			var deferred = $q.defer();

			DataProvider.resource.People.taggedStatusPeopleList(params)
				.then(function (res) {
					deferred.resolve(res);
				}, function (error) {
					deferred.reject(error)
				});

			return deferred.promise;
		}

		function getInvitesList(params) {
			var deferred = $q.defer();

			DataProvider.resource.People.invitesList(params)
				.then(function (res) {
					deferred.resolve(res);
				}, function (error) {
					deferred.reject(error)
				});

			return deferred.promise;
		}
		
		function tagOrUntagPeople(params){

			var deferred = $q.defer();

			DataProvider.resource.People.tagOrUntagPeople(params)
				.then(function (res) {
					deferred.resolve(res);
				}, function (error) {
					deferred.reject(error)
				});

			return deferred.promise;
		
		}
		
		function invitePeople(catId, orgName){
			 
			return Dialog.show({
		        templateUrl: 'app/modules/people-invitation/templates/invite-people.partial.html',
		        controller: ['$scope', '$mdDialog', '$controller', 'Lang',  function ($scope, $mdDialog, $controller) {
		        	var self = this;
		        	
		        	$scope.cancel = function(){
		        		$mdDialog.hide();
		        	};
                    $scope.formModel = {};
                    $scope.formModel.invite_people={};
                    
                    if (orgName) {
                    	$scope.formModel.invite_people.message = "We have been using Workpad service to increase our work productivity and I would like you to join my WorkSpace "+orgName+" on Workpad service";
					} else {
						$scope.formModel.invite_people.message = "We have been using Workpad service to increase our work productivity and I would like you to join on Workpad service"
					}
                    
                    $scope.submit = function(){
                    	var deferred = $q.defer();
                    	blockUI.start("Sending Invite to join WorkSpace");
                    	
                    	if(catId && (catId > 0)){
                    		$scope.formModel.invite_people.orgId = catId;
                    	}
                    	DataProvider.resource.People.invitePeople($scope.formModel.invite_people)
                    	.then(function (res) {
                    		deferred.resolve(res);
                    		blockUI.stop(res.respMsg, {
                    			status: 'isSuccess'
                    		});
                    		$mdDialog.hide();
                    	}, function (error) {
                    		deferred.reject(error);
                    		Dialog.alert({
                    			content: error.respMsg,
                    			ok: "Ok"
                    		});
                    		$mdDialog.hide();
                    	});
                    	return deferred.promise;
                    };
		        }]
		      });
		}

		return {
			searchPeople: searchPeople,
			peopleTaggedStatusList: peopleTaggedStatusList,
			getInvitesList: getInvitesList,
			tagOrUntagPeople: tagOrUntagPeople,
			invitePeople: invitePeople
		}
	}

	PeopleInvitationService.$inject = ['$q', '$timeout', 'Session', 'DataProvider', 'AUDIT', 'URL', 'EVENT','mDialog', 'blockUI'];

})();