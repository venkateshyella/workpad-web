/**
 * Created by Vikas on 14/12/16.
 */

;(function() {
  "use strict";

  var app = angular.module('app.modules')
      .service('MeetingPostHandler', [
        '$q', 'DataProvider',
        'Connect', 'URL', 'mDialog', 'blockUI', 
        'Lang','State','$mdDialog',
        MeetingPostHandler
      ])
  ;

  function MeetingPostHandler ($q, DataProvider
    , Connect, URL
    , Dialog, blockUI
    , Lang, State, $mdDialog) {

    var LANG = Lang.en.data;

    return {
      handle_attendMeetingRequest: handle_attendMeetingRequest
    };


    function handle_attendMeetingRequest(post, options) {
      var deferred = $q.defer();
      Dialog.show({
    	  targetEvent: options.targetEvent,
    	  templateUrl: 'app/modules/posts/templates/meetingPost.dialog.tpl.html',
    	  locals: {
    		  title: post.title,
    		  content: post.notificationDescription,
    		  ok: "Join",
    		  cancel: "Dismiss",
    		  LANG: LANG,
    		  org: post.organization,
    		  group: post.group,
    		  job: post.job,
    		  task: post.task,
    		  post:post,
    		  action: {
    			  viewMeetingsList: function() {
    				  var navRoute = _getMeetingRoute(post);
    				 // State.transitionTo(navRoute.name, {orgId : post.organization.id});
    				  
    				switch (navRoute.type) {
  					case 'ORGANIZATION':
  						State.transitionTo(navRoute.name, {orgId : post.organization.id});
  						break;
  					case 'GROUP':
  						State.transitionTo(navRoute.name, {orgId : post.organization.id, groupId : post.group.id });
  						break;
  					case 'JOB':
  						State.transitionTo(navRoute.name, {orgId : post.organization.id, jobId : post.job.id });
  						break;	
  					case 'TASK':
  						State.transitionTo(navRoute.name, {jobId : post.task.jobId, taskId : post.task.id });
  						break;	

  					default:
  						return false;
  					}
  				  
    				  
    				  $mdDialog.cancel();
    			  }
    		  }
    	  }
      
      }).then(function(res) {
        console.log(res);
        if(res == 'true') {
        	handleJoinResponse(true);
        } else {
        	handleJoinResponse(false);
        }
      }).catch(function() {
      });

      return deferred.promise;

      function handleJoinResponse(doJoin) {
        var progressMessage = doJoin
          ? "Joining conference..."
          : "";
        
        console.log("Joining meeting..."+doJoin);
        
        if(doJoin){
        	var navRoute = _getMeetingRoute(post);

        	if(!!navRoute){
        		blockUI.start(progressMessage);

        		State.transitionTo(navRoute.name, navRoute.params).then(function () {
        			updateViewPost();
        		});
        	}
        }else{
        	updateViewPost();
        }
       
      }
      
      function updateViewPost(){
    	  post.toggleRead(true)
			.then(function () {
				deferred.resolve();
			});
      }
      
      function _getMeetingRoute(item) {
			var route = {};
			
			if (!item.organization) {
				return null;
			}else if(item.organization && !item.group && !item.job && !item.task){
				route.name = 'root.app.org-dashboard.orgMeeting';
				route.params = {
						orgId: item.organization.id,
						meetingId : item.meeting.id
				}
				
				route.type = "ORGANIZATION";
				
			}else if(item.organization && item.group){
				route.name = 'root.app.group-dashboard.groupMeeting';
				route.params = {
						orgId: item.organization.id,
						groupId: item.group.id,
						meetingId : item.meeting.id
				}
				
				route.type = "GROUP";
				
			}else if(item.organization && item.job){
				route.name = 'root.app.job-view.jobTalk';
				route.params = {
						orgId: item.organization.id,
						jobId: item.job.id,
						meetingId : item.meeting.id
				}
				
				route.type = "JOB";
			} else if(item.organization && item.task){
				route.name = 'root.app.task-dashboard.taskTalk';
				route.params = {
						jobId: item.task.jobId,
						taskId: item.task.id,
						meetingId : item.meeting.id
				}
				
				route.type = "TASK";
			}
			
			
			return route;
			
		}

      
      
    }

  }

})();
