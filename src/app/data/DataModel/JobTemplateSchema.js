/**
 * Created by sudhir on 22/6/16.
 */

angular.module("DL")
  .service('JOBTEMPLATE', [
    'PaginationFactory',
    'Session', 'URL','Connect','$q',
    function (PaginationFactory, Session, URL, Connect, $q) {

      var meta = {}
        , resource
        , displayTimeFormatter
        ;
                                      
      displayTimeFormatter = mobos.Utils.getDisplayDateTimeOffset;

      return {
        config: {
          name: "JobTemplate",
          // idAttribute: 'auditLogId',
          schema: {},
          computed: {},
          meta: meta,
          methods: {
            getMeta: function () {
              return meta;
            }
          },
          endpoint: "/job/template",
          customEndpoint: {
        	  findAll: '/list.ws',
        	  create: "/create.ws"
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
          
          updateTemplate : function(_postData){
        	  var _deferred = $q.defer()
        	  Connect.post(URL.UPDATE_JOB_TEMPLATE, _postData).then(function onUpdateSuccess(res) {
                  _deferred.resolve(res);
                }, function onUpdateFail(error) {
                  _deferred.reject(error);
                });
        	  
        	  return _deferred.promise;
          },
          
          templateOwnedList: function (params) {
				var deferred = $q.defer();
				
				Connect.get(URL.JOB_TEMPLATE_OWNED_LIST, params)
					.then(function (res) {
						deferred.resolve(res.resp);
					})
					.catch(function (err) {
						deferred.reject(err);
					});

				return deferred.promise;
			},
	          existingJobTemplateInfo: function (params) {
					var deferred = $q.defer();
					
					Connect.get(URL.EXISTING_JOB_TEMPLATE_INFO, params)
						.then(function (res) {
							deferred.resolve(res.resp);
						})
						.catch(function (err) {
							deferred.reject(err);
						});

					return deferred.promise;
				},
			deleteTemplates: function (list, params) {
				var deferred = $q.defer();

				var reqParams = {
						catType: params.catType,
						catId: params.catId,
						templates : _.map(list, function (list) {
							return {
								"id": list.id
							}
						})
					};
				
				Connect.post(URL.JOB_TEMPLATE_DELETE,reqParams)
					.then(function (res) {
						deferred.resolve(res);
					}).catch(function (error) {
					deferred.reject(err);
				}).finally(function () {
				});
				
				return deferred.promise;
			},	
			closedJobsListForOrg: function (params) {
				var deferred = $q.defer();
				
				Connect.get(URL.JOB_TEMPLATE_CLOSED_JOBS_LIST, params)
					.then(function (res) {
						deferred.resolve(res.resp);
					})
					.catch(function (err) {
						deferred.reject(err);
					});

				return deferred.promise;
			},	

          searchOrgsAndGroups: function (params) {
        	  var deferred = $q.defer();

        	  Connect.get(URL.JOB_TEMPLATE_SEARCH_ORG_GROUP, params)
        	  .then(function (res) {
        		  deferred.resolve(res.resp);
        	  })
        	  .catch(function (err) {
        		  deferred.reject(err);
        	  });

        	  return deferred.promise;
          },
          searchOrgMembers: function (params) {
        	  var deferred = $q.defer();

        	  Connect.get(URL.JOB_TEMPLATE_SEARCH_ORG_MEMBERS, params)
        	  .then(function (res) {
        		  deferred.resolve(res.resp);
        	  })
        	  .catch(function (err) {
        		  deferred.reject(err);
        	  });

        	  return deferred.promise;
          },
          searchGroupMembers: function (params) {
        	  var deferred = $q.defer();

        	  Connect.get(URL.JOB_TEMPLATE_SEARCH_GROUP_MEMBERS, params)
        	  .then(function (res) {
        		  deferred.resolve(res.resp);
        	  })
        	  .catch(function (err) {
        		  deferred.reject(err);
        	  });

        	  return deferred.promise;
          }
          
        },
        jobTemplatesList: function (params) {
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
		
        TemplatePageFactory: function (auditListArray, url, params) {
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