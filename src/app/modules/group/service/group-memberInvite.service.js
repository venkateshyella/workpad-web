/**
 * Created by sudhir on 2/6/15.
 */

;
(function() {

    angular.module('app')
        .provider('GroupMemberInvite', GroupMemberInvite);

    function GroupMemberInvite() {

        return {
            $get: ['$q', '$timeout', 'mDialog', 'Lang', 'State','URL', 'DataProvider', '$q', 'blockUI','Connect','Session', GroupMemberInviteService]
        };

        function GroupMemberInviteService($q, $timeout, Dialog, Lang, State, URL,DataProvider, $q, blockUI,Connect,Session) {
            var LANG = Lang.en.data;
            return {
                showUserSelect: showSelect,
                showGrpMembers:showGrpMembers,
                onShowGroupMemberList:onShowGroupMemberList
            };

            function showSelect(bundle, options) {
                var deferred = $q.defer();
                var selectOptions = options || {};
                var optionalSearchParams = options.searchParams;

                Dialog.show({
                    controller: ['$scope', '$controller', function GroupMemberInviteController($scope, $controller) {
                        var self = this;
                        angular.extend(self, $controller('SelectListBaseController', { $scope: $scope }));

                        $scope.group = bundle.group;

                        $scope.GroupInviteesSelected = [];

                        $scope.removeSelectedMember = removeSelectedMember;

                        function removeSelectedMember(user) {
                            _.remove($scope.GroupInviteesSelected, {
                                id: user.id
                            });
                        }

                        $scope.memberSearchCtrl = {
                            selection: null,
                            searchText: "",
                            selectedItemChange: function(user) {
                                if (user) {
                                    var index = _.findIndex($scope.GroupInviteesSelected, user);
                                    if (index == -1) {
                                        $scope.GroupInviteesSelected.push(user);
                                    }
                                }
                                $timeout(function() {
                                    $scope.memberSearchCtrl.searchText = "";
                                }, 200)
                            },
                            querySearch: function(queryStr) {
                                if (queryStr && queryStr.length > 0) {

                                    var deferred = $q.defer();
                                    DataProvider.resource.User.findAll({
                                        q: queryStr,
                                        o: bundle.orgId,
                                        g: bundle.group.id
                                    }, { bypassCache: true, autoClose: false }).then(function(result) {
                                        return deferred.resolve(result);
                                    }).catch(function() {
                                        deferred.reject();
                                    });
                                    return deferred.promise;

                                } else {
                                    return [];
                                }
                            }
                        };


                        $scope.cancel = function() {
                            self.cancel();
                        };

                        $scope.submit = sendInvite;

                        function sendInvite() {
                            var url = URL.USER_INVITE_TO_GROUP;
                            var request = {
                                orgId: bundle.orgId,
                                groupId : bundle.group.id,
                                users: []
                            };
                            
                            blockUI.start("Sending Room member invitation");

                            angular.forEach($scope.GroupInviteesSelected, function(invitee, key) {
                                request.users.push(invitee.id)
                            });

                            Connect.post(url, request).then(function(result) {

                                var responseMetaObj = result.resp[result.resp.length - 1];

                                if (responseMetaObj.inviteExistsCount == 0 && responseMetaObj.successCount > 0) {
                                    blockUI.stop(responseMetaObj.successReponseMessage, {
                                        status: 'isSuccess'
                                    });
                                    self.cancel();
                                } else if(responseMetaObj.inviteExistsCount > 0 && responseMetaObj.successCount == 0){ 
                                    blockUI.stop();
                                    Dialog.alert({
                                        content: responseMetaObj.failureReponseMessage,
                                        ok: "Ok"
                                    }).then(function() {
                                        $scope.GroupInviteesSelected = [];
                                        $scope.queryString = "";
                                    });
                                }
                                else{
                                    blockUI.stop(responseMetaObj.successReponseMessage, {
                                        status: 'isSuccess'
                                    });
                                     Dialog.alert({
                                        content: responseMetaObj.failureReponseMessage,
                                        ok: "Ok"
                                    }).then(function() {
                                        $scope.GroupInviteesSelected = [];
                                        $scope.queryString = "";
                                    });
                                }
                            }).catch(function(error) {
                                blockUI.stop(error.respMsg);
                            }).finally(function() {
                            });
                            
                        };

                    }],
                    templateUrl: 'app/modules/group/templates/group-memberInvite.partial.html',
                    ev: selectOptions.$event,
                    clickOutsideToClose:false
                }).then(function(result) {
                    deferred.resolve(result);
                }).catch(function(error) {
                	deferred.reject(error);
                    blockUI.stop(error.respMsg);
                }).finally(function() {
                });
                return deferred.promise;
            };
            
            // code added here
            
            function showGrpMembers(bundle) {
                var deferred = $q.defer();

                Dialog.show({
                    controller: ['$scope', '$controller','Lang', function GroupMemberInviteController($scope, $controller,Lang) {
                        var self = this;
                        $scope.LANG = Lang.en.data;
                        angular.extend(self, $controller('SelectListBaseController', { $scope: $scope }));
                        
                        $scope.statusGrpData = {
                        		grpInvites: [],
                        		pgInfo: {
                        			pageSize: 25,
                        			currPage: 1
                        		}
                        		
                        };
                        $scope.isNextPageAvailable = false;
                        $scope.loadingNext = false;
                        $scope.loadNext = loadNext;
                        $scope.GrpInviteesSelected = [];
                        var _rawResponse;
                        
                        
                        function getGroupMembersInvites() {

                			if ($scope.statusGrpData.grpInvites.length == 0) {

                				blockUI.start("Loading Room Invites..", {
                					status: 'isLoading'
                				});

                			}

                			$scope.MU = {
                            		getDisplayDateTime: mobos.Utils.getDisplayDateTime		
                			}
                			
                			var _params = {
                				groupId: bundle.group.id,
                				pageSize: $scope.statusGrpData.pgInfo.pageSize,
                				pageNumber: $scope.statusGrpData.pgInfo.currPage
                			};

                			Connect.get(URL.ORG_GRP_MEMBER_STATUS, _params).then(function (res) {

                				$scope.loadingNext = false;

                				var statusList = res.resp;
                				$scope.GrpInviteesSelected = statusList.results;
                				 angular.forEach($scope.GrpInviteesSelected, function(orgMemeber) {
                					 $scope.statusGrpData.grpInvites.push(orgMemeber);
                		              
                		          });

                				$timeout();
                				checkNextPgAvailability(res);
                				
                			}).catch(function (error) {
                				console.log(error);
                			}).finally(function () {
                				blockUI.stop();
                			});
                		}
                       
                        function checkNextPgAvailability(res) {
                    		var totalResults = res.resp.paginationMetaData.totalResults;
                    		if ($scope.statusGrpData.grpInvites.length < totalResults) {
                    			$scope.isNextPageAvailable = true;
                    		} else {
                    			$scope.isNextPageAvailable = false;
                    		}
                    	}

                    	function loadNext() {
                    		$scope.loadingNext = true;
                    		$scope.statusGrpData.pgInfo.currPage += 1;
                    		getGroupMembersInvites();
                    	}

                    	getGroupMembersInvites();
                        $scope.cancel = function() {
                            self.cancel();
                        };
                    }],
                    templateUrl: 'app/modules/group/templates/group-invitesstatus.partial.html',
                    clickOutsideToClose:false
                }).then(function(result) {
                    deferred.resolve(result);
                });

                return deferred.promise;

            }
            
            
            function onShowGroupMemberList(groupid) {
            	var deferred = $q.defer();
            	var _params = {
        				groupId: groupid
        			};

        			Connect.get(URL.ORG_GRP_MEMBER_STATUS, _params).then(function (res) {
        			return deferred.resolve(res.resp.results);
            	}).catch(function (error) {
            		deferred.reject();
            	}).finally(function () {
            	});
        		return deferred.promise;
            }
        }

    }

})();
