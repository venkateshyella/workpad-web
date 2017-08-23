;
(function() {
"use strict";

angular.module('app')
  .controller('OrgMemberViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 
                                          'mDialog', '$timeout', 'Lang', 'Session', 'UserSelectorNew', 
                                          'UserInvitationService', 'URL','State','PeopleInvitationService', OrgMemberViewController])
  .filter('invitationStatus', function() {
	  return function(status) {
		  if(status === -1) {
			  return 'Rejected'
		  } else if(status === -2) {
			  return 'Pending'
		  } else if (status === 0) {
			  return 'Accepted'
		  } else if (status === -3) {
			  return 'Cancelled'
		  } 

	  }
  });

function OrgMemberViewController($scope, $stateParams, blockUI, DataProvider, 
		Dialog, $timeout, Lang, Session, UserSelectorNew, 
		UserInvitationService,URL, State, PeopleInvitationService) {

  console.log("In Org Members controller");

  $scope.xtras.selectedTabIndex = 1;
  
  var LANG = Lang.en.data;

  var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;



  $scope.orgTabCtrl.orgModel = DataProvider.resource.Organisation.get(orgId);

 
  $scope.orgName = $scope.orgTabCtrl.orgModel.orgName;

  $scope.showOrgMemberOptions = showOrgMemberOptions;

  $scope.onOrgMemberListItemClick = onOrgMemberListItemClick;

  $scope.askAndRemoveOrgMember = askAndRemoveOrgMember;

  $scope.OrgMemberdata = {
      orgMembers: [], //$scope.orgModel.members
      pgInfo: {
          pageSize: 25,
          currPage: 1
      }
  };

  $scope.isNextPageAvailable = false;
  $scope.loadingNext = false;
  $scope.loadNext = loadNext;


  if ($scope.orgTabCtrl.orgModel) {

      var org = $scope.orgTabCtrl.orgModel;
      initOrgMembersView(org);
  } else {
      $scope.getOrgDetails().then(function(org) {
          initOrgMembersView(org);
      });
  }


  function initOrgMembersView() {
      getMemberMenuList();
      getOrgMembers();

      $scope.checkIfUserIsOrgVisitor(org.role);

  }


  var _rawResponse;

  function getOrgMembers() {

     // if ($scope.OrgMemberdata.orgMembers.length == 0) {

          blockUI.start("Loading WorkSpace Members..", {
              status: 'isLoading'
          });

      //}

      var _params = {
          orgId: $scope.orgTabCtrl.orgModel.id,
          pageSize: $scope.OrgMemberdata.pgInfo.pageSize,
          pageNumber: $scope.OrgMemberdata.pgInfo.currPage
      };
      DataProvider.resource.User.findAll(_params, {
          url: URL.ORG_MEMBERS,
          bypassCache: true
      }).then(function(res) {
          // $scope.OrgMemberdata.orgMembers = res;
          // $timeout();

          $scope.loadingNext = false;

          angular.forEach(res, function(value, key) {
              $scope.OrgMemberdata.orgMembers.push(value);
              $scope.OrgMemberdata.orgMembers = _.uniq($scope.OrgMemberdata.orgMembers, function(member, key, id) {
                  return member.id;
              });
          });
          $timeout();
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

  function checkNextPgAvailability() {
      var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
      if ($scope.OrgMemberdata.orgMembers.length < totalResults) {
          $scope.isNextPageAvailable = true;
      } else {
          $scope.isNextPageAvailable = false;
      }
  }

  function loadNext() {
      $scope.loadingNext = true;
      $scope.OrgMemberdata.pgInfo.currPage += 1;
      getOrgMembers();
  }

  function showOrgMemberOptions(user, $event) {
      var userActions = [{
          text: "View Profile",
          value: "profile"
      }];

      $scope.session.userId == $scope.orgTabCtrl.orgModel.adminId && user.id != $scope.orgTabCtrl.orgModel.adminId && userActions.push({
          text: "Remove member",
          value: "removeMember"
      });

      Dialog.showListDialog(userActions, {
          $event: $event
      }).then(function(select) {
          switch (select.value) {
              case 'profile':
                  State.transitionTo('root.app.user', {
                      id: user.id
                  });
                  break;
              case 'removeMember':
                  askAndRemoveOrgMember(user)
                      .then(function(res) {
                          getOrgMembers();
                      });
                  break;
          }
      });
  }

  function askAndRemoveOrgMember(user) {
      var intentBundle = {
          user: user,
          org: $scope.orgTabCtrl.orgModel
      };
      return Dialog.confirm({
          title: "Remove User",
          content: 'Do you wish to remove ' + user.userFirstName + ' ' + user.userLastName + ' from this WorkSpace ?',
          ok: "Remove",
          cancel: "Cancel"
      }).then(function(res) {
          UserInvitationService.ejectUserFromOrg(intentBundle.user, intentBundle.org).then(function(resp) {
              Dialog.alert(resp.respMsg);

              /* _.remove($scope.OrgMemberdata.orgMembers, {
                          id: resp.id
                      });*/
              $scope.OrgMemberdata.orgMembers = [];

              getOrgMembers();
          }).catch(function(error) {
              Dialog.alert(error.respMsg)
          })
      })
  }

  function onOrgMemberListItemClick(user, $event) {
      return State.transitionTo('root.app.user', {
          id: user.id
      });

  }

  function getMemberMenuList() {

      $scope.orgTabCtrl.optionMenuItems.TAB_MEMBER_LIST = [];

      var memberMenuItems = [{
          name: "Invite Member",
          action: findThenInviteUser,
          isAllowed: $scope.orgTabCtrl.orgModel.isActionAuthorized('INVITE_TO_JOIN')
      },{
    	  name: "Invite People",
		  action: invitePeople,
		  isAllowed: $scope.orgTabCtrl.orgModel.isActionAuthorized('INVITE_PEOPLE')
      },{
    	  name: "View invitees status",
		  action: findOrgInvitesStatus,
		  isAllowed: $scope.orgTabCtrl.orgModel.isActionAuthorized('INVITE_TO_JOIN')
      }];
      angular.forEach(memberMenuItems, function(menuItem) {
          if (menuItem.isAllowed) {
              $scope.orgTabCtrl.optionMenuItems.TAB_MEMBER_LIST.push(menuItem);
          }
      });
  }


  function findThenInviteUser() {
      $scope.enableActions = false;
      var options = options || {};
      options.autoClose = false;
      var org = $scope.orgTabCtrl.orgModel;
      var bundle = {};


      UserSelectorNew.showUserSelect({
              org: org,
              loadUsers: function(params, options) {
                  return DataProvider.resource.User.findAll({
                      q: params.queryString,
                      o: org.id
                  }, options);
              }
          }, options, invitePeople)
          .then(null, null, function(bundle) {
              bundle = bundle;
              var user = bundle.selection;
              var userSelectCtrl = bundle.ctrl;
              var targetBundle = {
                  toOrg: org
              };
              UserInvitationService.showPrepareInvitationDialog(user, targetBundle, options)
                  .then(function(res) {
                      console.log(res);
                      userSelectCtrl.cancel();
                  })
                  .finally(function() {
                      $scope.enableActions = true;
                  })
          })
          .finally(function() {
              $scope.enableActions = true;
              bundle.cancel();
          });
  }
  
  
  function invitePeople(){
	  	
		PeopleInvitationService.invitePeople(orgId, $scope.orgName).then(function (data){
			$scope.OrgMemberdata.orgMembers = [];
            getOrgMembers();
		}, function (error) {
			Dialog.alert({
				  content: error.message,
				  ok: "Ok"
			  });
		});   
		
  }

  
  
  
  function findOrgInvitesStatus() {
		blockUI.start("Loading WorkSpace Invites Data..", {
    		status: 'isLoading'
    	});
	  $scope.enableActions = false;
	  var options = options || {};
	  options.autoClose = false;
	  var org = $scope.orgTabCtrl.orgModel;
	  var targetBundle = {
			  org: org
	  };
	  UserSelectorNew.onShowOrgMemberList(targetBundle.org.id)
	  .then(function (result) {
		  if (result.length > 0) {
			  UserSelectorNew.showOrgMemberStatus(targetBundle)
			  .then(null, null, function(bundle) {
			  })
			  .finally(function() {
			  });
		  } else {
			  blockUI.stop("No invitations are sent", {
				  status: 'isSuccess',
				  action: LANG.BUTTON.OK
			  });
		  }
	  }).catch(function (err) {
		  Dialog.alert({
			  content: err.message,
			  ok: "Ok"
		  });
	  }).finally(function () {
		  blockUI.stop();
		  $scope.enableActions = true;
	  });

  }

  // code related to invites status ended


}


})();