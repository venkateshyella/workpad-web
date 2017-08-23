/**
 * Created by sudhir on 22/6/15.
 */

;
(function () {
  "use strict";

  var app = angular.module('app')
      .service('CreateGroupService', [
        '$q',
        'DataProvider', 'mDialog', 'Session',
        'Connect', 'URL', 'Lang',
        CreateGroupService
      ])
    ;

  function CreateGroupService($q, DataProvider, Dialog, Session, Connect, URL, Lang) {
    var LANG = Lang.en.data;
    return {
      createGroup: createGroup,
      submitCreateGroupForm: submitCreateGroupForm
    };


    /**
     * @desc Show a create group form.
     * @param bundle
     * @param options
     */
    function createGroup(intent, options) {
      var deferred = $q.defer();
      var options = options || {};
      var parentOrgId = intent.org.id;
      var parentGroup = intent.parentGroup || null;
      var showSelectOrg = intent.showSelectOrg || false;
      var showSelectGroup = intent.showSelectGroup || false;

      Dialog.show({
        templateUrl: 'app/modules/group/templates/group-create.dialog.tpl.html',
        controller: ['$scope', '$mdDialog', '$controller', 'Lang',  function ($scope, $mdDialog, $controller) {
          var self = this;

          angular.extend(self, $controller('ViewDataBaseController', {$scope: $scope}));
          self.viewData = self.initializeViewDataBaseController('viewDataBundle', fetchViewData, findViewData);

          angular.extend(self, $controller('FormBaseController', {$scope: $scope}));
          self.createGroupFormCtrl = self.initializeForm('create_grp', {
            submitFn: sendCreateGroupReq
          });

          $scope.form = {};
          $scope.formModel = {
            orgId: parentOrgId
          };
          $scope.intent = intent;
          $scope.LANG = Lang.en.data;
          $scope.showSelectOrg = showSelectOrg;
          $scope.showSelectGroup = showSelectGroup;
          $scope.cancel = $mdDialog.cancel;

          $scope.submit = function submit() {
            self.createGroupFormCtrl.create_grp.submit()
              .then(function (result) {
                deferred.resolve(result);
                $mdDialog.hide(result);
              }).catch(function (error) {
                // Do nothing
                deferred.reject(error);
              })
          };

          function sendCreateGroupReq() {
            var deferred = $q.defer();
            var groupData = $scope.formModel.create_grp;

            var orgData = intent.showSelectOrg
              ? DataProvider.resource.Organisation.get($scope.formModel.orgId)
              : intent.org;
            var parentData = intent.parentGroup || null;

            var createGroupRequestObj = {
              groupName: groupData.name,
              desc: groupData.desc,
              orgId: orgData.id
            };

            if(parentData) {
              createGroupRequestObj.groupParentId = parentData.id
            }

            Connect.post(URL.CREATE_GROUP, createGroupRequestObj)
            //DataProvider.resource.Group.create({
            //  groupData: groupData,
            //  orgData: orgData,
            //  parentData: parentData
            //})
              .then(function (res) {
              console.log(res);
              deferred.resolve(res);
            }).catch(function (error) {
              deferred.reject(error)
            });
            return deferred.promise;
          }

          function fetchViewData() {
            var deferred = $q.defer();

            if(showSelectOrg) {
              $q.all([
                fetchOrgSelectOptions(),
                fetchGroupSelectOptions()
              ])
                .then(function(res) {
                  deferred.resolve(res);
                }).catch(function(error) {
                  deferred.reject(error);
                });

              //DataProvider.resource.Organisation.findAll({userId: Session.userId}, {bypassCache: true})
              //  .then(function (result) {
              //    deferred.resolve(findViewData());
              //  }).catch(function (error) {
              //    deferred.reject(error);
              //  });
            } else {
              deferred.resolve(findViewData());
            }

            return deferred.promise;

            function fetchOrgSelectOptions() {
              if(showSelectOrg) {
                return DataProvider.resource.Organisation.findAll({userId: Session.userId}, {bypassCache: true})
              } else {
                return true;
              }
            }

            function fetchGroupSelectOptions() {
              if(showSelectGroup) {

              }
            }
          }

          function findViewData() {
            //return DataProvider.resource.Organisation.filter({where: {adminId: Session.userId}});
            return {
              myOrgs: intent.showSelectOrg
                ? DataProvider.resource.Organisation.getAll()
                : [intent.org],
              myGroups: [intent.org],
              org: {},
              group: {}
            }
          }

          $scope.viewDataBundle.refresh({bypassCache: true})
            .then(function () {
              $scope.data = {
                myOrgs: self.viewData.viewDataBundle.data.myOrgs
              }
            });

        }],
        $event: options.$event
      });

      return deferred.promise;
    }

    function submitCreateGroupForm(groupData, options) {
    }

    function updateGroupForm(groupData, options) {
    }

  }

})();