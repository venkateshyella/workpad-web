/**
 * Created by sudhir on 15/6/15.
 */

;
(function () {
  "use strict";

  var app = angular.module('app.modules')
      .service('postHandler_Invitation', [
        '$q', 'mDialog', 'blockUI',
        'State', 'UserInvitationService', 'DataProvider',
        'Lang',
        postHandler_Invitation])
    ;

  function postHandler_Invitation($q, Dialog, blockUI,
                                  State, UserInvitationService, DataProvider,
                                  Lang) {

    var LANG = Lang.en.data;
    return {
      replyToInvitationToJoinOrganisation: replyToInvitationToJoinOrganisation,
      replyToInvitationToJoinGroup: replyToInvitationToJoinGroup,
      replyToInvitationToJoinJob: replyToInvitationToJoinJob,
      replyToInvitationToJoinEvents:replyToInvitationToJoinEvents
    };

    function replyToInvitationToJoinGroup(post, $event) {
      var deferred = $q.defer()
	      , org = post.organization
	      , group = post.group
	      , dataBundle = {
        post: post,
        org: org,
        group: group,
        fromUser: post.fromUser,
        toUser: post.toUser,
        fetchFn: fetchDataForInvitationPost,
        invitationDialogTemplateUrl: 'app/modules/user-invite/templates/user-invitation-to-group.dialog.tpl.html',
	      action: {
		      viewGroup: function () {
			      "use strict";
			      State.transitionTo('root.app.group-dashboard.groupInfo', {
				      orgId: org.id,
				      groupId: group.id
			      })
		      },
		      updateViewPost: function () {
		    	  post.toggleRead(true)
					.then(function () {
						deferred.resolve();
					});
		      }
	      }
      };
      var options = {
        $event: $event
      };

      function fetchDataForInvitationPost(options) {
        var deferred = $q.defer();

        $q.all([
          loadOrg(dataBundle.org.id),
          loadGroupData(dataBundle.org.id, dataBundle.group.id)
        ]).then(function (dataBundle) {
          console.log(dataBundle);
          deferred.resolve({
            org: dataBundle[0],
            group: dataBundle[1]
          });
        }).catch(function (error) {
          deferred.reject(error);
        });

        return deferred.promise;
      }

      UserInvitationService.showInvitationDialog(dataBundle.toUser, dataBundle, options)
        .then(function (res) {
          deferred.resolve(res);
        }).catch(function (error) {
          deferred.reject(error);
        });
      fetchDataForInvitationPost();

      return deferred.promise;
    }

    function replyToInvitationToJoinOrganisation(post, $event) {
      var deferred = $q.defer();

      if (!post.toUser || !post.organization) {
        return Dialog.alert('Invalid post data found!');
      }

      fetchData(post).then(function (dataBundle) {
	      var org = dataBundle.org;
        if (!dataBundle.user || !dataBundle.org) {
          return Dialog.alert('Unable to fetch post data.');
        }
        UserInvitationService.showInvitationDialog(dataBundle.user, {
          org: dataBundle.org,
          post: post,
          invitationDialogTemplateUrl: 'app/modules/user-invite/templates/user-invitation.dialog.tpl.html',
	        action: {
		        viewOrganisation: function () {
			        "use strict";
			        State.transitionTo('root.app.org-dashboard.orgInfo', {
				        orgId: org.id
			        })
		        }
	        }
        }, {
          $event: $event
        }).then(function (res) {
          deferred.resolve(res);
        }).catch(function (error) {
	        console.log(error);
          deferred.reject(error);
        })
        ;
      });

      function onSendReplySuccess(res) {
        Dialog.showAlert({
          title: "",
          content: res.respMsg,
          ok: LANG.BUTTON.OK
        }).then(function () {
          deferred.resolve(res);
        });
      }

      function onSendReplyError(error) {
        Dialog.showAlert({
          title: "",
          content: error.respMsg,
          ok: LANG.BUTTON.OK
        }).then(function () {
          deferred.reject(error);
        });
      }

      function onSendComplete(res) {
      }

      return deferred.promise;
    }
    
    
    function replyToInvitationToJoinEvents(post, $event) {
//    	
    	var deferred = $q.defer()
    	, fromUserModel, toUserModel
    	, event = post.eventSchedulerProfileResponseVO
    	, eventId,org = post.organization, group = post.group;

	    if (!post.fromUser || !post.eventSchedulerProfileResponseVO) {
		    return Dialog.alert('Unable to fetch post data.');
	    }

	    eventId = event.id;

      if(!DataProvider.resource.User.get(post.fromUser.id)) {
        DataProvider.resource.User.inject(post.fromUser);
      }
      if(!DataProvider.resource.User.get(post.toUser.id)) {
        DataProvider.resource.User.inject(post.toUser);
      }
      fromUserModel = DataProvider.resource.User.get(post.fromUser.id);
      toUserModel = DataProvider.resource.User.get(post.toUser.id);

      UserInvitationService.showInvitationDialog(fromUserModel, {
    	event: event,
        post: post,
        toUser: toUserModel,
        invitationDialogTemplateUrl: 'app/modules/user-invite/templates/user-invite-to-event.dialog.html',
      }, {
        locals: {
	        action: {
		        viewEvents: function() {
		        	 "use strict";
		        	 return post.toggleRead(true)
						.then(function () {
							deferred.resolve();
						}).catch(function (error) {
							deferred.reject(error);
					      });
		        },
		        viewEventDetails: function() {

		        	if (post.group != null) {
		        		State.transitionTo('root.app.group-dashboard.groupEvents', {
		        			orgId: parseInt(post.organization.id),
		        			groupId: parseInt(post.group.id)
		        		});
		        	} else {
			        	State.transitionTo('root.app.org-dashboard.orgSchedule', {
			        		orgId: parseInt(post.organization.id)
			        	});
		        	}
		        }
	        }
        },
        $event: $event
      }).then(function (res) {
        deferred.resolve(res);
      }).catch(function (error) {
        deferred.reject(error);
      })
      ;
        return deferred.promise;
      }

    function replyToInvitationToJoinJob(post, $event) {
      var deferred = $q.defer()
        , fromUserModel
        , toUserModel
	      , job = post.job
	      , jobId
	      ;

	    if (!post.fromUser || !post.job) {
		    return Dialog.alert('Unable to fetch post data.');
	    }

	    jobId = job.id;

	    if(!DataProvider.resource.Job.get(jobId)) {
		    DataProvider.resource.Job.inject(job);
	    }
	    job = DataProvider.resource.Job.get(jobId);

      if(!DataProvider.resource.User.get(post.fromUser.id)) {
        DataProvider.resource.User.inject(post.fromUser);
      }
      if(!DataProvider.resource.User.get(post.toUser.id)) {
        DataProvider.resource.User.inject(post.toUser);
      }
      fromUserModel = DataProvider.resource.User.get(post.fromUser.id);
      toUserModel = DataProvider.resource.User.get(post.toUser.id);

      UserInvitationService.showInvitationDialog(fromUserModel, {
        job: job,
        post: post,
        toUser: toUserModel,
        invitationDialogTemplateUrl: 'app/modules/job/templates/job-invitation.dialog.tpl.html',
      }, {
        locals: {
	        action: {
		        viewJobDetails: function() {
			        State.transitionTo('root.app.job-view.jobProfile', {
				        jobId: jobId
			        })
		        }
	        }
        },
        $event: $event
      }).then(function (res) {
        deferred.resolve(res);
      }).catch(function (error) {
        deferred.reject(error);
      })
      ;

      //Dialog.alert("Work in Progress :)")
      //  .then(function() {
      //    deferred.resolve();
      //  })
      //  .catch(function() {
      //    deferred.reject();
      //  })
      //  ;

      //UserInvitationService.showInvitationDialog()
      return deferred.promise;
    }

    function fetchData(post) {
      var deferred = $q.defer();
      var invitee = post.toUser;
      var org = post.organization;
      var orgData = DataProvider.resource.Organisation.get(org.id),
        userData = DataProvider.resource.Organisation.get(invitee.id)
        ;

      if (!orgData || !userData) {
        blockUI.start();
      }
      return $q.all([
        loadUser(invitee.id),
        loadOrg(org.id),
        //loadPostData(post.id)
      ]).then(function (promises) {
        blockUI.stop();
        var user = promises[0],
          org = promises[1]
        //postDetails = promises[1]
          ;

        return {
          user: user,
          org: org,
          //postDetails: postDetails
        }
      }).catch(function (error) {
        blockUI.stop(error.respMsg || "Error fetching data.", {
          status: 'isError'
        });
        return error;
      });


      return deferred.promise;
    }

    function loadPostData(id) {
      return DataProvider.resource.Post.find(id, {bypassCache: true})
    }

    function loadOrg(id) {
      var isOrgDataAvilable = DataProvider.resource.Organisation.get(id);
      return DataProvider.resource.Organisation[isOrgDataAvilable ? 'get' : 'find'](id);
    }

    function loadUser(id) {
      var isUserDataAvilable = DataProvider.resource.User.get(id);
      return DataProvider.resource.User[isUserDataAvilable ? 'get' : 'find'](id);
    }

    function loadGroupData(orgId, groupId) {
      "use strict";
      var isGroupDataAvilable = DataProvider.resource.Group.get(groupId);
      return DataProvider.resource.Group[isGroupDataAvilable ? 'get' : 'find'](groupId, {
        params: {
          orgId: orgId,
          grpId: groupId
        }
      });
    }
  }

})();