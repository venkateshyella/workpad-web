;
(function() {
    "use strict";

    angular.module('app')
        .controller('GroupGroupsViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session', 'GroupAdminService','State', GroupGroupsViewController])


    function GroupGroupsViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, GroupAdminService,State) {

        console.log("In Group Groups controller");
        if(!$scope.groupTabCtrl.groupModel.isSupportGroup){
        	$scope.xtras.selectedTabIndex = 2;
        }

        var LANG = Lang.en.data;

        $scope.GroupGroupdata = {
            groupGroups: [],
            pgInfo: {
                pageSize: 100,
                currPage: 1
            }
        };

        var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId;

        var orgId = $stateParams.orgId;

        $scope.orgModel = DataProvider.resource.Organisation.get(orgId);

        /*if (!$scope.orgModel) {
            getOrgDetails(orgId).then(function(orgModel) {

                $scope.orgModel = orgModel;

            });
        }*/


        $scope.groupTabCtrl.groupModel = DataProvider.resource.Group.get(groupId);

        /*function getOrgDetails(orgId) {

            return DataProvider.resource.Organisation.find(orgId, {
                bypassCache: true,
                orgId: orgId
            });

        }*/

        $scope.groupTabCtrl.groupModel = DataProvider.resource.Group.get(groupId);


        $scope.showGroupOptions = showGroupOptions;


         if ($scope.groupTabCtrl.groupModel && $scope.groupTabCtrl.orgModel) {
            initGroupGroupView();
        } else {

            $scope.getGroupModelAndOrgModel().then(function() {
                $scope.groupMembers = $scope.groupTabCtrl.groupModel.members;
                initGroupGroupView();
            });

        }

        function initGroupGroupView() {
             getGroupGroups();
             getGroupTabMenuList();
        }

        function getGroupTabMenuList() {

            $scope.groupTabCtrl.optionMenuItems.TAB_GROUPS = [];

            var groupTabMenuItems = [{
                name: "Create Room",
                action: createSubGroup,
                isAllowed: false
            }];

            angular.forEach(groupTabMenuItems, function(menuItem) {
                if (menuItem.isAllowed) {
                    $scope.groupTabCtrl.optionMenuItems.TAB_GROUPS.push(menuItem);
                }
            });
        }

        function createSubGroup($event) {
            /*GroupAdminService.CreateNewGroup($scope.orgModel, $scope.groupModel).then(function(res) {
                var msg = res && res.respMsg;
                Dialog.showAlert(msg);

                if (res.resp) {

                    $scope.transitionTo('root.app.group-dashboard.groupInfo', {
                        orgId: parseInt($stateParams.orgId),
                        groupId: parseInt(res.resp.id)

                    }, {
                        REPLACE_STATE: false
                    });
                }


            }).catch(function(error) {
                var msg = error && error.respMsg || "Error creating group.";
                Dialog.showAlert(msg)
            });*/

            var orgModel = $scope.groupTabCtrl.orgModel;
            var groupModel = $scope.groupTabCtrl.groupModel;
            GroupAdminService.CreateNewGroup(orgModel,groupModel)
                .then(function(result) {
                	if (result.resp) {
//                        Dialog.showAlert(result.respMsg);
                        if (result.resp) {
                            $scope.transitionTo('root.app.group-dashboard.groupInfo', {
                                orgId: $stateParams.orgId,
                                groupId: result.resp.id
                            });
                        }	
                	}
                })
                .catch(function(error) {
                    Dialog.showAlert(error.respMsg);
                });
        }



        function getGroupGroups() {

            var options = options || {};
            options.bypassCache = true;
            var params = {
                orgId: $stateParams.orgId,
                userId: $scope.session.userId,
                groupParentId: $stateParams.groupId,
                pageSize: 100
            };
            DataProvider.resource.Group.findAll(params, options).then(function(res) {
                $scope.GroupGroupdata.groupGroups = res;
                $timeout();

            }).catch(function(error) {
                console.log(error);

            }).finally();
        }



        function showGroupOptions(group, $event) {
            /* $scope.transitionTo('root.app.group', {
                 orgId: $stateParams.orgId,
                 groupId: group.groupId
             });*/

            /*$scope.transitionTo('root.app.group-dashboard.groupInfo', {
                orgId: $stateParams.orgId,
                groupId: group.groupId
            }, {
                REPLACE_STATE: false
            });*/

            if (group.role != 0) {

                return State.transitionTo('root.app.group-dashboard.groupInfo', {
                    orgId: $stateParams.orgId,
                    groupId: group.groupId
                });
            }
            else{
                Dialog.alert({
                        content: LANG.ERROR.GROUP_ACCESS_RESTRICTED,
                        ok: LANG.BUTTON.OK
                    });
            }
        }


    }


})();
