/**
 * Created by sudhir on 2/6/15.
 */

;
(function() {

    angular.module('app')
        .provider('UserSelector', UserSelector);

    function UserSelector() {

        return {
            $get: ['$q', '$timeout', 'mDialog', 'Lang', 'State', UserSelectService]
        };


        /**
         *
         * @doc service
         * ```js
         *
         * UserSelect.showSelect({ params: {}, exclude: [] })
         *
         * ```
         * @returns {{showSelect: showSelect}}
         * @constructor
         */
        function UserSelectService($q, $timeout, Dialog, Lang, State) {
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

                        $scope.toggleUserSelection =  toggleUserSelection;

                        function toggleUserSelection(user) {

                            if ($scope.OrgInvitees.length > 0) {
                                angular.forEach($scope.OrgInvitees, function(invitee, key) {
                                    if (invitee.id == user.id) {
                                          console.log("Remove element");
                                    } else {
                                        $scope.OrgInvitees.push(user);
                                    }
                                });
                            }
                            else{
                                $scope.OrgInvitees.push(user);
                            }
                        };


                        // self.exposeSelectListScope('listControl');

                        $scope.onListItemSelect = function(item) {

                           

                            
                            Dialog.showListDialog([{
                                text: "View Profile",
                                value: "profile"
                            }, {
                                text: "Invite Member",
                                value: "invite"
                            }], {}).then(function(select) {
                                switch (select.value) {
                                    case 'profile':
                                        self.cancel();
                                        State.transitionTo('root.app.user', {
                                            id: item.id
                                        });
                                        break;
                                    case 'invite':
                                        if (!selectOptions.autoClose) {
                                            deferred.notify({
                                                event: "invite",
                                                selection: item,
                                                ctrl: self
                                            });
                                        } else {
                                            self.hide(item);
                                        }
                                        break;
                                }
                            });
                        };

                        $scope.cancel = function() {
                            self.cancel();
                            deferred.reject();
                        };

                        $scope.refresh = function(options) {
                            //if($scope.search_isLoading) {return;}
                            options = options || {};
                            var queryString = options.queryString || "";

                            var loadUsersResult;
                            loadUsersResult = $q.when(loadUserFn({
                                queryString: queryString
                            }, options));
                            $scope.error = null;
                            $scope.search_isLoading = true;

                            loadUsersResult
                                .then(function(result) {
                                    $scope.users = result || [];
                                    $scope.listMsg = null;
                                    if ($scope.users.length == 0) {
                                        $scope.listMsg = {
                                            msg: LANG.MODULES.USER_SELECT.EMPTY_LIST
                                        };
                                    } else {
                                        $scope.listMsg = null;
                                    }
                                })
                                .catch(function(error) {
                                    console.log(error);
                                    $scope.listMsg = {
                                        msg: error.respMsg || LANG.MODULES.USER_SELECT.ERROR_LOADING
                                    };
                                    //$scope.users = [];
                                })
                                .finally(function() {
                                    $scope.search_isLoading = false;
                                });
                        };

                        // $scope.refresh();

                    }],
                    templateUrl: 'app/modules/user/select/simpleUserSelect.partial.html',
                    ev: selectOptions.$event
                }).then(function(result) {
                    deferred.resolve(result);
                });

                return deferred.promise;

            }
        }

    }

})();
