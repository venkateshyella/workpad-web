;
(function () {
  "use strict";

  angular.module('app')
    .controller('ListJobContriViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', '$timeout','mDialog','JobInvitationService', ListJobContriViewController])
    .controller('InviteDelegatorController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', '$timeout','$q','Session', 'URL','Lang', InviteDelegatorController]);

  	function ListJobContriViewController($scope, $stateParams, blockUI, DataProvider, $timeout, Dialog, JobInvitationService) {

		$scope.jobContributorList = [];
	    $scope.isNextPageAvailable = false;
	    $scope.fetchMoreJobContributors = fetchMoreJobContributors;
	    $scope.jobItemClickAction = jobItemClickAction;
	    $scope.refresh = refresh;
    
	    $scope.showNoDataMsg = false;
	    $scope.loadingImage = true;
	    $scope.showMsgJobContainer = true;
	    $scope.isRefreshing = false;

	    var currPageNumber = 1;
	    var defaultPageSize = 25;

	    $scope.isInviteDelegatorAllowed = false;

		var jobId = $stateParams.jobId;
		var targetJobBunble = DataProvider.resource.Job.get(jobId);
		if(targetJobBunble.amITheOwner()){
			if(targetJobBunble.isCancelled() || targetJobBunble.isClosed() || targetJobBunble.isUnderVerification()){
				$scope.isInviteDelegatorAllowed = false;
			} else {
				$scope.isInviteDelegatorAllowed = true;
			}
		}
	
		getJobContributorsList(currPageNumber, defaultPageSize);
		
		$scope.sendInvitation = sendInvitation;
	

		function sendInvitation(user,options) {
			if(user){
	  			JobInvitationService.showPrepareInvitationDialog(user, targetJobBunble, options);
			}
		}
	
		function getJobContributorsList(pageNumber, pageSize) {
			blockUI.start("Loading Contributors..", {
				status: 'isLoading'
			});

	      targetJobBunble.findContributors({
	          pageNumber: pageNumber,
	          pageSize: pageSize
	        }, {
	          bypassCache: true
	        }
	      )
	      .then(function (JobContributorList) {
        	
	          for(var i = 0 ; i < JobContributorList.resp.results.length; i++ ){
	        	$scope.jobContributorList.push(JobContributorList.resp.results[i]);
	          }

	          if ($scope.jobContributorList.length == 0) {
	            $scope.showNoDataMsg = true;
	            $scope.loadingImage = false;
	          } else {
	            $scope.showMsgJobContainer = false;
	            $scope.loadingImage = false;
	          }

	          if (JobContributorList.resp.paginationMetaData.totalResults == $scope.jobContributorList.length) {
	            $scope.isNextPageAvailable = false;
	          } else {
	            $scope.isNextPageAvailable = true;
	          }
	      })
	      .catch(function (error) {
	      })
	      .finally(function () {
	          blockUI.stop();
	      });
	} 
 
	function fetchMoreJobContributors() {
		currPageNumber = currPageNumber + 1;
		getJobContributorsList(currPageNumber, defaultPageSize);
	}
 
	function jobItemClickAction($event, job) {
		/*if (job && job.userid) {
	       return $scope.transitionTo('root.app.user', {
	        id: job.userid
	       });
	    }*/
		if (job && job.userid) {
			Dialog.showListDialog([{
		        text: "View Profile",
		        value: "profile"
		      }], {
		        $event: $event
		      }).then(function (select) {
		        switch (select.value) {
		          case 'profile':
		            $scope.transitionTo('root.app.user', {
		              id: job.userid
		            });
		            break;
		        }
		    });
		}
	}
 
	function refresh() {
	  $scope.jobContributorList =[];
      $scope.isNextPageAvailable = false;
      currPageNumber = 1;
      getJobContributorsList(currPageNumber, defaultPageSize);
	}
 }

  	function InviteDelegatorController($scope, $stateParams, blockUI, DataProvider, $timeout, $q, Session, URL, Lang) {
		"use strict";
		var LANG = Lang.en.data;
		var self = this;
		self.results = null;
		$scope.isDisabled = true;
		$scope.disableInviteContributor = false;

		
		$scope.jobObject = [];
		self.querySearch = querySearch;
		self.selectedItemChange = selectedItemChange;
		self.searchTextChange = searchTextChange;
		
		
		self.fuseOptions = {
		  keys: ['name'],   // keys to search in
		  threshold: 0.3,
		  maxPatternLength: 20
		};
		
		self.fuseFinder = null;
		self.searchText = "";
		$scope.searchStatusText = "";
		
		var jobId = $stateParams.jobId;
		
		$scope.jobObject = DataProvider.resource.Job.get(jobId);

		$scope.disableInviteContributor = $scope.jobObject.isCancelled() && ($scope.jobObject.amITheOwner() || $scope.jobObject.isClosed() || $scope.jobObject.isUnderVerification());


			/* if($scope.jobObject.isCancelled()){
		 	   $scope.disableInviteContributor = true;
		    }*/
		
		function querySearch(searchText) {
		  var deferred;
		  var query = searchText || "";
		  if (query) {
		    deferred = $q.defer();
		    $scope.jobObject.searchForContributors(query)
		      .then(function (resp) {
		    	  if (resp.responseCode != 0) {
		          // Connection Error
					  $scope.inviteDelegators = [];
					  $scope.searchStatusText = resp.respMsg;
					} else {
					  var inviteDelegator = resp.resp;
					  $scope.inviteDelegators = inviteDelegator;
					  $scope.searchStatusText = "No matches found for " + query + ".";
					}
					deferred.resolve($scope.inviteDelegators);
		      	})
		      .catch(function (error) {
		    	  $scope.searchStatusText = LANG.ERROR.NETWORK_FAILURE;
		        deferred.reject(error);
		      });
		    return deferred.promise;
		  }
		}
		
		function searchTextChange($model, text) {
		  // console.info('Text changed to ' + text);
		}
		
	    function selectedItemChange(item) {
	      self.selectedItem = item;
		    $timeout(function () {
	        self.searchText = $scope.searchText = "";
		    }, 200);
	    }
	}

})();
