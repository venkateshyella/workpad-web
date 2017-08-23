/**
 * Created by sudhir on 17/9/15.
 */

;
(function () {
  "use strict";

  angular.module('app')
    .service('JobDelegatorInviteService', [
      'JobAdvertisement', 'JobAdvertisementFactory',
      '$q', '$timeout', 'mDialog', 'blockUI',
      'Connect', 'URL', 'Lang',
      'JOB_LIFECYCLE_EVENT', 'DataProvider',
      JobDelegatorInviteService
    ])
  ;

  function JobDelegatorInviteService(JobAdvertisement, JobAdvertisementFactory
    , $q, $timeout, Dialog, blockUI, Connect, URL, Lang
    , JOB_LIFECYCLE_EVENT, DataProvider) {

    var LANG = Lang.en.data;
    return {
      createNewDelegatorInvite: createNewDelegatorInvite,
      onJobInviteStatusList : onJobInviteStatusList,
      onJobInviteStatusDialog : onJobInviteStatusDialog
    };

    function createNewDelegatorInvite(job, options) {
      var options = options || {};
      return Dialog.show({
        templateUrl: 'app/modules/job/templates/job-contributor-v2-create.dialog.tpl.html',
        clickOutsideToClose: false,
        targetEvent: options.$event,
        controller: [
          '$scope', '$controller', '$mdDialog', 'blockUI',
          function ($scope, $controller, $mdDialog, blockUI) {

            var self = this
              , newJobAdv = new JobAdvertisementFactory.GroupAdvertisement(job)
              , jobAdvertisementOrg = job.organization
              , groupsMeta = {}
              ;
            self.org = jobAdvertisementOrg;
            self.job = job;
            self.searchMode = 'group';

            getPendingJobAdvertisements($scope, job);
            $scope.LANG = LANG;
            $scope.cancel = function () {
              $mdDialog.cancel();
            };

            $scope.submit = function () {
              sendAdvertisement()
                .then(function (res) {
                  //$mdDialog.hide(res);
                })
                .catch(function () {
                })
                .finally(function () {
                })
              ;
            };
            $scope.removeGroup = removeAdvGroup;
            $scope.removeOrg = removeOrg;
            $scope.toggleSelectAllOrgMembers = toggleSelectAllOrgMembers;
            $scope.toggleOrgMembersList = toggleOrgMembersList;
            $scope.toggleGroupMembersList = toggleGroupMembersList;
            $scope.toggleAdvOrgMember = toggleAdvOrgMember;
            $scope.removeMemberFromAdvertisement = removeMemberFromAdvertisement;
            $scope.toggleAdvGroupMembersList = toggleAdvGroupMembersList;
            $scope.toggleAdvGroupSelectAll = toggleAdvGroupSelectAll;
            $scope.toggleGroupInvitee = toggleGroupInvitee;
            $scope.toggleAdvGroupMember = toggleAdvGroupMember;
            $scope.getUserModel = function (userId) {
              return DataProvider.resource.User.get(userId);
            };

            $scope.jobAdv = newJobAdv;
            $scope.formModel = {
              inviteMsg: ""
            };

            $scope.getModel = {
              User: DataProvider.resource.User.get,
              Group: DataProvider.resource.Group.get,
              Org: DataProvider.resource.Organisation.get
            };

            function removeMemberFromAdvertisement(userId) {
              newJobAdv.removeMember(userId);
              console.log(newJobAdv.getSavedData());
            }

            function addNewGroupMemberForAdvertisement(advUserObj) {
              //$scope.selectedMembers.push(advUserObj);
              //$scope.selectedMembers = _.unique($scope.selectedMembers, function (advObj) {
              //  return advObj.user.id + "-" + advObj.group.id
              //});

              var group = advUserObj.group
                , groupId = group.id
                , user = advUserObj.user
                ;

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
                  id: {
                    in: existingInviteesId
                  }
                }
              });
              newJobAdv.addGroupMember(advUserObj.group.id, advUserObj.user.id);
            }

            $scope.groupSearchCtrl = {
              selection: null,
              searchText: "",
              selectedItemChange: function (item) {
                if (item) {
                  addNewSearchResult(item);
                  console.log($scope.jobAdv);
                }
                $timeout(function () {
                  $scope.groupSearchCtrl.searchText = "";
                }, 200)
              },
              querySearch: function (queryStr) {
                if (queryStr && queryStr.length > 0) {
                  return newJobAdv.queryAdvertisementInvitees({
                      queryStr: queryStr,
                      inviteType: "DELEGATOR"
                    })
                    .then(function (res) {
                      var groups = prepareGroupQueryResult(res.groups);
                      var orgs = prepareOrgQueryResult(res.orgs);
                      var result = [].concat(orgs, groups);
                      console.log(result);
                      return result;
                    })
                    .catch(function () {
                      return null;
                    })
                    ;
                } else {
                  return [];
                }

                function prepareOrgQueryResult(orgs) {
                  var searchResults = _.map(orgs, function (orgSearchResult) {
                    return {
                      displayText: orgSearchResult.orgName,
                      val: orgSearchResult,
                      type: 'ORG'
                    }
                  });
                  return searchResults;
                }

                function prepareGroupQueryResult(groups) {
                  _.remove(groups, function (group) {
                    var resultGroup = group;
                    return (_.findIndex($scope.selectedGroups, function (advGroup) {
                      return resultGroup.groupId == advGroup.groupId;
                    }) != -1);
                  });
                  var searchResults = _.map(groups, function (group) {
                    return {
                      displayText: group.groupName,
                      val: group,
                      type: "GRP"
                    };
                  });
                  return searchResults
                }
              }
            };

            function addNewSearchResult(result) {
              switch (result.type) {
                case 'GRP':
                  var group = result.val;
                  newJobAdv.addGroup(group.groupId, group);
                  newJobAdv.addSendToAllFlag(group.groupId);
                  break;
                case 'ORG':
                  var org = result.val;
                  newJobAdv.addOrg(org.orgId);
                  newJobAdv.setOrgSendToAll(org.orgId, true);
                  break;
              }
            }

            function removeOrg(orgId) {
              $scope.jobAdv.removeOrg(orgId);
            }

            function toggleSelectAllOrgMembers(orgId) {
              var advOrgMembers = $scope.jobAdv.getOrgExtras(orgId).users;
              if ($scope.jobAdv.getOrgSendToAll(orgId)) {
                $scope.jobAdv.setOrgSendToAll(orgId, false);
                $scope.jobAdv.removeAllOrgMembers(orgId);
              } else {
                $scope.jobAdv.setOrgSendToAll(orgId, true);
                $scope.jobAdv.addAllOrgMembers(orgId, _.pluck(advOrgMembers, 'id'));
              }
              //$scope.jobAdv.setOrgSendToAll(orgId, !$scope.jobAdv.getOrgSendToAll(orgId));
            }

            function toggleOrgMembersList(orgId) {
              var orgExtras = $scope.jobAdv.getOrgExtras(orgId) || {};
              $scope.jobAdv.setOrgExtras(orgId, {
                flag_expanded: !orgExtras.flag_expanded
              });
              _loadOrgInvitees(orgId)
                .then(function (users) {
                  $scope.jobAdv.setOrgExtras(orgId, {
                    users: users
                  });
                })
            }
            function toggleGroupMembersList(groupId) {
              var groupExtras = $scope.jobAdv.getGroupExtras(groupId) || {};
              $scope.jobAdv.setGroupExtras(groupId, {
                flag_expanded: !groupExtras.flag_expanded
              });
              _loadGroupInvitees(groupId)
                .then(function (users) {
                  $scope.jobAdv.setGroupExtras(groupId, {
                    users: users
                  });
                })
            }



            function toggleAdvOrgMember(orgId, userId) {
              if ($scope.jobAdv.getOrgMember(orgId, userId)) {
                $scope.jobAdv.removeOrgMember(orgId, userId);
              }
              else {
                $scope.jobAdv.addOrgMember(orgId, userId);
              }
              _updateOrgSendToAllFlag(orgId);
            }

            function _updateOrgSendToAllFlag(orgId) {
              try {
                var orgInvitees = $scope.jobAdv.getOrgExtras(orgId).users;
                var selectedOrgInvitees = $scope.jobAdv.getOrg(orgId).invitee;
                if (orgInvitees.length == selectedOrgInvitees.length) {
                  $scope.jobAdv.setOrgSendToAll(orgId, true);
                } else {
                  $scope.jobAdv.setOrgSendToAll(orgId, false);
                }
              } catch (e) {

              }
            }

            function removeAdvGroup(groupId) {
              if (!groupId) return;
              newJobAdv.removeGroup(groupId);
            }

            function toggleAdvGroupMember(groupId, userId) {




              var advData = $scope.jobAdv.getSavedData();
              if (advData.groups[groupId].invitee.indexOf(userId) > -1) {
                newJobAdv.removeGroupMember(groupId, userId);
              }
              else {
                newJobAdv.addGroupMember(groupId, userId);
              }
              _updateGroupSendToAllFlag(groupId);
            }
            function _updateGroupSendToAllFlag(groupId) {
              try {
                var groupInvitees = $scope.jobAdv.getGroupExtras(groupId).users;
                var selectedGroupInvitees = $scope.jobAdv.getGroup(groupId).invitee;
                if (groupInvitees.length == selectedGroupInvitees.length) {
                  $scope.jobAdv.setGroupSendToAll(groupId, true);
                } else {
                  $scope.jobAdv.setGroupSendToAll(groupId, false);
                }
              } catch (e) {

              }
            }

            function toggleAdvGroupMembersList(groupId, isOpen) {


              var groupExtras = $scope.jobAdv.getGroupExtras(groupId) || {};
              $scope.jobAdv.setGroupExtras(groupId, {
                flag_expanded: !groupExtras.flag_expanded
              });

              /* Create empty extras obj */
              //$scope.jobAdv.setGroupExtras(groupId, {});
              var group = $scope.jobAdv.getGroupExtras(groupId);
              group._isMembersListExpanded = !group._isMembersListExpanded;
              if (group._isLoadingMembersList) return;
              group._isLoadingMembersList = true;
              group._isMemberListLoadError = false;
              return _loadGroupInvitees(groupId)
                .then(function (groupMembers) {
                  for (var i = 0; i < group.users.length; i++) {
                    group.users[i].isInvited = false;
                    newJobAdv.addGroupMember(groupId, group.users[i].id);
                  }
                })
                .catch(function () {
                  group._isMemberListLoadError = true;
                  group.users = [];
                })
                .finally(function () {
                  group._isLoadingMembersList = false;
                })
                ;

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
              var group = $scope.jobAdv.getGroupExtras(groupId);
              if (newJobAdv.getInvitationGroups()[groupId].sendToAll) {
                newJobAdv.removeSendToAllFlag(groupId);

                _.each(group.users, function (user) {
                  newJobAdv.removeGroupMember(groupId, user.id);
                })
              } else {
                newJobAdv.addSendToAllFlag(groupId);
                _.each(group.users, function (user) {
                  newJobAdv.addGroupMember(groupId, user.id);
                })
              }
            }

            function toggleGroupInvitee(userId) {

            }

            function _loadOrgInvitees(orgId) {
              var deferred = $q.defer()
                , orgExtras = $scope.jobAdv.getOrgExtras(orgId);
              if (orgExtras.isLoaded) {
                deferred.resolve(orgExtras.users);
              }
              else {
                var options = {
                  inviteType: "DELEGATOR"
                };
                newJobAdv.getAdvOrgMembers(orgId, options)
                  .then(function (orgMembers) {
                    DataProvider.resource.User.inject(orgMembers);
                    orgExtras.users = DataProvider.resource.User.filter({
                      where: {
                        id: {
                          in: _.pluck(orgMembers, "id")
                        }
                      }
                    });
                    orgExtras.isLoaded = true;
                    /* Add all users to invitee list */
                    _.each(orgMembers, function (user) {
                      $scope.jobAdv.addOrgMember(orgId, user.id);
                    });
                    deferred.resolve(orgMembers);
                  })
                  .catch(function (err) {
                    orgExtras.err = err;
                  })
                  .finally(function () {
                    orgExtras.isLoading = false;
                  })
              }
              return deferred.promise;
            }

            function _loadGroupInvitees(groupId) {
              $scope.jobAdv.setGroupExtras(groupId, {});
              var deferred = $q.defer()
                , groupExtras = $scope.jobAdv.getGroupExtras(groupId);
              if (groupExtras.isLoaded) {
                deferred.resolve(groupExtras.users);
              }
              else {
                var options = {
                  inviteType: "DELEGATOR"
                };
                newJobAdv.getAdvGroupMembers(groupId, options)
                  .then(function (groupMembers) {
                    DataProvider.resource.User.inject(groupMembers);
                    groupExtras.users = DataProvider.resource.User.filter({
                      where: {
                        id: {
                          in: _.pluck(groupMembers, "id")
                        }
                      }
                    });
                    groupExtras.isLoaded = true;
                    deferred.resolve(groupMembers);
                  })
                  .catch(function (err) {
                    groupExtras.err = err;
                  })
                  .finally(function () {
                    groupsMeta[groupId].isLoading = false;
                  })
              }

              return deferred.promise;
            }

            function sendAdvertisement() {
              if (!newJobAdv.isValid()) {
                return;
              }
              blockUI.start("Sending job advertisement.");
              var inviteType = "DELEGATE";
              return newJobAdv.sendAdvertisement(job.id, $scope.formModel.inviteMsg,inviteType)
                .then(function (res) {
                  blockUI.stop(res.respMsg, {
                    status: 'isSuccess'
                  });
                  $mdDialog.hide(res);
                  return res;
                })
                .catch(function (err) {
                  blockUI.stop(err.respMsg, {
                    status: 'isError'
                  });
                })
                .finally(function () {
                })
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

    function getPendingJobAdvertisements($scope, job) {

      $scope.jobAdvertiseInviteOwnerList = [];
      $scope.showNoDataMsg = false;
      $scope.loadingImage = true;
      $scope.showMsgJobContainer = true;

      blockUI.start("Loading Invitation sent..", {
        status: 'isLoading'
      });

      var targetJobAdvertiseBundle = DataProvider.resource.Job.get(job.id);
      targetJobAdvertiseBundle.inviteContributorpendingList({}, {bypassCache: true})
        .then(function (jobAdvertiseInviteOwnerList) {

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
        .catch(function (error) {
        })
        .finally(function () {
          blockUI.stop();
        });
    }
    
    function onJobInviteStatusList(params) {
    	var deferred = $q.defer();
		Connect.get(URL.JOB_INV_STATUS, params).then(function (res) {
			return deferred.resolve(res.resp);
    	}).catch(function (error) {
    		deferred.reject();
    	}).finally(function () {
    	});
		return deferred.promise;
    }
    
    function onJobInviteStatusDialog(resp, params, role) {
    	var deferred = $q.defer();

    	Dialog.show({
    		controller: ['$scope', '$controller','Lang','$mdDialog', function InviteesStatusController($scope, $controller,Lang,$mdDialog) {                	
    			$scope.LANG = LANG;

    			$scope.isNextPageAvailable = false;
    			$scope.loadingNext = false;

    			$scope.reqObj = params;
    			$scope.JobInviteesSelected = [];

    			angular.forEach(resp.results, function(resp) {
    				$scope.JobInviteesSelected.push(resp);
    			});

    			$scope.role = role;

    			function checkNextPgAvailability(resultCount) {
    				if ($scope.JobInviteesSelected.length < resultCount) {
    					$scope.isNextPageAvailable = true;
    				} else {
    					$scope.isNextPageAvailable = false;
    				}
    			}

    			$scope.loadNext = function() {
    				$scope.loadingNext = true;
    				$scope.reqObj.pageNumber += 1;
    				onJobInviteStatus();
    			}

    			function onJobInviteStatus() {
    				onJobInviteStatusList($scope.reqObj)
    				.then(function (res) {
    					angular.forEach(res.results, function(res) {
    						$scope.JobInviteesSelected.push(res);
    					});
    					checkNextPgAvailability(res.paginationMetaData.totalResults);
    					$scope.loadingNext = false;
    				}).catch(function (err) {
    					Dialog.alert({
    						content: err.message,
    						ok: "Ok"
    					});
    				}).finally(function () {
    				});
    			}

    			$scope.MU = {
    					getDisplayDateTime: mobos.Utils.getDisplayDateTime		
    			}   

    			$scope.cancel = function() {
    				$mdDialog.cancel();
    			};

    			checkNextPgAvailability(resp.paginationMetaData.totalResults);
    		}],
    		templateUrl: 'app/modules/job/templates/job-members-invitees-status.dialog.tpl.html',
    		clickOutsideToClose:false
    	}).then(function(result) {
    		deferred.resolve(result);
    	});
    	return deferred.promise;
    }

  }

})();