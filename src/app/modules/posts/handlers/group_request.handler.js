/**
 * Created by sudhir on 30/6/15.
 */

;(function() {
  "use strict";

  var app = angular.module('app.modules')
      .service('RequestApprovalPostHandler', [
        '$q', 'DataProvider',
        'Connect', 'URL', 'mDialog', 'blockUI', 'Lang',
        RequestApprovalPostHandler
      ])
  ;

  function RequestApprovalPostHandler ($q, DataProvider
    , Connect, URL
    , Dialog, blockUI, Lang) {

    var LANG = Lang.en.data;

    return {
      handle_createGroupRequest: handle_createGroupRequest
    };


    function handle_createGroupRequest(post, options) {
      var deferred = $q.defer();
      Dialog.show({
        targetEvent: options.targetEvent,
        templateUrl: 'app/modules/posts/templates/req_create_group.dialog.tpl.html',
        locals: {
          title: post.title,
          content: post.notificationDescription,
          ok: LANG.BUTTON.APPROVE,
          cancel: LANG.BUTTON.REJECT,
          LANG: LANG,
          org: post.organization,
          group: post.group,
          post:post
        }
      }).then(function(res) {
        console.log(res);
        if(res == 'true') {
          sendApprovalResponse(true);
        } else {
          sendApprovalResponse(false);
        }
      }).catch(function() {
      });

      return deferred.promise;

      function sendApprovalResponse(doApprove) {
        var progressMessage = doApprove
          ? LANG.POST.REQUEST_CREATE_GROUP.REPLY_APPROVE_PROGRESS_MESSAGE
          : LANG.POST.REQUEST_CREATE_GROUP.REPLY_REJECT_PROGRESS_MESSAGE;
        blockUI.start(progressMessage);
        Connect.post(URL.APPROVE_CREATE_GROUP, {
          postId: post.id,
          confirm: doApprove ? 0 : -1
        })
          .then(function (resp) {
            post.status = -2;
            DataProvider.resource.Post.inject(post);
            deferred.resolve(resp);
            Dialog.alert(resp.respMsg);
          })
          .catch(function (error) {
            deferred.reject(error);
            Dialog.alert(error.respMsg)
          })
          .finally(function () {
            blockUI.stop();
          })
      }
    }

  }

})();
