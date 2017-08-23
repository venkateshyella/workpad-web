/**
 * Created by sudhir on 5/5/15.
 */

// constant.js

(function () {

  var APP_INFO = {
    name: "Workpad",
    version: {
      number: 0.10,
      
      web: "Workpad-1.4.0",

      numberString: "0.1.0.Beta-2.6.5",
      //name: "0.1.0.Beta-2.5.2"
      name: "Workpad-0.1.0.Beta-2.6.5-beta-1"

      //numberString: "0.1.0.Beta-2.1.6",
      //numberString: "0.1.0.Beta-2.4.4",
      //name: "Workpad-0.1.0.Beta-2.4.4-beta-4"
    }
  };

  var SAVED_PREFERENCES_KEY = {
    BASE_URL: "_url_BASE_URL",
    BOSH_ENDPOINT: "_url_BOSH_ENDPOINT",
    ENABLE_DEBUG: "_debug_enabled",
    USER: "_loginCred",
    PUSH_NOTIFICATION: '_pushNotification'
  };

  var APP_DATA_CSS = {
    _data_avail: 'align-items-start',
    _data_na: 'align-items-center'
  };

  var APP_ROUTES = {
    ROOT: {name: "root", url: "/app"},
    BOOT: {name: "root.boot", url: "/boot"},

    // Auth routes
    AUTH: {name: "root.auth", url: "/auth"},
    AUTH_STATE: {
      name: "root.auth.state", url: "/:state"
    },

    // Module routes
    MODULE_ROOT: {
      name: "root.module", url: "/home"
    },
    MODULE_TYPE: {
      name: "root.module.name", url: "/:name/:req?id"
    }
  };

  var APP_BROADCAST = {
    BOOT: {
      START: "0",
      COMPLETE: "1"
    },
    LANG: {
      UPDATE: "lang-update",
      UPDATE_FAIL: "lang-update-fail"
    },
    SETTINGS_UPDATE: {
      PUSH_NOTIFICATION: "PUSH"
    },
    NEW_PUSH_NOTIFICATION: "_new_noti",
    IOS_DOCUMENT_IMPORT: 'ios-doc_import'
  };

  var APP_STATUS = {
    PRE_RUN: "pr"
  };

  var LOCALE_URI = {
    en: "assets/lang/en.json"
  };

  var HTTP = {
    DEFAULT_TIMEOUT: 20000
  };

  var IMAGE_PRESET = {
    COVER: {
      HEIGHT: 768,
      WIDTH: 1536
    },
    PROFILE: {
      HEIGHT: 768,
      WIDTH: 768
    }
  };
  var EVENT_TYPE = {
		  ADHOC:-601,
		  TALK:-602,
		  SCHEDULE_JOB:-603
  }
  var APP_URL_SCHEMA = {
    IOS_DOCUMENT_IMPORT: '^file:\/\/\/(.*)Documents\/Inbox\/(.*)$'
  };

  var APP_POST = {
    TYPE: {

      // Notify the organisation creator that the organisation was successfully created.
      POST_NOTIFY_CREATE_ORG: 2,

      // Invitation post for the user (invitee) to join an organisation.
      POST_INVITATION_TO_ORGANISATION_NOTIFY_INVITEE: -40,
      
      POST_TYPE_EVENT_REMAINDER_NOTIFICATION :-228,

      // Notification post for the Organisation admin
      // who sent the invitation to a user to join his organisation
      //POST_INVITATION_TO_ORGANISATION_NOTIFY_INVITER: -41,

      // Notification post for the user
      // that the user has been removed from the organisation
      POST_NOTIFICATION_ORG_MEMBERSHIP_REMOVE: -46,

      // Notify inviter
      // that user(invitee) has accepted the invitation.
      POST_NOTIFICATION_INVITATION_TO_ORGANISATION_REPLY_ACCEPT: -43,

      // Notify inviter
      // that user(invitee) has rejected the invitation.
      POST_NOTIFICATION_INVITATION_TO_ORGANISATION_REPLY_REJECT: -45,

      // Notify Organisation admin
      // that a new file has been added in the org data vault.
      POST_NOTIFICATION_ORG_VAULT_FILE_ADD: -81,

      // Notify Organisation admin
      // that a file has been deleted from the org data vault.
      POST_NOTIFICATION_ORG_VAULT_FILE_DEL: -86,

      POST_NOTIFICATION_ORG_VAULT_FILE_RENAME: -91,

      // Post requesting organisation admin to respond (Accept/Reject)
      // to a request to create a group
      POST_REQ_TO_CREATE_GROUP: -51,

      // Notify the group creator that the group was successfully created.
      POST_NOTIFY_CREATE_GROUP: -54,

      // Notify the group creator that the group create request was denied.
      POST_NOTIFY_CREATE_GROUP_REJECT: -56,

      // Invitation post for user(invitee) to join a group
      POST_INVITATION_TO_GROUP_NOTIFY_INVITEE: -57,

      // Notification post for inviter
      // that the user(invitee) has accepted the invitation to join the group.
      POST_NOTIFICATION_GROUP_INVITATION_REPLY_ACCEPT: -62,

      // Notification post for inviter
      // that the user(invitee) has rejected the invitation to join the group.
      POST_NOTIFICATION_GROUP_INVITATION_REPLY_REJECT: -60,

      // Notify Group admin
      // that a new file has been added to the group vault.
      POST_NOTIFICATION_GROUP_VAULT_FILE_ADD: -83,

      // Notify Group admin
      // that a file has been deleted from the group data vault.
      POST_NOTIFICATION_GROUP_VAULT_FILE_DEL: -88,

      POST_NOTIFICATION_GROUP_VAULT_FILE_RENAME: -92,


      // POST_JOB_ADVERTISEMENT
      POST_JOB_ADVERTISEMENT: -70,

      // Notification Job Advertisement Reply Accept
      POST_NOTIFICATION_JOB_ADVERTISEMENT_REPLY_ACCEPT: -71,

      // Notification Job Advertisement Reply Reject
      POST_NOTIFICATION_JOB_ADVERTISEMENT_REPLY_REJECT: -72,

      // Invitation post for joining a Job as a delegator.
      POST_INVITATION_JOIN_JOB: -73,

      //
      POST_NOTIFICATION_JOB_OWNER_REMOVAL: -216,

      // Notification post for the Job owner
      // that the user has joined the job as delegator
      POST_NOTIFICATION_JOB_DELEGATOR_REPLY_ACCEPT: -74,

      // Notification post for the Job owner
      // that the user has rejected the invitation to join the job as a delegator.
      POST_NOTIFICATION_JOB_DELEGATOR_REPLY_REJECT: -75,
      
      POST_NOTIFICATION_JOB_FINISH_PERCENTAGE: -240,

      POST_TYPE_AUTOMATION_JOB_SUCCESS_NOTIFICATION: -243,
      
      POST_TYPE_JOB_TIMESHEET_REMAINDER_NOTIFICATION: -241,
      
      POST_TYPE_JOB_REVIEW_RATE_REMAINDER_NOTIFICATION: -242,
      // Notify Job Owner, Originator
      // that a new file has been added to the job data vault.
      POST_NOTIFICATION_JOB_VAULT_FILE_ADD: -77,

      // Notify Job Owner, Originator
      // that a file has been removed from the job data vault.
      POST_NOTIFICATION_JOB_VAULT_FILE_DEL: -78,

      POST_NOTIFICATION_JOB_VAULT_FILE_RENAME: -79,

      // Notification post Job Lifecycle Event : Start
      POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_START: -103,

      // Notification post Job Lifecycle Event : Stopped
      POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_STOP: -104,

      // Notification post Job Lifecycle Event : Resume
      POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_RESUME: -105,

      POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_FINISH: -106,

      // Notification post Job Lifecycle Event : Stopped
      POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_CANCEL: -109,

      POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_REJECT: -108,

      // Notification post Job Lifecycle Event : Stopped
      POST_NOTIFICATION_JOB_LIFECYCLE_EVENT_CLOSE: -110,

      // New Task created notification
      POST_NOTIFICATION_TASK_CREATED: -201,

      // Notification to user (?)
      // about a task being assigned to a user.
      POST_NOTIFICATION_TASK_ASSIGNMENT: -202,

      // Invitation Notification post for Task contributor invitation
      POST_NOTIFICATION_TASK_CONTRIBUTOR_INVITATION: -221,

      POST_NOTIFICATION_TASK_CONTRIBUTOR_INVITATION_REPLY_ACCEPT: -222,

      POST_NOTIFICATION_TASK_CONTRIBUTOR_INVITATION_REPLY_REJECT: -223,

      // Notification post TASK Blocked
      POST_NOTIFICATION_TASK_BLOCKED: -226,

      // Notification post TASK Unblocked
      POST_NOTIFICATION_TASK_UN_BLOCKED: -225,

      // Notification post TASK Lifecycle Event : Start
      POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_START: -203,

      // Notification post Task Lifecycle Event : Stopped
      POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_STOP: -204,

      // Notification post Task Lifecycle Event : Resume
      POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_RESUME: -205,

      // Notification post Task lifecycle event : Finish
      POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_FINISH: -206,

      // Notification post Task lifecycle event : Reject
      POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_REJECT: -208,

      // Notification post Task Lifecycle Event : Stopped
      POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_CANCEL: -209,

      // Notification post Task Lifecycle Event : Closed
      POST_NOTIFICATION_TASK_LIFECYCLE_EVENT_CLOSE: -210,

      //Notification for Task data Events

      POST_TYPE_VAULT_TASK_FILE_UPLOAD_INVITEE: -212,

      POST_TYPE_VAULT_TASK_FILE_DELETE_INVITEE: -213,

      POST_TYPE_VAULT_TASK_FILE_RENAME_INVITEE: -214,

      //POST_NOTIFICATION_TASK_VAULT_FILE_DEL: -78,

      //POST_NOTIFICATION_TASK_VAULT_FILE_RENAME: -79,

      //POST_NOTIFICATION_TASK_VAULT_FILE_COPY: -79,


      // Notification post for new direct message to the user.
      POST_NOTIFICATION_DM_RECEIPT: -211,
      
      POST_TYPE_EVENT_CREATE_NOTIFICATION : -230,
  
      POST_TYPE_EVENT_UPDATE_NOTIFICATION : -231,
    
      POST_TYPE_EVENT_DELETE_NOTIFICATION : -232,
      
      POST_TYPE_MEETING_START_NOTIFICATION : -234,
      
      POST_TYPE_SUBSCRIPTION_INFO_NOTIFICATION : -238,
      
      POST_TYPE_DATA_VAULT_ALERT : -93,
      
      POST_TYPE_DATA_VAULT_WARNING : -94,
      
      POST_TYPE_DATA_VAULT_RESTRICT : -95,

    }
  };

  var PUSH_PLATFORM = {
    IOS: 'ios',
    ANDROID: 'android'
  };

  var PUSH_PREFERENCES = {
    invitation: 1,
    chat: 2,
    data: 3
  };

  var ROLE = {
    "ORG_ADMIN": 1,
    "ORG_MEMBER": 2,
    "ORG_VISITOR": 10,

    "GROUP_ADMIN": 3,
    "GROUP_MEMBER": 4,
    "GROUP_VISITOR": 10,

    "SUPPORT_ADMIN": 5,
    "SUPPORT_USER": 6,

    "NEUTRAL": 0,

    JOB_ORIGINATOR: 7,
    JOB_OWNER: 8,
    JOB_DELEGATOR: 9,
    JOB_VISITOR: 10,

    TASK_ASSIGNEE: 10
  };
  var EVENTS = {
		  EVENT_OWNER : 14,
		  EVENT_MEMBER : 15
  };

  var ROOM_STATUS = {
		  AVAILABLE : -204,
		  BUSY : -205
  };

  var JOB_STATUS = {
    NEW: -101,
    OWNED: -102,
    IN_PROGRESS: -103,
    STOPPED: -104,
    FINISHED: -106,
    UNDER_VERIFICATION: -107,
    REJECTED: -108,
    CANCELLED: -109,
    CLOSED: -110,

    CREATE: -301,
    START: -302,
    FINISH: -303,
    CLOSE: -304,
    JOB_OWNERSHIP_WAITING: -305,
    JOB_OWNED: -306,
    JOB_CAN_NOT_BE_OWNED : -307
  };

  var JOB_LIFECYCLE_EVENT = {
    TRY_START: -303,
    TRY_STOP: -304,
    TRY_RESUME: -305,
    TRY_FINISH: -306,
    TRY_CLOSE: -310,
    TRY_REJECT: -308,
    TRY_CANCEL: -309,
    //TRY_PAUSE:-307 Not provided in the #94 service doc
  };
  
  var JOB_FORM_FIELD_DEF = {
		  PRE: "predefined",
		  POST: "postdefined"
		  
  };

  var TASK_STATUS = {
    NEW: -101,
    OWNED: -102,
    IN_PROGRESS: -103,
    STOPPED: -104,
    FINISHED: -106,
    UNDER_VERIFICATION: -107,
    CANCELLED: -109,
    REJECTED: -108,
    CLOSED: -110,
    ASSIGNED: -202
  };

  var TASK_LIFECYCLE_EVENT = {
    TASK_START: -203,
    TASK_STOP: -204,
    TASK_RESUME: -205,
    TASK_FINISH: -206,
    TASK_CLOSE: -210,
    TASK_REJECT: -208,
    TASK_CANCEL: -209
  };
  
  var EVENTS_REPEAT_FTYPES = {
		  NOREPEAT : "-401",
		  DAILY : "-402",
		  WEEKLY : "-403",
		  MONTHLY : "-404",
		  YEARLY : "-405"
		  };
  
  var EVENTS_REPEAT_TYPES = {
		  FOREVER : -411,
		  UNTIL_DATE : -412,
		  COUNT : -413
		  };

  var PUSH_NOTIFICATION_TYPE = {
    APP_GLOBAL_NOTIFICATION: 0,
    NEW_POST: 10,
    CHAT_SUMMARY: 20
  };

  var CATEGORY_TYPE = {
    ORG: 1,
    GROUP: 2,
    JOB: 3,
    TASK: 4
  };
  
  var EVENT_REMINDER_DUR_TYPES = {
		    MINUTES: 1,
		    HOURS: 2,
		    DAYS: 3,
		    WEEKS: 4
  	};

  var
    en_json = {};
  
  var SESSION_PSWD = "sessionPswd";
  
  var MEETING_TYPES = {
		  SCHEDULED : -101,
		  ADHOC : -102
  };
  
  var MEETING_STATUS = {
		  CREATED : -201,
		  STARTED : -202,
		  FINISHED : -203
  };
  
  var MEETING_MEMBER_ROLES = {
		  OWNER : 16,
		  MEMBER : 17
  };

  var CONFERENCE_BROADCAST = {
		  PARTICIPANT_JOINED : "PARTICIPANT_JOINED_CONFERENCE",
		  PARTICIPANT_LEFT : "PARTICIPANT_LEFT_CONFERENCE",
		  LOCAL_PARTICIPANT_KICKED : "LOCAL_PARTICIPANT_KICKED",
          MEETING_ENDED : "MEETING_ENDED",
          PARTICIPANT_KICKED : "PARTICIPANT_KICKED"
  };
  
  var MEETING_CUSTOM_COMMANDS = {
		  NEW_MEMBER_ADDED: "newMemberAdded",
		  MEMBER_REMOVED: "memberRemoved",
		  MEETING_EXTENDED: "meetingExtended",
          CUSTOM_END : "customEndEvent"
	};
  
  var MEETING_VIEW_EVENTS = {
		  START_MEETING: "startMeeting",
		  END_MEETING : "endMeeting"
	};
  
  var MEETING_EVENT_TYPES = {
		  MEMBER_EVENT_JOINED: -302,
		  MEMBER_EVENT_LEFT: -303,
		  MEMBER_EVENT_REMOVED: -304
	};
  
  var SUBSCRIPTION_UOM_TYPES = {
		  EACH : 2,
		  MB: 4,
		  GB: 7,
		  DAYS: 3,
		  HALF_YEAR: 9,
		  YEAR: 8,
		  MONTHS: 6,
		  BOOL: 5
  };
  
  var SUBSCRIPTION_PACK_TYPES = {
		  BASE: 1,
		  CHARGED: 2
  };
  
  var MEETING_MESSAGES = {
		  OTHER_ORG_MEETING_INPROGRESS: "Cannot start meeting. Meeting is in progress in another WorkSpace or Room.",
  };
  
  var INVITES_STATUS = {
		  PENDING: -4,
		  REGISTERED: -5
  };
  
  var CHAT_ENCRYPT_TYPE = {
		  KEY: "kef"
  };
  
  var app = angular.module('app.constants', [])
    .constant("APP_INFO", APP_INFO)
    .constant("SAVED_PREFERENCES_KEY", SAVED_PREFERENCES_KEY)
    .constant("APP_URL_SCHEMA", APP_URL_SCHEMA)
    .value("TIMEOUT", 15000)
    .constant("APP_ROUTES", APP_ROUTES)
    .constant("APP_DATA_CSS", APP_DATA_CSS)
    .constant("APP_BROADCAST", APP_BROADCAST)
    .constant("APP_STATUS", APP_STATUS)
    .constant("LOCALE_URI", LOCALE_URI)
    .constant("HTTP", HTTP)
    .constant("IMAGE_PRESET", IMAGE_PRESET)
    .constant("APP_POST", APP_POST)
    .constant("PUSH_PLATFORM", PUSH_PLATFORM)
    .constant("PUSH_PREFERENCES", PUSH_PREFERENCES)
    .constant("ROLE", ROLE)
    .constant("CATEGORY_TYPE", CATEGORY_TYPE)
    .constant("EVENTS", EVENTS)
    .constant("JOB_STATUS", JOB_STATUS)
    .constant("JOB_LIFECYCLE_EVENT", JOB_LIFECYCLE_EVENT)
    .constant("JOB_FORM_FIELD_DEF", JOB_FORM_FIELD_DEF)
    .constant("TASK_STATUS", TASK_STATUS)
    .constant("TASK_LIFECYCLE_EVENT", TASK_LIFECYCLE_EVENT)
    .constant("PUSH_NOTIFICATION_TYPE", PUSH_NOTIFICATION_TYPE)
    .constant("EVENTS_REPEAT_FTYPES", EVENTS_REPEAT_FTYPES)
    .constant("EVENTS_REPEAT_TYPES", EVENTS_REPEAT_TYPES)
    .constant("EVENT_REMINDER_DUR_TYPES", EVENT_REMINDER_DUR_TYPES)
    .constant("SESSION_PSWD",SESSION_PSWD)
    .constant("MEETING_TYPES",MEETING_TYPES)
    .constant("MEETING_STATUS",MEETING_STATUS)
    .constant("MEETING_MEMBER_ROLES",MEETING_MEMBER_ROLES)
    .constant("CONFERENCE_BROADCAST", CONFERENCE_BROADCAST)
    .constant("MEETING_EVENT_TYPES", MEETING_EVENT_TYPES)
    .constant("MEETING_CUSTOM_COMMANDS", MEETING_CUSTOM_COMMANDS)
    .constant("SUBSCRIPTION_UOM_TYPES",SUBSCRIPTION_UOM_TYPES)
    .constant("SUBSCRIPTION_PACK_TYPES",SUBSCRIPTION_PACK_TYPES)
    .constant("MEETING_VIEW_EVENTS",MEETING_VIEW_EVENTS)
    .constant("EVENT_TYPE",EVENT_TYPE)
    .constant("ROOM_STATUS",ROOM_STATUS)
    .constant("MEETING_MESSAGES", MEETING_MESSAGES)
    .constant("INVITES_STATUS",INVITES_STATUS)
    .constant("CHAT_ENCRYPT_TYPE",CHAT_ENCRYPT_TYPE)
    
    

    /* __DEPRECATED_____
     * =================
     * To be removed after dependency check
     * */
    .service("LanguageProvider", [
      "$rootScope",
      "$http", "$q",
      "LOCALE_URI", "APP_BROADCAST",

      function ($rootScope, $http, $q, LOCALE_URI) {
        var _lang = {}
        _locale = "";

        var onLanguageUpdate_delegate = function () {
        };

        function onLanguageUpdate(delegate) {
          onLanguageUpdate_delegate = delegate;
        }

        this.initialize = function (options) {
          var options = options || {};
          _locale = options.locale || "en";
        }

        this.lang = function () {
          return _lang;
        }

        this.loadLang = function (options) {
          var _defer = $q.defer();
          $http({
            method: 'GET',
            url: LOCALE_URI[_locale]
          })
            .success(function (data, status, headers, config) {
              _lang = data;
              // _lang = lang_default
              $rootScope.$broadcast(APP_BROADCAST.LANG.UPDATE);
              _defer.resolve();
            })
            .error(function (data, status, headers, config) {
              _lang = en_json;
              _defer.reject();
            });
          return _defer.promise;
        }
      }
    ])


})();
