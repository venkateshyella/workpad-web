/**
 * Created by sudhir on 2/6/15.
 */

;
(function() {

    angular.module('app')
        .provider('UserSelectorNew1', UserSelector);

    function UserSelector() {

        return {
            $get: ['$q', '$timeout', 'mDialog', 'Lang', 'State', 'DataProvider', UserSelectService]
        };

        function UserSelectService($q, $timeout, Dialog, Lang, State, DataProvider) {
            var LANG = Lang.en.data;
            return {
                showUserSelect: showSelect
            };

            function showSelect(bundle, options) {
                var deferred = $q.defer();
                var selectOptions = options || {};
                var loadUserFn = bundle.loadUsers;
                var optionalSearchParams = options.searchParams;
                Dialog.show({
                    controller: ['$scope', '$controller', function UserSelectController($scope, $controller) {
                        var self = this;
                        angular.extend(self, $controller('SelectListBaseController', { $scope: $scope }));

                        $scope.OrgInvitees = [];
                        $scope.users = [];

                        $scope.toggleUserSelection = toggleUserSelection;

                        function toggleUserSelection(user) {

                            var index = _.findIndex($scope.OrgInvitees, user);
                            if (index == -1) {
                                $scope.OrgInvitees.push(user);
                            } else {
                                _.remove($scope.OrgInvitees, {
                                    id: user.id
                                });
                            }
                            console.log($scope.OrgInvitees);

                        };

                        $scope.cancel = function() {
                            self.cancel();
                        };

                        $scope.submit = sendInvite;

                        function sendInvite() {
                            var url = URL.USER_INVITE_TO_ORG;
                            var request = {};
                            request.data = [];

                            angular.forEach($scope.OrgInvitees, function(invitee, key) {
                                request.data.push({ orgId: bundle.org.id, userId: invitee.id })
                            });

                            Connect.post(url, request).then(function(result) {

                                Dialog.alert({
                                    content: result.respMsg,
                                    ok: "Ok"
                                }).then(function(){
                                    $scope.users = [];
                                    $scope.OrgInvitees = [];
                                    $scope.queryString = "";
                                });
                            }).catch(function(error) {
                                console.log(error.respMsg);
                            }).finally(function() {});
                        }

                        $scope.refresh = function(options) {

                            options = options || {};
                            var queryString = options.queryString || "";
                            $scope.error = null;

                            if (queryString.length > 0) {
                                $scope.search_isLoading = true;
                                DataProvider.resource.User.findAll({
                                        q: options.queryString,
                                        o: bundle.org.id
                                    }, options).then(function(result) {
                                        $scope.users = result || [];
                                        $scope.listMsg = null;
                                        if ($scope.users.length == 0) {
                                            $scope.listMsg = {
                                                msg: LANG.MODULES.USER_SELECT.EMPTY_LIST
                                            };
                                        } else {
                                            $scope.listMsg = null;
                                        }
                                        $timeout(function() {});
                                    }).catch(function(error) {
                                        console.log(error);
                                        $scope.listMsg = {
                                            msg: error.respMsg || LANG.MODULES.USER_SELECT.ERROR_LOADING
                                        };
                                    })
                                    .finally(function() {
                                        $scope.search_isLoading = false;
                                    });
                            } else {
                                $scope.users = [];
                            }

                        };


                    }],
                    templateUrl: 'app/modules/user/select/simpleUserSelect-v2.partial.html',
                    ev: selectOptions.$event
                }).then(function(result) {
                    deferred.resolve(result);
                });

                return deferred.promise;

            }
        }

    }

})();
