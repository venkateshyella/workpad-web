/**
 * Created by sudhir on 22/6/16.
 */

angular.module("DL")
  .service('EVENT', [
    'PaginationFactory',
    'Session', 'URL','Connect','$q',
    function (PaginationFactory, Session, URL, Connect, $q) {

      var meta = {}
        , resource
        , displayTimeFormatter
        , EVENT_OWNER = 14
        , EVENT_MEMBER = 15
        
      	, REPEAT_TYPES = { 
    		  					FOREVER : -411,
    		  					UNTIL_DATE : -412,
    		  					COUNT : -413
      						  }
        , REPEAT_FREQ_TYPES = {
    		  					NOREPEAT : -401,
    		  					DAILY : -402,
    		  					WEEKLY : -403,
    		  					MONTHLY : -404,
    		  					YEARLY : -405
      						  } 
        
        , REPEAT_TYPES_LABEL_MAP = {}
        , REPEAT_FREQ_TYPES_LABEL_MAP = {}
      	, REPEAT_FREQ_TYPES_LABEL_MODEL_MAP = {}
        ;

      meta.REPEAT_TYPES_LABEL_MAP = [ { value : REPEAT_TYPES.FOREVER, label : "Forever"},
	                                   { value: REPEAT_TYPES.UNTIL_DATE, label : "Until Date"},
	                                   { value: REPEAT_TYPES.COUNT, label : "Count"}
	                                ]; 
      
      meta.REPEAT_FREQ_TYPES_LABEL_MAP = [ { value:  REPEAT_FREQ_TYPES.NOREPEAT, label : "No Repeat"},
	                                        {value: REPEAT_FREQ_TYPES.DAILY, label : "Daily"},
	                                        {value: REPEAT_FREQ_TYPES.WEEKLY, label : "Weekly"},
	                                        {value: REPEAT_FREQ_TYPES.MONTHLY, label : "Monthly"},
	                                        {value: REPEAT_FREQ_TYPES.YEARLY, label : "Yearly"}
	                                      ]; 
      
      meta.REPEAT_FREQ_TYPES_LABEL_MODEL_MAP = [ 
	                                        {value: REPEAT_FREQ_TYPES.DAILY, label : "Repeat Daily"},
	                                        {value: REPEAT_FREQ_TYPES.WEEKLY, label : "Repeat Weekly"},
	                                        {value: REPEAT_FREQ_TYPES.MONTHLY, label : "Repeat Monthly"},
	                                        {value: REPEAT_FREQ_TYPES.YEARLY, label : "Repeat Yearly"}
	                                      ]; 
      
      
                                      
      displayTimeFormatter = mobos.Utils.getDisplayDateTimeOffset;

      return {
        config: {
          name: "Event",
          // idAttribute: 'auditLogId',
          schema: {},
          computed: {},
          meta: meta,
          methods: {
            getMeta: function () {
              return meta;
            }
          },
          endpoint: "/event",
          customEndpoint: {
        	  findAll: '/list.ws',
        	  create: "/create.ws"
        	 // update: "/update.ws"
          },
          reqAdapter: {
        	 
          },
          respAdapter: {
        	  defaultAdapter: function (resp) {
					return resp;
				},
				
        	  findAll: function (resp) {
					"use strict";
					meta.paginationMetaData = resp.paginationMetaData;
					return resp.results;
				},
			    create: function (resp) {
					"use strict";
					return resp;
				}
				
          },
          
          updateEvent : function(_postData){
        	  var _deferred = $q.defer()
        	  Connect.post(URL.UPDATE_EVENT, _postData).then(function onUpdateSuccess(res) {
                  _deferred.resolve(res);
                }, function onUpdateFail(error) {
                  _deferred.reject(error);
                });
        	  
        	  return _deferred.promise;
          },
          
          getRepeatTypes : function(typeCode){
        	  "use strict";
        	  return REPEAT_TYPES;
          },
          
          getRepeatFreqTypes : function(typeCode){
        	  "use strict";
        	  return REPEAT_FREQ_TYPES;
          },
          
          getEventNoRepeatCode : function(){
        	  "use strict";
        	  return REPEAT_FREQ_TYPES.NOREPEAT;
          },
          
          getEventTypes : function(){
        	  var deferred = $q.defer();
				
				Connect.get(URL.EVENT_TYPES, {})
					.then(function (res) {
						deferred.resolve(res.resp);
					})
					.catch(function (err) {
						deferred.reject(err);
					});

				return deferred.promise;
          },
          
          /**
           * search members in organization/group
           * or get members related to event
           */
          searchMembers: function (params) {
				var deferred = $q.defer();
				
				Connect.get(URL.EVENT_SEARCH_MEMBER, params)
					.then(function (res) {
						deferred.resolve(res.resp);
					})
					.catch(function (err) {
						deferred.reject(err);
					});

				return deferred.promise;
			},
			eventOwnedList: function (params) {
				var deferred = $q.defer();
				
				Connect.get(URL.ORG_EVENT_OWNED_LIST, params)
					.then(function (res) {
						deferred.resolve(res.resp);
					})
					.catch(function (err) {
						deferred.reject(err);
					});

				return deferred.promise;
			},
			searchOrgOrGroups: function (params) {
				var deferred = $q.defer();
				
				Connect.get(URL.EVENT_SEARCH_ORG_OR_GROUP, params)
					.then(function (res) {
						deferred.resolve(res.resp);
					})
					.catch(function (err) {
						deferred.reject(err);
					});

				return deferred.promise;
			},
			searchGroupMem: function (params) {
				var deferred = $q.defer();
				
				Connect.get(URL.EVENT_SEARCH_GROUP_MEMBERS, params)
					.then(function (res) {
						deferred.resolve(res.resp);
					})
					.catch(function (err) {
						deferred.reject(err);
					});

				return deferred.promise;
			},
			searchOrgMem: function (params) {
				var deferred = $q.defer();
				
				Connect.get(URL.EVENT_SEARCH_ORG_MEMBERS, params)
					.then(function (res) {
						deferred.resolve(res.resp);
					})
					.catch(function (err) {
						deferred.reject(err);
					});

				return deferred.promise;
			},
			deleteEvents: function (list, params) {
				var deferred = $q.defer();

				var reqParams = {
						catType: params.catType,
						catId: params.catId,
						events : _.map(list, function (list) {
							return {
								"id": list.id
							}
						})
					};
				
				Connect.post(URL.ORG_EVENT_DELETE,reqParams)
					.then(function (res) {
						deferred.resolve(res);
					}).catch(function (error) {
					deferred.reject(err);
				}).finally(function () {
				});
				
				return deferred.promise;
			}, getAllTemplates: function (params) {
				var deferred = $q.defer();
				Connect.get(URL.TEMPLATE_LIST_ALL,params)
				.then(function (res) {
					deferred.resolve(res);
				}).catch(function (error) {
					deferred.reject(error);
				}).finally(function () {
				});

				return deferred.promise;
			}, getTemplateById: function (params) {
				var deferred = $q.defer();
				Connect.get(URL.GET_TEMPLATE_BY_ID,params)
				.then(function (res) {
					deferred.resolve(res);
				}).catch(function (error) {
					deferred.reject(error);
				}).finally(function () {
				});

				return deferred.promise;
			}	
        },
       
        EventPageFactory: function (auditListArray, url, params) {
          resource.createCollection(auditListArray, {});
          return PaginationFactory(
            auditListArray, 'fetch', params, 25, {
              apiParams: {
                url: url,
                bypassCache: true
              }
            })
        },
   
        initResource: function  (newResource) {
        	"use strict";
			resource = newResource;
		}
      };
    }
  ]);