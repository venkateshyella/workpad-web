/**
 * Created by sandeep on 03/07/2017.
 */

angular.module("DL")
  .service('WPAUDIT', [
    'PaginationFactory',
    'Session', 'URL','Connect','$q',
    function (PaginationFactory, Session, URL, Connect, $q) {

      var meta = {}
        , resource
        , displayTimeFormatter
        ;
                                      
      return {
        config: {
          name: "WPAUDIT",
          schema: {},
          computed: {},
          meta: meta,
          methods: {
            getMeta: function () {
              return meta;
            }
          },
          endpoint: "/audit/org",
          customEndpoint: {
        	  findAll: '/list.ws'
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
          getAuditOrgList : function(params) {
        	  var _deferred = $q.defer();
        	  Connect.get(URL.WP_AUDIT_ORG_LIST, params)
        	  .then(function (res) {
        		  _deferred.resolve(res.resp);
        	  })
        	  .catch(function (err) {
        		  _deferred.reject(err);
        	  });

        	  return _deferred.promise;
          
          },
          getOrgMemberList : function(params) {
        	  var _deferred = $q.defer();
        	  Connect.get(URL.WP_AUDIT_MEMBER_LIST, params)
        	  .then(function (res) {
        		  _deferred.resolve(res.resp);
        	  })
        	  .catch(function (err) {
        		  _deferred.reject(err);
        	  });

        	  return _deferred.promise;
          },
          auditSearch : function(params) {
        	  var _deferred = $q.defer();
        	  Connect.get(URL.WP_AUDIT_SEARCH, params)
        	  .then(function (res) {
        		  _deferred.resolve(res.resp);
        	  })
        	  .catch(function (err) {
        		  _deferred.reject(err);
        	  });

        	  return _deferred.promise;
          },
          lookUpTypes : function(params) {
        	  var _deferred = $q.defer();
        	  Connect.get(URL.WP_AUDIT_LOOKUP_TYPES, params)
        	  .then(function (res) {
        		  _deferred.resolve(res.resp);
        	  })
        	  .catch(function (err) {
        		  _deferred.reject(err);
        	  });

        	  return _deferred.promise;
          },
          submitDelegateAccess : function (list, params) {
				var deferred = $q.defer();

				var reqParams = {
						orgId:params.orgId,
					    userSessionId:params.userSessionId,
						userAuditAccess : _.map(list, function (list) {
							return {
								"id": list.id,
								"access": list.isSelected
							}
						})
					};
				
				Connect.post(URL.WP_AUDIT_MEMBER_DELEGATE_ACCESS,reqParams)
					.then(function (res) {
						deferred.resolve(res);
					}).catch(function (error) {
					deferred.reject(error);
				}).finally(function () {
				});
				
				return deferred.promise;
			},
			
			getProductivityChartData : function(params) {
	        	  var _deferred = $q.defer();
	        	  Connect.get(URL.WP_AUDIT_PROD_CHART_3_VIEW, params)
	        	  .then(function (res) {
	        		  _deferred.resolve(res.resp);
	        	  })
	        	  .catch(function (err) {
	        		  _deferred.reject(err);
	        	  });

	        	  return _deferred.promise;
	          }
    
        },
        initResource: function  (newResource) {
        	"use strict";
			resource = newResource;
			
		}
      };
    }
  ]);