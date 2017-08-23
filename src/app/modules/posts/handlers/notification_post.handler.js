/**
 * Created by sudhir on 3/7/15.
 */

;(function() {
  "use strict";

  var app = angular.module('app.modules')
      .service('NotificationPostHandler', [
        '$q', 'State', 'Connect', 'URL', 'mDialog', 'blockUI', 'Lang',
        NotificationPostHandler
      ])
    ;

  function NotificationPostHandler($q, State, Connect, URL, mDialog, blockUI, Lang) {

    return {
      handle_createOrgSuccess: onCreateOrgSuccess,
      handle_createGroupSuccess: onCreateGroupSuccess
    };


    /**
     *
     * @task Navigate to the newly created organisation.
     *
     * @param post
     * @param options
     */
    function onCreateOrgSuccess(post, options) {
      var deferred = $q.defer();
      var org = post.organization;
      State.transitionTo('root.app.org-dashboard.orgInfo', {
        orgId: org.id
      }).then(function() {
        Connect.get(URL.VIEW_POST, {
          postId: post.id
        }).then(function(res) {
          deferred.resolve(res);
        }).catch(function(error) {
          deferred.reject(error);
        });
      });
      return deferred.promise;
    }

    function onCreateOrgFail(post, options) {}


    /**
     *
     * @task Navigate to the newly created group.
     *
     * @param post
     * @param options
     */
    function onCreateGroupSuccess(post, options) {
      var deferred = $q.defer();
      var org = post.organization;
      var group = post.group;
      State.transitionTo('root.app.group-dashboard.groupInfo', {
        orgId: org.id,
        groupId: group.id
      }).then(function() {
        Connect.get(URL.VIEW_POST, {
          postId: post.id
        }).then(function(res) {
          deferred.resolve(res);
        }).catch(function(error) {
          deferred.reject(error);
        });
      });
      return deferred.promise;
    }

    function onCreateGroupFail(post, options) {}


  }

})();
