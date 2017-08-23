/**
 * Created by sudhir on 17/9/15.
 */

;
(function() {
    "use strict";

    angular.module('app')
        .service('JobContributorInviteService', [
            'JobAdvertisement', 'JobAdvertisementFactory',
            '$q', 'mDialog', 'blockUI',
            'Connect', 'URL', 'Lang',
            'JOB_LIFECYCLE_EVENT', 'DataProvider',
            JobContributorInviteService
        ]);

    function JobContributorInviteService(JobAdvertisement, JobAdvertisementFactory, $q, Dialog, blockUI, Connect, URL, Lang, JOB_LIFECYCLE_EVENT, DataProvider) {

        var LANG = Lang.en.data;
        return {
            createNewAdvertisement: createNewAdvertisement,

        };

        function createNewAdvertisement(job, options) {
            var options = options || {};
            return Dialog.show({
                templateUrl: 'app/modules/job/templates/job-contributor-create.dialog.tpl.html',
                targetEvent: options.$event,
                controller: [
                    '$scope', '$controller', '$mdDialog', '$timeout', 'blockUI',
                    function($scope, $controller, $mdDialog, $timeout, blockUI) {

                        var self = this,
                            newJobAdv = new JobAdvertisementFactory.GroupAdvertisement(job),
                            jobAdvertisementOrg = job.organization,
                            groupsMeta = {};
                        self.org = jobAdvertisementOrg;
                        self.job = job;
                        self.searchMode = 'group';

                        getJobAdvertiseInviteOwnerList($scope, job);
                        $scope.LANG = LANG;
                        $scope.cancel = $mdDialog.cancel;

                        $scope.submit = function() {
                            sendDelegatorInvitation()
                                .then(function(res) {
                                    //$mdDialog.hide(res);
                                })
                                .catch(function() {})
                                .finally(function() {});
                        };
                        $scope.removeGroup = removeAdvGroup;
                        $scope.removeMemberFromAdvertisement = removeMemberFromAdvertisement;
                        $scope.toggleAdvGroupMembersList = toggleAdvGroupMembersList;
                        $scope.toggleAdvGroupSelectAll = toggleAdvGroupSelectAll;
                        $scope.toggleGroupInvitee = toggleGroupInvitee;
                        $scope.toggleAdvGroupMember = toggleAdvGroupMember;
                        $scope.getUserModel = function(userId) {
                            return DataProvider.resource.User.get(userId);
                        };

                        $scope.jobAdv = newJobAdv;
                        $scope.formModel = {
                            inviteMsg: ""
                        };
                        $scope.selectedGroups = [];
                        $scope.selectedMembers = [];
                        $scope.groupsMeta = groupsMeta;
                        $scope.groupMembersMeta = [];

                        $scope.getModel = {
                            User: DataProvider.resource.User.get,
                            Group: DataProvider.resource.Group.get
                        };

                        $scope.memberSearchCtrl = {
                            selection: null,
                            searchText: "",
                            selectedItemChange: function(memberItem) {
                                if (memberItem) {
                                    addMembersForAdvertisement(memberItem);

                                    console.log($scope.jobAdv.getSavedData());
                                }
	                            $timeout(function () {
		                            $scope.memberSearchCtrl.searchText = "";
	                            }, 200);

                            },
                            querySearch: queryOrgMembersForAdvertisement
                        };

                        //$scope.$watchCollection('jobAdv', function() {
                        //  if(checkAdvValidity()) {
                        //    $scope.
                        //  }
                        //});

                        function queryOrgMembersForAdvertisement(queryStr) {
                            return newJobAdv.queryAdvertisementInvitees({
                                    queryType: "ADV_MEMBERS",
                                    queryStr: queryStr,
                                    inviteType: "DELEGATOR"
                                })
                                .then(function(res) {
                                    return res;
                                })
                        }

                        function addMembersForAdvertisement(user) {
                            DataProvider.resource.User.inject(user);
                            newJobAdv.addMember(user.id);
                            console.log(newJobAdv.getSavedData());
                        }

                        function removeMemberFromAdvertisement(userId) {
                            newJobAdv.removeMember(userId);
                            console.log(newJobAdv.getSavedData());
                        }

                        function addNewGroupMemberForAdvertisement(advUserObj) {
                            //$scope.selectedMembers.push(advUserObj);
                            //$scope.selectedMembers = _.unique($scope.selectedMembers, function (advObj) {
                            //  return advObj.user.id + "-" + advObj.group.id
                            //});

                            var group = advUserObj.group,
                                groupId = group.id,
                                user = advUserObj.user;

                            groupsMeta[groupId] = groupsMeta[groupId] || {};
                            var groupMeta = groupsMeta[groupId];
                            groupMeta._isMembersListExpanded = true;
                            DataProvider.resource.Group.inject(group);
                            DataProvider.resource.User.inject(user);
                            var existingInviteesId = _.pluck(groupMeta.users, 'id');
                            existingInviteesId.push(user.id);
                            existingInviteesId = _.unique(existingInviteesId);
                            groupMeta.users = DataProvider.resource.User.filter({
                                where: {
                                    id: { in : existingInviteesId
                                    }
                                }
                            });
                            newJobAdv.addGroupMember(advUserObj.group.id, advUserObj.user.id);
                        }

                        $scope.groupSearchCtrl = {
                            selection: null,
                            searchText: "",
                            selectedItemChange: function(groupItem) {
                                if (groupItem) {
                                    addNewGroupForAdvertisement(groupItem);
                                    console.log($scope.jobAdv);
                                }
	                            $timeout(function () {
		                            $scope.groupSearchCtrl.searchText = "";
	                            }, 200)

                            },
                            querySearch: function(queryStr) {
                                if (queryStr && queryStr.length > 0) {
                                    return newJobAdv.queryAdvertisementInvitees({
                                            queryStr: queryStr,
                                            inviteType: "DELEGATOR"
                                        })
                                        .then(function(res) {
                                            var groups = res;
                                            _.remove(groups, function(group) {
                                                var resultGroup = group;
                                                return (_.findIndex($scope.selectedGroups, function(advGroup) {
                                                    return resultGroup.groupId == advGroup.groupId;
                                                }) != -1);
                                            });
                                            return groups;
                                        })
                                        .catch(function() {
                                            return null;
                                        });
                                } else {
                                    return [];
                                }
                            }
                        };

                        function addNewGroupForAdvertisement(group) {
                            //if (_.findIndex($scope.selectedGroups, function (advGroup) {
                            //    return group.groupId == advGroup.groupId;
                            //  }) != -1) return;
                            //group._isAllMembersSelected = true;
                            //group._members = [];
                            //group._isMembersListExpanded = false;
                            //$scope.selectedGroups.push(group);

                            newJobAdv.addGroup(group.groupId);
                            newJobAdv.addSendToAllFlag(group.groupId);
                        }

                        function removeAdvGroup(groupId) {
                            if (!groupId) return;
                            newJobAdv.removeGroup(groupId);
                            groupsMeta[groupId] = {};
                        }

                        function toggleAdvGroupMember(groupId, userId) {

                            newJobAdv.removeSendToAllFlag(groupId);
                            /*Durga added */

                            /*  groupsMeta[groupId] = groupsMeta[groupId] || {};
                             var group = groupsMeta[groupId];
                             _updateGroupSelectAllFlag(group);*/


                            var advData = $scope.jobAdv.getSavedData();
                            if (advData.groups[groupId].invitee.indexOf(userId) > -1) {
                                newJobAdv.removeGroupMember(groupId, userId);
                            } else {
                                newJobAdv.addGroupMember(groupId, userId);
                            }
                            //newJobAdv.removeGroupMember(groupId, userId);
                        }

                        function _updateGroupSelectAllFlag(group) {
                            if (angular.isArray(group._members)) {
                                if (group._members.length == 0)
                                    group._isAllMembersSelected = true;
                                else {
                                    for (var i = 0; i < group._members.length; i++) {
                                        if (!group._members[i].isInvited) {
                                            group._isAllMembersSelected = false;
                                            newJobAdv.removeSendToAllFlag(group.groupId);
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        function toggleAdvGroupMembersList(groupId, isOpen) {
                            groupsMeta[groupId] = groupsMeta[groupId] || {};
                            var group = groupsMeta[groupId];
                            group._isMembersListExpanded = angular.isDefined(isOpen) ?
                                !!isOpen : !group._isMembersListExpanded;
                            console.log(group._isMembersListExpanded ? "expanding" : "closing");
                            if (group._isLoadingMembersList) return;
                            group._isLoadingMembersList = true;
                            group._isMemberListLoadError = false;
                            return _loadGroupInvitees(groupId)
                                .then(function(groupMembers) {
                                    for (var i = 0; i < group.users.length; i++) {
                                        group.users[i].isInvited = true;
                                        newJobAdv.addGroupMember(groupId, group.users[i].id);
                                    }
                                })
                                .catch(function() {
                                    group._isMemberListLoadError = true;
                                })
                                .finally(function() {
                                    group._isLoadingMembersList = false;
                                });

                            //if (group._isMembersListExpanded && !group._isMembersListAvailable) {
                            //  group._isLoadingMembersList = true;
                            //  // fetch group members list..
                            //  group._isMemberListLoadError = false;
                            //  newJobAdv.getAdvGroupMembers(groupId)
                            //    .then(function (groupMembers) {
                            //      console.log(groupMembers);
                            //      group._isMembersListAvailable = true;
                            //      group._isLoadingMembersList = false;
                            //      group._isMemberListLoadError = false;
                            //      group._members = groupMembers;
                            //      for (var i = 0; i < group._members.length; i++) {
                            //        group._members[i].isInvited = true;
                            //        newJobAdv.addGroupMember(group.groupId, group._members[i].id);
                            //      }
                            //    })
                            //    .catch(function () {
                            //      group._isMemberListLoadError = true;
                            //    })
                            //  ;
                            //} else {
                            //  //group._isMembersListExpanded = false;
                            //}
                        }

                        function toggleAdvGroupSelectAll(groupId) {
                            if (newJobAdv.getInvitationGroups()[groupId].sendToAll) {
                                newJobAdv.removeSendToAllFlag(groupId);
                                //toggleAdvGroupMembersList(groupId, true);
                            } else {
                                //group._isMembersListExpanded = false;
                                var group = groupsMeta[groupId];
                                newJobAdv.addSendToAllFlag(groupId);
                                _.each(group.users, function(user) {
                                    newJobAdv.addGroupMember(groupId, user.id);
                                })
                            }
                        }

                        function toggleGroupInvitee(userId) {

                        }

                        function _loadGroupInvitees(groupId) {
                            var deferred = $q.defer();

                            if (groupsMeta[groupId] && groupsMeta[groupId].isLoaded) {
                                deferred.resolve(groupsMeta[groupId].users);
                            } else {
                                groupsMeta[groupId] = groupsMeta[groupId] || {};

                                var options = {
                                    inviteType :  "DELEGATOR"
                                };
                                newJobAdv.getAdvGroupMembers(groupId,options)
                                    .then(function(groupMembers) {
                                        DataProvider.resource.User.inject(groupMembers);
                                        groupsMeta[groupId].users = DataProvider.resource.User.filter({
                                            where: {
                                                id: { in : _.pluck(groupMembers, "id")
                                                }
                                            }
                                        });
                                        groupsMeta[groupId].isLoaded = true;
                                        deferred.resolve(groupMembers);
                                    })
                                    .catch(function(err) {
                                        groupsMeta[groupId].err = err;
                                    })
                                    .finally(function() {
                                        groupsMeta[groupId].isLoading = false;
                                    })
                            }

                            return deferred.promise;
                        }

                        function sendDelegatorInvitation() {
                            if (!newJobAdv.isValid()) {
                                return;
                            }
                            blockUI.start("Sending job contributor invitation.");

                            //$scope.jobAdv.getSavedData();

                            /* var invitationIds = $scope.jobAdv.getInvitationMembers();
                             var invitations = [{ "users": invitationIds }]
                             var reason = $scope.formModel.inviteMsg;
                             return job.sendInviteToContributor(reason, invitations).then(function(res) {
                                     blockUI.stop(res.respMsg, {
                                         status: 'isSuccess'
                                     });
                                     $mdDialog.hide(res);
                                     return res;
                                 })
                                 .catch(function(err) {
                                     blockUI.stop(err.respMsg, {
                                         status: 'isError'
                                     });
                                 })
                                 .finally(function() {});*/



                            var deferred = $q.defer(),
                                advData = newJobAdv.getSavedData(),
                                advRequest = {};
                            advRequest.jobId = job.id;
                            advRequest.orgId = job.organization.id;
                            advRequest.invitations = [];
                            var invitationMessage = $scope.formModel.inviteMsg;

                            if (advData.users.length > 0) {
                                advRequest.invitations.push({
                                    users: advData.users
                                })
                            }

                            angular.forEach(advData.groups, function(value, groupId) {
                                if (value.sendToAll === true) {
                                    advRequest.invitations.push({
                                        groupId: groupId,
                                        sendToAll: true
                                    });
                                } else if (angular.isArray(value.invitee) && value.invitee.length > 0) {
                                    advRequest.invitations.push({
                                        groupId: groupId,
                                        users: value.invitee
                                    });
                                }
                            });

                            invitationMessage && (advRequest.reason = invitationMessage);


                            Connect.post(URL.JOB_INIVITE_CONTRIBUTOR, advRequest)
                                .then(function(res) {
                                    blockUI.stop(res.respMsg, {
                                        status: 'isSuccess'
                                    });
                                    $mdDialog.hide(res);
                                    deferred.resolve(res);
                                })
                                .catch(function(err) {
                                    blockUI.stop(err.respMsg, {
                                        status: 'isError'
                                    });
                                    deferred.reject(err);
                                });


                            return deferred.promise;




                            /*return newJobAdv.sendAdvertisement(job.id, $scope.formModel.inviteMsg)
                              .then(function (res) {
                                blockUI.stop(res.respMsg, {
                                  status: 'isSuccess'
                                });
                                $mdDialog.hide(res);
                                return res;p
                              })
                              .catch(function (err) {
                                blockUI.stop(err.respMsg, {
                                  status: 'isError'
                                });
                              })
                              .finally(function () {
                              })*/
                        }
                    }
                ],
                controllerAs: 'jobAdvCtrl'
            })
        }

        /**
         * Show a view for managing job contributors.
         * User can invite new member to become contributors in the job.
         * @param job
         */
        function showJobContributorsManager(job) {

        }

        function getJobAdvertiseInviteOwnerList($scope, job) {

            $scope.jobAdvertiseInviteOwnerList = [];
            $scope.showNoDataMsg = false;
            $scope.loadingImage = true;
            $scope.showMsgJobContainer = true;

            blockUI.start("Loading Invitation sent..", {
                status: 'isLoading'
            });

            var jobModel = DataProvider.resource.Job.get(job.id);
            jobModel.inviteContributorpendingList({}, {
                    bypassCache: true
                })
                .then(function(jobAdvertiseInviteOwnerList) {

                    for (var i = 0; i < jobAdvertiseInviteOwnerList.resp.length; i++) {
                        $scope.jobAdvertiseInviteOwnerList.push(jobAdvertiseInviteOwnerList.resp[i]);
                    }

                    if ($scope.jobAdvertiseInviteOwnerList.length == 0) {
                        $scope.showNoDataMsg = true;
                        $scope.loadingImage = false;
                    } else {
                        $scope.showMsgJobContainer = false;
                        $scope.loadingImage = false;
                    }
                })
                .catch(function(error) {})
                .finally(function() {
                    blockUI.stop();
                });
        }

    }

})();
