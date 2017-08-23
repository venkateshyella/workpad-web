;
(function() {
    "use strict";

    angular.module('app')
        .controller('OrgGroupsViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session', 'State', 'GroupAdminService', OrgGroupsViewController])


    function OrgGroupsViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, State, GroupAdminService) {

        console.log("In Org Groups controller");

         var LANG = Lang.en.data;


        $scope.xtras.selectedTabIndex = 2;

        $scope.OrgGroupdata = {
            orgGroups: [],
            pgInfo: {
                pageSize: 25,
                currPage: 1
            }
        };

        var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;

        $scope.orgTabCtrl.orgModel = DataProvider.resource.Organisation.get(orgId);

        $scope.showGroupOptions = showGroupOptions;

        $scope.isNextPageAvailable = false;
        $scope.loadingNext = false;
        $scope.loadNext = loadNext;

        if ($scope.orgTabCtrl.orgModel) {
            initOrgGroupsView();
        } else {
            $scope.getOrgDetails().then(function() {
                initOrgGroupsView();
            });
        }

        function initOrgGroupsView() {

            getOrgGroups();
            getGroupTabMenuList();
        }

        function getGroupTabMenuList() {

            $scope.orgTabCtrl.optionMenuItems.TAB_GROUPS = [];

            var groupTabMenuItems = [{
                name: "Create Room",
                action: createGroup,
                isAllowed: $scope.orgTabCtrl.orgModel.isActionAuthorized('CREATE_GROUP')
            }];

            angular.forEach(groupTabMenuItems, function(menuItem) {
                if (menuItem.isAllowed) {
                    $scope.orgTabCtrl.optionMenuItems.TAB_GROUPS.push(menuItem);
                }
            });
        }

        var _rawResponse;

        function getOrgGroups() {

            if ($scope.OrgGroupdata.orgGroups.length == 0) {

                blockUI.start("Loading WorkSpace Rooms..", {
                    status: 'isLoading'
                });

            }
            var _params = {
                orgId: $stateParams.orgId,
                pageSize: $scope.OrgGroupdata.pgInfo.pageSize,
                pageNumber: $scope.OrgGroupdata.pgInfo.currPage
            };
            DataProvider.resource.Group.findAll(_params, {
                bypassCache: true
            }).then(function(res) {
                // $scope.OrgGroupdata.orgGroups = res;
                $scope.loadingNext = false;

                angular.forEach(res, function(value, key) {
                    $scope.OrgGroupdata.orgGroups.push(value);
                    $scope.OrgGroupdata.orgGroups = _.uniq($scope.OrgGroupdata.orgGroups, function(group, key, id) {
                        return group.id;
                    });
                });
                $timeout();
                checkNextPgAvailability();


            }, null, function(rawResponse) {
                _rawResponse = rawResponse;
            }).catch(function() {

            }).finally(function() {
                blockUI.stop();
            });
        }

        function checkNextPgAvailability() {
            var totalResults = _rawResponse.resp.paginationMetaData.totalResults;
            if ($scope.OrgGroupdata.orgGroups.length < totalResults) {
                $scope.isNextPageAvailable = true;
            } else {
                $scope.isNextPageAvailable = false;
            }
        }

        function loadNext() {
            $scope.loadingNext = true;
            $scope.OrgGroupdata.pgInfo.currPage += 1;
            getOrgGroups();
        }

        function createGroup() {
            var intent = {
                org: $scope.orgTabCtrl.orgModel
            };
            var orgModel = $scope.orgTabCtrl.orgModel;
            GroupAdminService.CreateNewGroup(orgModel)
                .then(function(result) {
                    //Dialog.showAlert(result.respMsg);
                    if (result.resp) {
                        $scope.transitionTo('root.app.group-dashboard.groupInfo', {
                            orgId: $stateParams.orgId,
                            groupId: result.resp.id
                        });
                    }

                })
                .catch(function(error) {
                    Dialog.showAlert(error.respMsg);
                });

        }

        function showGroupOptions(group, $event) {
            
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