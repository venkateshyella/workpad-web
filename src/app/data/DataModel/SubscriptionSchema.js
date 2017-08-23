/**
 * Created by sandeep on 17/01/2017.
 */

angular.module("DL")
  .service('SUBSCRIPTION', [
    'PaginationFactory',
    'Session', 'URL','Connect','$q',
    function (PaginationFactory, Session, URL, Connect, $q) {

      var meta = {}
        , resource
        , displayTimeFormatter
        ;
                                      
      return {
        config: {
          name: "SUBSCRIPTION",
          schema: {},
          computed: {},
          meta: meta,
          methods: {
            getMeta: function () {
              return meta;
            }
          },
          endpoint: "/org/item",
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
          getSubscribedItems : function(params) {
        	  var _deferred = $q.defer()
        	  Connect.get(URL.SUBSCRIBED_ITEMS_LIST, params)
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