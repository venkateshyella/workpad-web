/**
 * Created by sudhir on 2/6/15.
 */

;
(function() {

    angular.module('app')
        .provider('UserSelectorNew', UserSelector);

    function UserSelector() {

        return {
            $get: ['$q', '$timeout', 'mDialog', 'Lang', 'State', 'DataProvider', '$q', 'blockUI','URL','Session','Connect', UserSelectService]
        };

        function UserSelectService($q, $timeout, Dialog, Lang, State, DataProvider, $q, blockUI,URL,Session,Connect) {
            var LANG = Lang.en.data;
            
            return {
                showUserSelect: showSelect,
                showOrgMemberStatus:showOrgMemberStatus,
                onShowOrgMemberList:onShowOrgMemberList
            };

            function showSelect(bundle, options, invitePeople) {
                var deferred = $q.defer();
                var selectOptions = options || {};
                var loadUserFn = bundle.loadUsers;
                var optionalSearchParams = options.searchParams;


                Dialog.show({
                    controller: ['$scope', '$controller', function UserSelectController($scope, $controller) {
                        var self = this;
                        angular.extend(self, $controller('SelectListBaseController', { $scope: $scope }));

                        $scope.org = bundle.org;

                        $scope.OrgInviteesSelected = [];

                        $scope.removeSelectedMember = removeSelectedMember;

                        function removeSelectedMember(user) {
                            _.remove($scope.OrgInviteesSelected, {
                                id: user.id
                            });
                        }

                        $scope.invitePeopleDialog = function() {
                        	$scope.memberSearchCtrl.searchText = '';
                        	$scope.newAdvertisementGroup = undefined;
                        	self.cancel();
                            invitePeople();
                        };
                        	
                        $scope.memberSearchCtrl = {
                            selection: null,
                            searchText: "",
                            selectedItemChange: function(user) {
                                if (user) {
                                    var index = _.findIndex($scope.OrgInviteesSelected, user);
                                    if (index == -1) {
                                        $scope.OrgInviteesSelected.push(user);
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
                                        o: bundle.org.id
                                    }, {bypassCache: true,autoClose: false}).then(function(result) {
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
                        	
                            var url = URL.USER_INVITE_TO_ORG;
                            var request = {};
                            request.data = [];

                            blockUI.start("Sending WorkSpace member invitation");

                            angular.forEach($scope.OrgInviteesSelected, function(invitee, key) {
                                request.data.push({ orgId: bundle.org.id, userId: invitee.id })
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
                                        $scope.OrgInviteesSelected = [];
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
                                        $scope.OrgInviteesSelected = [];
                                        $scope.queryString = "";
                                    });
                                }


                            }).catch(function(error) {
                            	   if (error.responseCode == 7) {
                                  	 Dialog.confirm({
                                           content: error.respMsg,
                                           ok: 'Subscribe',
                                           cancel: "Cancel"
                                       }).then(function(res) {
                                      	 State.transitionTo('root.app.subscription', {
                         					  orgId:bundle.org.id
                         		            }, {
                         		            	FLAGS: {
                      							CLEAR_STACK: true
                      						}
                         		            });
                                       }).catch(function() {

                                       });
									} else {
										Dialog.alert(error.respMsg);
									}
                            }).finally(function() {
                            	blockUI.stop();
                            });
                        }

                    }],
                    templateUrl: 'app/modules/user/select/simpleUserSelect-v3.partial.html',
                    ev: selectOptions.$event,
                    clickOutsideToClose:false
                }).then(function(result) {
                    deferred.resolve(result);
                });

                return deferred.promise;

            }
            
            
            // code related to invites added here
            
            

            function showOrgMemberStatus(targetBundle) {
                var deferred = $q.defer();
                Dialog.show({
                    controller: ['$scope', '$controller','Lang', function UserSelectController($scope, $controller,Lang) {
                        var self = this;
                        $scope.LANG = Lang.en.data;
                        angular.extend(self, $controller('SelectListBaseController', { $scope: $scope }));
                        
                        $scope.statusOrgData = {
                        		orgInvites: [],
                        		pgInfo: {
                        			pageSize: 25,
                        			currPage: 1
                        		}
                        };
                        $scope.isNextPageAvailable = false;
                        $scope.loadingNext = false;
                        $scope.loadNext = loadNext;
                        $scope.OrgInviteesSelected = [];
                        var _rawResponse;
                        
                       // var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;
                        
                        function getOrgInvites() {

                			if ($scope.statusOrgData.orgInvites.length == 0) {

                				blockUI.start("Loading WorkSpace Invites Data..", {
                					status: 'isLoading'
                				});

                			}
           			
                			$scope.MU = {
                            		getDisplayDateTime: mobos.Utils.getDisplayDateTime		
                			} 
                			
                			var org = targetBundle.org ? DataProvider.resource.Organisation.get(targetBundle.org.id) : null;
                			var _params = {
                				orgId: org.id,
                				pageSize: $scope.statusOrgData.pgInfo.pageSize,
                				pageNumber: $scope.statusOrgData.pgInfo.currPage
                			};

                			Connect.get(URL.ORG_MEMBER_STATUS, _params).then(function (res) {

                				$scope.loadingNext = false;

                				var statusList = res.resp;
                				$scope.OrgInviteesSelected = statusList.results;
                				
                				 angular.forEach($scope.OrgInviteesSelected, function(orgMemeber) {
                					 $scope.statusOrgData.orgInvites.push(orgMemeber);
                		              
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
                    		if ($scope.statusOrgData.orgInvites.length < totalResults) {
                    			$scope.isNextPageAvailable = true;
                    		} else {
                    			$scope.isNextPageAvailable = false;
                    		}
                    	}

                    	function loadNext() {
                    		$scope.loadingNext = true;
                    		$scope.statusOrgData.pgInfo.currPage += 1;
                    		getOrgInvites();
                    	}

                    	getOrgInvites();
                        $scope.cancel = function() {
                            self.cancel();
                        };
                    }],
                    templateUrl: 'app/modules/user/select/userStatusList.partial.html',
                    clickOutsideToClose:false
                }).then(function(result) {
                    deferred.resolve(result);
                });
                
                return deferred.promise;

            }
            
            // code related to invites added here
            
            function onShowOrgMemberList(orgId) {
            	var deferred = $q.defer();
        		var _params = {
        			orgId:orgId
        		};
        		Connect.get(URL.ORG_MEMBER_STATUS, _params).then(function (res) {
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
