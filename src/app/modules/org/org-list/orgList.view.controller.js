/**
 * Created by sudhir on 26/5/15.
 */

;
(function() {
    "use strict";

    angular.module('app')
        .controller('OrgListViewController', OrgListViewController);

    function OrgListViewController($scope, $timeout, $controller,
        Popup,
        $stateParams,
        OrgAdminService,
        DataProvider, Lang,ROLE, Dialog,Session) {
        var self = this;
        var LANG = Lang.en.data;
        $scope.data = {
            orgListPageCtx: {
                currPageNumber: 1,
                nextPageNumber: 2,
                pageSize: 25,
                currPageSize: 0
            }
        };
        
        $scope.session = Session;
        $scope.isSupportUser = $scope.session.userInfo.isSupportUser; 
        // Extend `ViewDataBaseController`
        angular.extend(self, $controller('ViewBaseController', { $scope: $scope }));
        angular.extend(self, $controller('ViewDataBaseController', { $scope: $scope }));

        self.viewData = {
            org: self.initializeViewDataBaseController('orgList', fetchUserOrgList, findUserOrgList)
        };

        $scope._state = self.viewData.org.orgList.state;
        $scope._activity = self.viewData.org.orgList.activity;
        $scope.ui = {
            isRefreshing: false,
            isLoadingNext: false
        };
        $scope.ROLE = ROLE;
        $scope.isNextPageAvailable = false;
        $scope.refresh = refresh;
        $scope.fetchMoreOrgs = fetchMoreOrgs;
        $scope.showOptionsMenu = showOptionsMenu;
        $scope.createThenEditOrganisation = createThenEditOrganisation;
        $scope.onOrgListItemClick = onOrgListItemClick;
        $scope.onOrgGroupListItemClick = onOrgGroupListItemClick;

        $scope.sharedData.sideMenu.currItem = 'my_orgs';
        
        refresh({
            bypassCache: true
        });

        function onOrgListItemClick(org) {

            $scope.transitionTo('root.app.org-dashboard.orgInfo', {
                orgId: parseInt(org.id)

            }, {
                REPLACE_STATE: false
            });

        }

         function onOrgGroupListItemClick(group) {

            $scope.transitionTo('root.app.group-dashboard.groupInfo', {
                orgId: group.orgId,
                groupId: group.id

            }, {
                REPLACE_STATE: false
            });

        }

        function refresh(options) {
            var options = options || {};
            $scope.data.orgListPageCtx.currPageNumber = 1;
            $scope.data.orgListPageCtx.currPageSize = 25;
            options.pageData = {
                pageNumber: 1,
                pageSize: $scope.data.orgListPageCtx.pageSize
            };
            $scope.data.orgList = findUserOrgList();
            $scope._state = $scope.data.orgList && $scope.data.orgList.length > 0 ? self.DATA_AVAILABLE : self.DATA_NA;
            $scope._activity = self.ACTIVITY_FETCHING;

            DataProvider.resource.Organisation.ejectAll();
            return $scope.orgList.refresh(options)
                .then(function() {
                    $scope.data.orgList = findUserOrgList();
                    $scope._state = self.viewData.org.orgList.state;

                    _.each($scope.data.orgList, function(org) {
                        if(org.groups && org.groups.length>0) {
                            var myOrgGroups = DataProvider.resource.Group.inject(org.groups);
                            org.myGroups = myOrgGroups;
                        }
                    })

                    var rawResult = DataProvider.resource.Organisation.result,
                        paginationData = rawResult.resp.paginationMetaData;

                    $scope.isNextPageAvailable = self.viewData.org.orgList.data.length < paginationData.totalResults;

                })
                .catch(function() {
                    $scope._state = self.viewData.org.orgList.state;
                })
                .finally(function() {
                    $scope._activity = self.ACTIVITY_IDLE;
                });
        }

        function fetchMoreOrgs() {
            var nextPageData = {
                pageNumber: $scope.data.orgListPageCtx.currPageNumber + 1
            };
            $scope.ui.isLoadingNext = true;
            $scope.orgList.refresh({
                    pageData: nextPageData
                })
                .then(function(res) {
                  
                    $scope._state = self.viewData.org.orgList.state;

                    _.each(res, function(org) {
                        if(org.groups && org.groups.length>0) {
                            var myOrgGroups = DataProvider.resource.Group.inject(org.groups);
                            org.myGroups = myOrgGroups;
                        }
                    })

                    var rawResult = DataProvider.resource.Organisation.result,
                        paginationData = rawResult.resp.paginationMetaData,
                        resp = rawResult.resp;

                   
                    if (resp.results && resp.results.length) {
                        $scope.data.orgListPageCtx.currPageSize += resp.results.length;
                    }


                    $scope.data.orgListPageCtx.currPageNumber++;
                    $scope.data.orgListPageCtx.nextPageNumber++;

                      $scope.data.orgList = findUserOrgList();

                       $scope.isNextPageAvailable = $scope.data.orgList.length < paginationData.totalResults;
                })
                .finally(function() {
                    $scope.ui.isLoadingNext = false;
                })
        }

        function showOptionsMenu(e) {
            var menuItems = [{
                name: 'refresh',
                value: LANG.OPTIONS_MENU.REFRESH
            }, {
                name: 'createOrg',
                value: "Create new WorkSpace"
            }];

            Popup.showMenu({
                targetEl: e.currentTarget || e.target,
                menuItems: menuItems,
                align: 'right'
            }).then(function(name, $event) {
                switch (name) {
                    case 'refresh':
                        $scope.refresh({ bypassCache: true });
                        break;
                    case 'createOrg':
                        OrgAdminService.CreateNewOrganisation({
                            event: e
                        }).then(function(result) {
                            var newOrgData = result;
                            refresh({
                                bypassCache: true
                            }).then(function() {
                                $scope.transitionTo('root.app.org', {
                                    userId: $scope.session.userId,
                                    orgId: newOrgData.organizationEntity.id
                                })
                            });
                        }).catch(function(error) {
                        	Dialog.alert({
                				content: err,
                				ok: "Ok"
                			});
                        });;
                        break;
                    default:
                }
            });
        }

        function createThenEditOrganisation(e) {
        	
//        	$scope.transitionTo('root.app.subscription', {
//            }, {
//                REPLACE_STATE: false
//            });
//        	
        	
            OrgAdminService.CreateNewOrganisation({
                event: e
            }).then(function(newOrgData) {
                $scope.transitionTo('root.app.org-dashboard.orgInfo', {
                    orgId: parseInt(newOrgData.id)

                }, {
                        REPLACE_STATE: false
                });

            }).catch(function(error){
                   console.log(error);
                   Dialog.showAlert(error);
            });
        }

        function fetchUserOrgList(opts) {
            //DataProvider.resource.Organisation.ejectAll();
            var options = opts || {},
                pageData = options.pageData;
            var _params = {
                pageSize: pageData.pageSize || $scope.data.orgListPageCtx.pageSize,
                pageNumber: pageData.pageNumber || 1,
                userId: $stateParams.userId
            };
            return DataProvider.resource.Organisation
                .findAll(_params, {
                    bypassCache: options.bypassCache || true
                });
        }

        function findUserOrgList() {
            return DataProvider.resource.Organisation.filter({
                //orderBy: [['updateTime', 'DESC']],
                limit: $scope.data.orgListPageCtx.currPageSize
            });
        }

    }

    OrgListViewController.$inject = [
        '$scope', '$timeout', '$controller',
        'Popup',
        '$stateParams',
        'OrgAdminService',
        'DataProvider', 'Lang','ROLE','mDialog','Session'
    ];

})();
