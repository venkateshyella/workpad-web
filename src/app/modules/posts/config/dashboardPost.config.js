/**
 * Created by sudhir on 8/12/15.
 */

;(function() {
	"use strict";

	angular.module('app.modules')
		.config(['PostServiceProvider', 'APP_POST', function(PostServiceProvider, APP_POST) {
			PostServiceProvider.definePost([
				APP_POST.TYPE.POST_JOB_ADVERTISEMENT,
				APP_POST.TYPE.POST_INVITATION_JOIN_JOB,
				APP_POST.TYPE.POST_INVITATION_TO_GROUP_NOTIFY_INVITEE,
				APP_POST.TYPE.POST_INVITATION_TO_ORGANISATION_NOTIFY_INVITEE
			], {
				templateUrl: 'app/modules/posts/templates/invitationPostItem.partial.html'
			})
		}]);

})();