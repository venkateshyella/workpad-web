
(function () {

	var appConstants = angular.module('app.constants');

	var SERVICE_ENDPOINT = {
		PROD: {
			NAME: "",
			//BASE_URL: mobos.Platform.isWebView()
			//	? "http://52.8.9.35/ww"
			//	: "http://52.8.9.35/ww-app",
			BASE_URL: "https://prdws.workpadpte.com/v1.0.4",
			BOSH_ENDPOINT: "https://wpchat.workpadpte.com/http-bind/",
			X_API_KEY : "RNAttDoyvPGu2WxdctT58e0BQcfkhuWhxBv4YHQRQgI=",
			MOBILE_REDIRECT: {
				android: "https://play.google.com/store/apps/details?id=com.workpadpte.workpad",
				ios: "https://itunes.apple.com/us/app/workpad/id1204091863"
			},
			JITSI_CONF_OPTIONS : {
			    hosts: {
			        domain: 'wptalk.workpadpte.com',
			        muc: 'conference.wptalk.workpadpte.com', 
			        anonymousdomain: 'guest.wptalk.workpadpte.com',
			    },
			    bosh: 'https://wptalk.workpadpte.com/http-bind', 
			    clientNode: 'http://jitsi.org/jitsimeet'
			}
		},
		UAT: {
			NAME: "UAT",
			BASE_URL: "https://uatws.workpadpte.com:9443/v1.0.4", //"http://52.8.31.133/ww",
			BOSH_ENDPOINT: "https://uatws.workpadpte.com:7443/http-bind/", //"http://52.8.31.133:443/http-bind/",
			X_API_KEY : "RNAttDoyvPGu2WxdctT58e0BQcfkhuWhxBv4YHQRQgI=",
			MOBILE_REDIRECT: {
				android: "https://play.google.com/store/apps/details?id=com.workpadpte.workpad",
				ios: "https://itunes.apple.com/us/app/workpad/id1204091863"
			},
			JITSI_CONF_OPTIONS : {
			    hosts: {
			        domain: 'uatwptalk.workpadpte.com',
			        muc: 'conference.uatwptalk.workpadpte.com', 
			        anonymousdomain: 'guest.uatwptalk.workpadpte.com',
			    },
			    bosh: "https://uatwptalk.workpadpte.com/http-bind", //'https://104.196.96.140/http-bind', 
			    clientNode: 'http://jitsi.org/jitsimeet'
			}
		},
	
		SIT: {
			NAME: "SIT",
			BASE_URL: "https://sitws.workpadpte.com:9443/v1.0.4", //"http://52.8.9.35/ww",
			BOSH_ENDPOINT: "https://sitws.workpadpte.com/http-bind/", //"http://52.8.9.35:1443/http-bind/",
			X_API_KEY : "RNAttDoyvPGu2WxdctT58e0BQcfkhuWhxBv4YHQRQgI=",
			MOBILE_REDIRECT: {
				android: "http://mobipasskit.com/workwise_sit",
				ios: "http://mobipasskit.com/workwise_sit"
			},
			JITSI_CONF_OPTIONS : {
			    hosts: {
			        domain: 'sitwptalk.workpadpte.com',
			        muc: 'conference.sitwptalk.workpadpte.com', 
			        anonymousdomain: 'guest.sitwptalk.workpadpte.com',
			    },
			    bosh: "https://sitwptalk.workpadpte.com/http-bind", //'https://52.53.250.143/http-bind', 
			    clientNode: 'http://jitsi.org/jitsimeet'
			}
		},
		DEV: {
			NAME: "DEV",
			BASE_URL: "http://10.0.0.87:8090/ww",
			BOSH_ENDPOINT: "http://10.0.0.234:7070/http-bind/",
			X_API_KEY : "RNAttDoyvPGu2WxdctT58e0BQcfkhuWhxBv4YHQRQgI=",
			MOBILE_REDIRECT: {
				android: "",
				ios: ""
			},
			JITSI_CONF_OPTIONS : {
				    hosts: {
				        domain: '104.196.96.140',
				        muc: 'conference.104.196.96.140', 
				        anonymousdomain: 'guest.104.196.96.140',
				    },
				    bosh: 'https://104.196.96.140/http-bind', 
				    clientNode: 'http://jitsi.org/jitsimeet'
				}
		}
	};

	var defaultEndpoint = SERVICE_ENDPOINT.SIT;

	appConstants.value("DEFAULT_ENDPOINT", defaultEndpoint);
	appConstants.value("BASE_URL", defaultEndpoint.BASE_URL);
	appConstants.value("BOSH_ENDPOINT", defaultEndpoint.BOSH_ENDPOINT);
	appConstants.constant("X_API_KEY", defaultEndpoint.X_API_KEY);
	appConstants.constant("JITSI_CONF_OPTIONS", defaultEndpoint.JITSI_CONF_OPTIONS);
	appConstants.provider("URL", URLProvider);
	
	function URLProvider() {

		var provider = {
			setBaseUrl: _resetBaseUrl,
			$get: ['BASE_URL', 'BOSH_ENDPOINT', URLFactory]
		};
		var URLService = {
			resetBaseUrl: _resetBaseUrl
		};

		function _resetBaseUrl(baseUrl, boshEndpoint) {
			if (baseUrl) {
				//appConstants.value("BASE_URL", baseUrl);
				_curr_BASE_URL = baseUrl;
			}
			if (boshEndpoint) {
				_curr_BOSH_ENDPOINT = boshEndpoint;
			}
			_updateURLS(_curr_BASE_URL, _curr_BOSH_ENDPOINT);
		}

		function URLFactory(BASE_URL, BOSH_ENDPOINT) {

			URLService.initialize = initialize;
			return URLService;

			function initialize(savedBaseURL, saved_BOSH_ENDPOINT) {
				"use strict";
				if (angular.isString(savedBaseURL)) {
					_curr_BASE_URL = savedBaseURL;
				} else {
					_curr_BASE_URL = BASE_URL;
				}
				if (saved_BOSH_ENDPOINT) {
					_curr_BOSH_ENDPOINT = saved_BOSH_ENDPOINT;
				} else {
					_curr_BOSH_ENDPOINT = BOSH_ENDPOINT;
				}
				_updateURLS(_curr_BASE_URL, _curr_BOSH_ENDPOINT);
			}
		}

		var _curr_BASE_URL = null
			, _curr_BOSH_ENDPOINT = null
			;

		function _updateURLS(BASE_URL, BOSH_ENDPOINT) {
			URLService.BASE_URL = BASE_URL;

			URLService.BOSH_SERVICE_ENDPOINT = BOSH_ENDPOINT;

			URLService.PING = BASE_URL + "/ping/ping.ws";

			URLService.NOTIFICATION_COUNT = BASE_URL + "/post/count.ws";

			URLService.LOGIN = BASE_URL + "/auth/login.ws";

			URLService.REGISTER = BASE_URL + "/reg/step1.ws";

			URLService.RECOVER = BASE_URL + "/auth/temppassword.ws";

			URLService.UPDATE_PASSWORD = BASE_URL + "/auth/updatepassword.ws";

			URLService.LOGOUT = BASE_URL + "/auth/logout.ws";

			URLService.GET_PROFILE = BASE_URL + "/user/getprofile.ws";

			URLService.UPDATE_PROFILE = BASE_URL + "/user/updateprofile.ws";

			URLService.UPLOAD_FILE = BASE_URL + "/img/upload.ws";

			URLService.UPLOAD_FILE_META = BASE_URL + "/img/update.ws";

			URLService.GET_PIC = BASE_URL + "/img/get.ws";

			URLService.COUNTRY_LIST = BASE_URL + "/country/list.ws";

			URLService.CITY_LIST = BASE_URL + "/city/list.ws";

			URLService.ORG_GROUPS = BASE_URL + "/org/group/list.ws";

			URLService.USER_SEARCH = BASE_URL + "/user/searchlist.ws";
			
			URLService.DASHBOARD_INFO = BASE_URL + "/dashboard/info.ws";


			// Org
			URLService.ORG_DELETE = BASE_URL + "/org/delete.ws";
			
			URLService.ORG_EVENT_DELETE = BASE_URL + "/event/delete.ws";
			
			URLService.ORG_EVENT_OWNED_LIST = BASE_URL + "/event/owned-list.ws";

			URLService.ADD_MEMBER_TO_ORG = BASE_URL + "/org/addmember.ws";

			URLService.ORG_MEMBER_SEARCH = BASE_URL + "/org/member/search.ws";
			
			URLService.ORG_MEMBER_STATUS = BASE_URL + "/org/invite/list.ws";
			
			URLService.ORG_GRP_MEMBER_STATUS = BASE_URL + "/org/group/invite/list.ws";
			
			URLService.EVENT_SEARCH_ORG_OR_GROUP = BASE_URL + "/event/invitation/search-org-groups.ws";
			
			URLService.EVENT_SEARCH_GROUP_MEMBERS = BASE_URL + "/event/invitation/search-group-members.ws";
			
			URLService.EVENT_SEARCH_ORG_MEMBERS = BASE_URL+"/event/invitation/search-org-members.ws";


			// Post
			// ---------
			// Create Post
			URLService.CREATE_POST = BASE_URL + "/post/create.ws";

			// Post list
			URLService.LIST_POST = BASE_URL + "/post/list.ws";

			// Post details
			URLService.VIEW_POST = BASE_URL + "/post/view.ws";

			// Update Post
			URLService.POST_UPDATE = BASE_URL + "/post/update.ws";

			// Post Audit List
			URLService.LIST_POST_AUDIT = BASE_URL + "/audit/notification/list.ws";
			
			URLService.PAYMENT_TOKEN = BASE_URL + "/payment/token.ws";
			
			URLService.PAYMENT_CONFIRM = BASE_URL + "/payment/confirm.ws";
			
			URLService.FORM_AUDIT = BASE_URL + "/audit/job/form/list.ws";
			
			



      // Audit
      //---------------
      // Fetch audit log page
      /*
       #162
       GET /audit/list.ws?
       params:
       - catId: Id of the Org/Group/Job/Task
       - catType:
       For Organization catType = 1;
       For Group catType = 2;
       For Job catType = 3;
       For Task catType = 4;
      * */
      URLService.AUDIT_LIST = BASE_URL + "/audit/list.ws";

			// Organisation
			// ---------------
			// Fetch Org members
			URLService.ORG_MEMBERS = BASE_URL + "/org/member/list.ws";

			// Fetch Org Jobs
			URLService.ORG_JOBS = BASE_URL + "/org/job/list.ws";
			
			URLService.ORG_VIEW = BASE_URL+"/org/view.ws";
			
			URLService.ORG_GROUP_VIEW = BASE_URL+"/org/group/view.ws";
			
			URLService.JOB_FIND = BASE_URL+"/job/find.ws";
			
			URLService.JOB_TASK_VIEW = BASE_URL+"/job/task/view.ws";

			// Fetch Org Jobs audit logs
			/*
			 #165
			 Get Organization Jobs Audit Logs :
			 GET /audit/org/job/list.ws
			 params:
			 - orgId: Organisation id
			 */
			URLService.ORG_JOBS_AUDIT = BASE_URL + "/audit/org/job/list.ws";
			
			URLService.ORG_EVENTS_AUDIT = BASE_URL + "/audit/event/list.ws";
			
			URLService.ORG_EVENTS = BASE_URL + "/event/list.ws";
			
			URLService.EVENT_TYPES = BASE_URL + "/event/types/list.ws";

			// User Invite to Org
			URLService.USER_INVITE = BASE_URL + "/org/invite.ws";

			URLService.USER_INVITE_TO_ORG = BASE_URL + "/org/invite.ws";

			URLService.EJECT_USER_FROM_ORG = BASE_URL + "/org/member/delete.ws";

			URLService.USER_INVITE_TO_GROUP = BASE_URL + "/org/group/invite.ws";

			URLService.REPLY_INVITE_TO_ORG = BASE_URL + "/org/invite/confirm.ws";
			
			
			URLService.REPLY_INVITE_TO_EVENT = BASE_URL + "/event/confirm.ws";

			// Data Vault
			URLService.VAULT_FILE_DELETE = BASE_URL + "/data/delete.ws";

			URLService.VAULT_COPY_DESTINATION_LIST = BASE_URL + "/org/grp-job.ws";
			

						URLService.VAULT_AUDIT_LIST = BASE_URL + "/audit/data/list.ws";

			// File Rename
			URLService.VAULT_FILE_RENAME = BASE_URL + "/data/rename.ws";

			// File Copy
			URLService.VAULT_FILE_COPY = BASE_URL + "/data/copy.ws";

			// Org Data Vault
			URLService.ORG_FILE_UPLOAD = BASE_URL + "/org/vault/upload.ws";

			URLService.ORG_FILE_DOWNLOAD = BASE_URL + "/org/vault/download.ws";

			URLService.ORG_FILE_DELETE = BASE_URL + "/org/vault/delete.ws";

			URLService.ORG_VAULT_FILE_LIST = BASE_URL + "/org/vault/view.ws";

			URLService.ORG_VAULT_AUDIT_LIST = BASE_URL + "/audit/data/list.ws";

			URLService.ORG_VAULT_OWNER_FILE_LIST = BASE_URL + "/org/vault/owned-list.ws";

			URLService.ORG_GET_FILE_PERMISSIONS = BASE_URL + "/org/vault/users.ws";

			URLService.ORG_PUT_FILE_PERMISSIONS = BASE_URL + "/org/vault/users.ws";
			
			URLService.VAULT_CREATE_FOLDER = BASE_URL+"/data/folder/create.ws";
			
			URLService.VAULT_DELETE_FOLDER = BASE_URL+"/data/folder/delete.ws";
			
			URLService.VAULT_FOLDERS_LIST = BASE_URL+"/data/folder/list.ws";
			
			URLService.VAULT_OWNED_FOLDERS_LIST = BASE_URL+"/data/folder/owned-list.ws";
			
			URLService.VAULT_FOLDER_FILES_LIST = BASE_URL+"/data/files/list.ws";
		

			// Reply to Invitation to join group
			URLService.REPLY_INVITE_TO_GRP = BASE_URL + "/org/group/invite/confirm.ws";

			URLService.EJECT_USER_FROM_GRP = BASE_URL + "/org/group/member/delete.ws";

			// Group
			URLService.CREATE_GROUP = BASE_URL + "/org/group/create.ws";

			URLService.APPROVE_CREATE_GROUP = BASE_URL + "/org/group/confirm.ws";

			URLService.DELETE_GROUP = BASE_URL + "/org/group/delete.ws";

			URLService.UPDATE_GROUP = BASE_URL + "/org/group/update.ws";

			URLService.GROUP_MEMBERS = BASE_URL + "/org/group/member/list.ws";

			URLService.GROUP_JOBS = BASE_URL + "/org/group/job/list.ws";

			URLService.GROUP_JOBS_AUDIT = BASE_URL + "/audit/group/job/list.ws";

			URLService.GROUP_MEMBER_SEARCH = BASE_URL + "/org/group/search.ws";

			URLService.GROUP_SUBGROUPS = BASE_URL + "/org/group/subgroup/list.ws";

			// Group Vault Services
			URLService.GROUP_FILE_UPLOAD = BASE_URL + "/org/group/vault/upload.ws";

			URLService.GROUP_FILE_DOWNLOAD = BASE_URL + "/org/vault/download.ws";

			URLService.GROUP_FILE_DELETE = BASE_URL + "/org/vault/delete.ws";

			URLService.GROUP_GET_FILE_PERMISSIONS = BASE_URL + "/org/group/vault/users.ws";

			URLService.GROUP_PUT_FILE_PERMISSIONS = BASE_URL + "/org/group/vault/users.ws";

			URLService.GROUP_VAULT_FILE_LIST = BASE_URL + "/org/group/vault/view.ws";

			URLService.GROUP_VAULT_OWNER_FILE_LIST = BASE_URL + "/org/group/vault/owned-list.ws";


			// JOBS ---------------

			// Job Advertisement
			// Search job invitee groups
			URLService.JOB_INV_GROUP_SEARCH = BASE_URL + "/job/invitation/search-groups.ws";
			URLService.JOB_INV_ORG_AND_GROUP_SEARCH = BASE_URL + "/job/invitation/search-org-groups.ws";
			
			URLService.JOB_INV_STATUS = BASE_URL + "/job/invitation/list.ws";
			
			// Search job invitee members
			URLService.JOB_INV_MEMBER_SEARCH = BASE_URL + "/job/invitation/search-org-members.ws";

			// Search Job invitee group members
			URLService.JOB_INV_GROUP_MEMBER_LIST = BASE_URL + "/job/invitation/search-group-members.ws";

			// Job Advertise
			URLService.JOB_ADVERTISE = BASE_URL + "/job/advertise.ws";

			// Job Send Invitation
			URLService.JOB_INIVITE_CONTRIBUTOR = BASE_URL + "/job/invite.ws";

			// Job Accept Advertisement
			URLService.REPLY_ADVERTISEMENT_FOR_JOB = BASE_URL + "/job/invite/confirm.ws";

			// Job Accept Invitation
			URLService.REPLY_INVITE_TO_JOB = BASE_URL + "/job/invite/delegator/confirm.ws";

			// Job Lifecycle event
			URLService.JOB_TRIGGER_LIFECYCLE_EVENT = BASE_URL + "/job/lifecycle-event.ws";

			// Job Contributor List
			URLService.JOB_CONTRIBUTORS_LIST = BASE_URL + "/job/contributors/list.ws";

			// Job Advertisement Invited Members Pending List.
			URLService.JOB_ADV_INVITED_OWNERS_LIST = BASE_URL + "/job/invitation/invited-owners.ws";

			// Job Contributor Invited Members Pending List.
			URLService.JOB_CONTRIBUTOR_INVITED_LIST = BASE_URL + "/job/invitation/invited-delegators.ws?";

			// Job Activity History
			URLService.JOB_ACTIVITY_HISTORY = BASE_URL + "/job/history.ws";
			
			// Open Jobs audit list
			// #167
			// Get Work(User) Tab Audit Logs
			/*
			 GET /audit/work/list.ws
			 Params
			 - pageNumber: Integer
			 - pageSize: Integer
			 */
			URLService.OPEN_JOB_AUDIT_LIST = BASE_URL + "/audit/work/list.ws";

			// Job Data Vault
			URLService.JOB_VAULT_FILE_LIST = BASE_URL + "/job/vault/view.ws";

			URLService.JOB_VAULT_AUDIT_LIST = BASE_URL + "/audit/data/list.ws";

			URLService.JOB_FILE_UPLOAD = BASE_URL + "/job/vault/upload.ws";

			URLService.JOB_VAULT_OWNER_FILE_LIST = BASE_URL + "/job/vault/owned-list.ws";

			URLService.JOB_GET_FILE_PERMISSIONS = BASE_URL + "/job/vault/users.ws";

			URLService.JOB_FILE_DELETE = BASE_URL + "/job/vault/delete.ws";

			URLService.JOB_FILE_DOWNLOAD = BASE_URL + "/job/vault/download.ws";

			URLService.JOB_PUT_FILE_PERMISSIONS = BASE_URL + "/job/vault/users.ws";

			// Job Timesheet 
			URLService.JOB_TIMESHEET_CREATE = BASE_URL + "/job/timesheet/create.ws";

			// Job User List for Rating
			URLService.JOB_MEMBER_UNRATED_LIST = BASE_URL + "/job/user/skill/list.ws";

			// Job User Ratings submit
			URLService.JOB_MEMBER_RATING_SUBMIT = BASE_URL + "/job/rating/save.ws";

			// User
			// List all users
			URLService.GET_ALL_USERS = BASE_URL + "/user/list.ws";

			// Remove member
			URLService.JOB_MEMBER_REMOVE = BASE_URL + "/job/member/delete.ws";


			// Push Notification
			// Subscribe
			URLService.PUSH_NOTI_SUBSCRIBE = BASE_URL + "/user/notification/subscribe.ws";

			// Un-Subscription
			URLService.PUSH_NOTI_UNSUBSCRIBE = BASE_URL + "/user/notification/unsubscribe.ws";

      // Update Push notification preferences
      URLService.PUSH_NOTI_PREF_UPDATE = BASE_URL + "/user/notification/push/update.ws";

      // Fetch Push notification preferences
      URLService.FETCH_PUSH_NOTI_PREF = BASE_URL + "/user/notification/push/list.ws";


			// Chat History
			URLService.CHAT_HISTORY = BASE_URL + "/chat/list.ws";

			// Chat Summary
			URLService.CHAT_SUMMARY = BASE_URL + "/chat/summary.ws";
			
			//Update Chat Room Presence
			URLService.CHAT_UPDATE = BASE_URL + "/chat/update.ws";

			// Add New Skill
			URLService.ADDSKILL = BASE_URL + "/user/skill/list.ws";

			//Assigning Task to a contributor
			URLService.ASSIGN_TASK = BASE_URL + "/job/task/assign.ws";

			// Form Listing
			URLService.FORM_LIST = BASE_URL + "/job/form/list.ws";

			// JOB Form Submission
			URLService.JOB_FORM_SUBMIT = BASE_URL + "/job/form/submit.ws";

			URLService.JOB_FORM_CREATE = BASE_URL + "/job/form/create.ws";
			
			URLService.JOB_FORM_VIEW = BASE_URL + "/job/form/view.ws";
			
			URLService.JOB_FORM_UPDATE = BASE_URL + "/job/form/update.ws";

			// -----------------------------
			// --- Task --------------------
			// -----------------------------

			// Task Contributor Invitee Search
			URLService.TASK_CONTRIBUTOR_INVITEE_SEARCH = BASE_URL + "/job/task/contributor/search.ws";

			// Task Contributor send invitation
			// -------------------------------------
			// #153 Invite task members:
			// POST
			// @formatter:off
			/* body
			 {
			   "taskId" : 377, // id of th task
			   "sendToAll" : false,
			   "contributors" : [ // array of invitee users' ids
			      1,
			      50
			    ]
			 }

			*/
			// @formatter:on
			URLService.TASK_CONTRIBUTOR_SEND_INVITATION = BASE_URL + "/job/task/contributor/invite.ws";
			/* Response
			 */

			// Task Lifecycle event
			URLService.TASK_TRIGGER_LIFECYCLE_EVENT = BASE_URL + "/job/task/lifecycle-event.ws";


			// Task toggle block status field.
			// -------------------------------------
			// #161 Task Block/Unblock:
			// POST
			// @formatter:off
			/* body
			 {
			   "taskId":394, // id of the task
			   "blocked":false // boolean, set to true to block the task, false to unblock
			 }
			 */
			// @formatter:on
			URLService.TASK_TOGGLE_BLOCK = BASE_URL + "/job/task/confirm/start.ws";

			// Task contributor invitation reply
			URLService.REPLY_INVITE_FOR_TASK_CONTRIBUTOR = BASE_URL + "/job/task/contributor/invite/confirm.ws";

			// TASK Form Submission
			URLService.TASK_FORM_SUBMIT = BASE_URL + "/job/task/form/submit.ws";

			// Task Data Vault
			URLService.TASK_VAULT_FILE_LIST = BASE_URL + "/job/task/vault/view.ws";

			// Task Data Vault
			URLService.TASK_FILE_UPLOAD = BASE_URL + "/job/task/vault/upload.ws";

			// Task member list
			URLService.TASK_MEMBERS = BASE_URL + "/job/task/contributors/list.ws";
			
			URLService.TASK_MEMBERS_INVITEES_STATUS = BASE_URL + "/job/task/contributor/invite/list.ws";

			URLService.TASK_FILE_DOWNLOAD = BASE_URL + "/job/task/vault/download.ws";

			URLService.TASK_VAULT_OWNER_FILE_LIST = BASE_URL + "/job/task/vault/owned-list.ws";

			// Task member removal
			// -------------------------------------
			// #143 Task Member Remove
			// @formatter:off
			/*
			 {
			   "id":389, // Id of the Task
			   "taskAssignmentId":521 //
			 }
			 */
			// @formatter:on
			URLService.TASK_REMOVE_MEMBER = BASE_URL + "/job/task/member/delete.ws";


			URLService.FORM_FILE_UPLOAD = BASE_URL + "/file/upload.ws";

			URLService.FORM_FILE_DOWNLOAD = BASE_URL + "/file/download.ws";

			// Direct Message
			// Get all messages in a topic
			URLService.DM_GET_ALL_MESSAGES = BASE_URL + "/user/topic/messages.ws";
			
			URLService.DM_GET_ALL_MESSAGE_TOPICS = BASE_URL + "/user/topic/list.ws";

			// Send a message in a topic
			URLService.DM_SEND_MESSAGE = BASE_URL + "/user/topic.ws";
			
			//for event creation
			URLService.CREATE_EVENT = BASE_URL+"/event/create.ws";
			
			//Search memebers to add for event or related to event
			URLService.EVENT_SEARCH_MEMBER = BASE_URL+"/event/member/search.ws";
			

			
			URLService.UPDATE_EVENT = BASE_URL+"/event/update.ws";
			
			URLService.UPDATE_JOB_TEMPLATE = BASE_URL+"/job/template/update.ws";
			
			URLService.JOB_TEMPLATE_LIST = BASE_URL+"/job/template/list.ws";
			
			URLService.JOB_TEMPLATE_SEARCH_ORG_GROUP = BASE_URL+"/job/template/search-org-groups.ws";
			
			URLService.JOB_TEMPLATE_SEARCH_ORG_MEMBERS = BASE_URL+"/job/template/search-org-members.ws";
			
			URLService.JOB_TEMPLATE_SEARCH_GROUP_MEMBERS = BASE_URL+"/job/template/search-group-members.ws";
			
			URLService.JOB_TEMPLATE_AUDIT = BASE_URL+"/audit/template/list.ws";
			
			URLService.JOB_TEMPLATE_OWNED_LIST = BASE_URL+"/job/template/owned-list.ws";
			
			URLService.JOB_TEMPLATE_DELETE = BASE_URL+"/job/template/delete.ws";
			
			URLService.JOB_TEMPLATE_CLOSED_JOBS_LIST = BASE_URL+"/job/closed-list.ws";
			
			URLService.EXISTING_JOB_TEMPLATE_INFO = BASE_URL+"/job/template/job-info.ws";
			
			URLService.SUPPORT_FEEDBACK = BASE_URL+"/support/feedback/create.ws";
			
			URLService.MEETING_CREATE = BASE_URL+"/meeting/create.ws?";
			
			URLService.MEETING_UPDATE = BASE_URL+"/meeting/update.ws?";
			
			URLService.OWNED_MEETINGS_LIST = BASE_URL+"/meeting/owned-list.ws?";
			
			URLService.MEETING_SEARCH = BASE_URL+"/meeting/member/search.ws";
			
			URLService.MEETING_JOIN = BASE_URL+"/meeting/join.ws";
			
			URLService.MEETING_START = BASE_URL+"/meeting/start.ws";
			
			URLService.MEETING_END = BASE_URL+"/meeting/end.ws";
			
			URLService.MEETING_DELETE = BASE_URL+"/meeting/delete.ws";
			
			URLService.MEETING_AUDIT = BASE_URL+"/audit/meeting/list.ws";
			
			URLService.MEETING_VIEW = BASE_URL+"/meeting/view.ws";
			
			URLService.MEETING_MEMBER_EVENT = BASE_URL+"/meeting/member/event-log.ws";
			
			URLService.MEETING_MEMBER_ADD = BASE_URL+"/meeting/member/invite.ws";
			
			URLService.MEETING_EXTEND = BASE_URL+"/meeting/extend-time.ws";
			
			URLService.SUBSCRIBED_ITEMS_LIST = BASE_URL+"/org/item/list.ws";
			
			URLService.PLACE_ORDER = BASE_URL+"/payment/place-order.ws";
			
			URLService.CONFIRM_ORDER = BASE_URL+"/payment/confirm-order.ws";
			
			URLService.OWNED_ORG_LIST = BASE_URL+"/org/owned/list.ws";
			
			URLService.ROOM_STATUS = BASE_URL+"/meeting/room/status.ws";
			
			//People-Invites related endpoints
			
			URLService.PEOPLE_SEARCH = BASE_URL+"/user/people/search.ws";
			
			URLService.PEOPLE_INVITE = BASE_URL+"/user/people/invite.ws";
			
			URLService.PEOPLE_TAG_UNTAG = BASE_URL+"/user/people/tag.ws";
			
			URLService.PEOPLE_TAG_LIST = BASE_URL+"/user/people/tag/list.ws";
			
			URLService.PEOPLE_INVITES_LIST = BASE_URL+"/reg/invite/list.ws";
			
			URLService.CREATE_CHAT_THREAD = BASE_URL+"/chat/thread/create.ws";
			
			URLService.VIEW_CHAT_THREAD = BASE_URL+"/chat/thread/view.ws";
			
			URLService.LIST_CHAT_THREAD = BASE_URL+"/chat/thread/list.ws";
			
			URLService.CHAT_PROFILE = BASE_URL+"/chat/view.ws";
			
			URLService.TEMPLATE_LIST = BASE_URL+"/job/template/list.ws";
			
			URLService.TEMPLATE_LIST_ALL = BASE_URL+"/job/template/org/list.ws";
			
			URLService.GET_TEMPLATE_BY_ID = BASE_URL+"/job/template/view.ws";
			
			URLService.JOB_CREATE_USING_TEMPLATE = BASE_URL+"/job/create.ws";
			
			URLService.WP_AUDIT_ORG_LIST = BASE_URL+"/audit/org/list.ws";
			
			URLService.WP_AUDIT_SEARCH = BASE_URL+"/audit/search.ws";
			
			URLService.WP_AUDIT_MEMBER_LIST = BASE_URL+"/org/member/list.ws";
			
			URLService.WP_AUDIT_MEMBER_DELEGATE_ACCESS = BASE_URL+"/audit/org/member/delegate-access.ws";
			
			URLService.WP_AUDIT_LOOKUP_TYPES = BASE_URL+"/lookup/list.ws";
			
			URLService.WP_AUDIT_PROD_CHART_3_VIEW = BASE_URL+"/productivity/chart-view.ws";
			
		}

		return provider;
	}

})();
