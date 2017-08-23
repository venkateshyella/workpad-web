/**
 * Created by sandeep on 23/01/2017.
 */

angular.module("DL")
  .service('PAYMENT', [
    'PaginationFactory',
    'Session', 'URL','Connect','$q',
    function (PaginationFactory, Session, URL, Connect, $q) {

      var meta = {}
        , resource
        , displayTimeFormatter
        ;
                                      
      return {
        config: {
          name: "PAYMENT",
          schema: {},
          computed: {},
          meta: meta,
          methods: {
            getMeta: function () {
              return meta;
            }
          },
          endpoint: "/payment",
          customEndpoint: {
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
				}
          },
          placeOrder : function(params) {
        	  var _deferred = $q.defer()
        	  Connect.post(URL.PLACE_ORDER, params)
        	  .then(function (res) {
        		  _deferred.resolve(res);
        	  })
        	  .catch(function (err) {
        		  _deferred.reject(err);
        	  });

        	  return _deferred.promise;
          },
          confirmOrder : function(params) {
        	  var _deferred = $q.defer()
        	  Connect.post(URL.CONFIRM_ORDER, params)
        	  .then(function (res) {
        		  _deferred.resolve(res);
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