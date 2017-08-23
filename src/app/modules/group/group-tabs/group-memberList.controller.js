;
(function() {
    "use strict";

    angular.module('app')
        .controller('GroupMemberViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session', 'GroupMemberInvite', 'UserInvitationService', 'URL','State', GroupMemberViewController])


    function GroupMemberViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, GroupMemberInvite, UserInvitationService,URL, State) {

        console.log("In Group Members controller");
        var LANG = Lang.data;
        $scope.xtras.selectedTabIndex = 1;

        var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId;

       // $scope.groupTabCtrl.groupModel = DataProvider.resource.Group.get(groupId);

        

        $scope.showGroupMemberOptions = showGroupMemberOptions;

        $scope.onGroupMemberListItemClick = onGroupMemberListItemClick;

        $scope.groupMembers = [];


        /*if ($scope.groupTabCtrl.groupModel && $scope.groupTabCtrl.orgModel) {
            initGroupMemberView();
        } else {

            $scope.getGroupModelAndOrgModel().then(function() {
                $scope.groupMembers = $scope.groupTabCtrl.groupModel.members;
                initGroupMemberView();
            });

        }*/

         $scope.getGroupModelAndOrgModel().then(function() {
                $scope.groupMembers = $scope.groupTabCtrl.groupModel.members;
                initGroupMemberView();
            });

         $scope.askAndRemoveGroupMember = askAndRemoveGroupMember;

        function initGroupMemberView() {
            getMemberMenuList();
            getGroupMembers();
        }



        function getGroupMembers() {
            var _params = {
                grpId: $scope.groupTabCtrl.groupModel.id,
                pageSize: 100
            };
            DataProvider.resource.User.findAll(_params, {
                url: URL.GROUP_MEMBERS,
                bypassCache: true
            }).then(function(res) {
                $scope.groupMembers = res;
                $timeout();
            }).catch(function(error) {
                console.log(error);
            });
        }

        function showGroupMemberOptions(user, $event) {
            var userActions = [{
                text: "View Profile",
                value: "profile"
            }];

            $scope.session.userId == $scope.groupTabCtrl.groupModel.adminId && user.id != $scope.groupTabCtrl.groupModel.adminId && userActions.push({
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
                        askAndRemoveGroupMember(user)
                            .then(function(res) {
                                //refresh({ bypassCache: true });
                            });
                        break;
                }
            });
        }

        function askAndRemoveGroupMember(user) {

            var group = $scope.groupTabCtrl.groupModel;
            var org = DataProvider.resource.Organisation.get($stateParams.orgId);

            return Dialog.confirm({
                title: "Remove User",
                content: 'Do you wish to remove ' + user.userFirstName + ' ' + user.userLastName + ' from this room?',
                ok: "Remove",
                cancel: "Cancel"
            }).then(function(res) {
                var intent = {
                    org: org,
                    group: group
                };
                UserInvitationService.ejectUserFromGroup(user, intent).then(function(resp) {
                    Dialog.alert(resp.respMsg);
                    getGroupMembers();
                }).catch(function(error) {
                    Dialog.alert(error.respMsg)
                })
            })
        }

        function onGroupMemberListItemClick(user, $event) {
            return State.transitionTo('root.app.user', {
                id: user.id
            });

        }

        function getMemberMenuList() {

            $scope.groupTabCtrl.optionMenuItems.TAB_MEMBER_LIST = [];

            var memberMenuItems = [{
                name: "Invite Member",
                action: findThenInviteUser,
                isAllowed: $scope.groupTabCtrl.groupModel.isActionAuthorized('INVITE_TO_JOIN')
            },
               {name: "View invitees status",
                action: findGrpMemberStatusList,
                isAllowed: $scope.groupTabCtrl.groupModel.isActionAuthorized('INVITE_TO_JOIN')
            	}];
            
            angular.forEach(memberMenuItems, function(menuItem) {
                if (menuItem.isAllowed) {
                    $scope.groupTabCtrl.optionMenuItems.TAB_MEMBER_LIST.push(menuItem);
                }
            });
        }
        
       


        function findThenInviteUser() {

            var org = DataProvider.resource.Organisation.get($stateParams.orgId);

            if (!org) {
                getOrgDetails($stateParams.orgId).then(function(org) {
                    org = org;
                });
            }
            var group = DataProvider.resource.Group.get($stateParams.groupId);
            var options = options || {};
            options.autoClose = false;
            GroupMemberInvite.showUserSelect({
                    orgId: $stateParams.orgId,
                    group: group
                }, options)
                .then(function(bundle) {
                }).catch(function (err) {
            	}).finally(function() {
                	getGroupMembers();
                });
        }

        function queryOrgMembers(bundle) {
            var query = bundle.queryString;
            if (query) {
                return DataProvider.resource.User.findAll({
                    q: query,
                    o: $stateParams.orgId,
                    g: $stateParams.groupId
                }, {
                    bypassCache: true
                });
            }
        }

        function getOrgDetails(orgId) {

            return DataProvider.resource.Organisation.find(orgId, {
                bypassCache: true,
                orgId: orgId
            });

        }
        
        
        
        // added code here
        
        
        function findGrpMemberStatusList() {
        	blockUI.start("Loading WorkSpace Invites Data..", {
        		status: 'isLoading'
        	});
        	var group = DataProvider.resource.Group.get($stateParams.groupId);
        	var options = options || {};
        	options.autoClose = false;
        	GroupMemberInvite.onShowGroupMemberList(group.id)
        	.then(function (result) {
        		if (result.length > 0) {
        			GroupMemberInvite.showGrpMembers({
        				group: group
        			})
        			.then(null, null, function(bundle) {

        			});
        		}else {
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
        	});

        }
    }

})();