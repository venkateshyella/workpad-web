/**
 * Created by Vikas on 23/03/17.
 */

angular.module("DL")
  .service('PEOPLE', [
    'PaginationFactory',
    'Session', 'URL','Connect','$q',
    function (PaginationFactory, Session, URL, Connect, $q) {

      var meta = {}
        , resource
        ;

      function addImgIcon(usersList){
    	  var _usersList = usersList;
		  _.each(_usersList, function (userObj) {
				var userId = userObj.user.id;
				var _img_icon_hash = Math.random().toString(36).substring(7);

				userObj.user._img_icon = URL.GET_PIC
				+ "?userSessionId=" + Session.id
				+ "&entityId=" + userId
				+ "&imgEntityType=" + "USER"
				+ "&imgType=" + "ICON"
				+ "&hash=" + _img_icon_hash;
				
			});
		  
		  return _usersList;
      }
     

      return {
        config: {
          name: "People",
          // idAttribute: 'auditLogId',
          schema: {},
          computed: {},
          meta: meta,
          methods: {
            getMeta: function () {
              return meta;
            }
          },
          endpoint: "/user/people",
          customEndpoint: {
        	  findAll: '/list.ws',
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
          
          /**
           * search People
           */
          searchPeople: function (params) {
        	  var deferred = $q.defer();
        	  if (params.name) 
        		  params.name = encodeURI(params.name);
        	  if (params.location)
        		  params.location = encodeURI(params.location);
        	  if (params.skill)
        		  params.skill = encodeURI(params.skill);

        	  Connect.get(URL.PEOPLE_SEARCH, params)
        	  .then(function (res) {
        		  res.resp.results = addImgIcon(res.resp.results);
        		  deferred.resolve(res.resp);
        	  })
        	  .catch(function (err) {
        		  deferred.reject(err);
        	  });

        	  return deferred.promise;
          },
			
			invitePeople: function (params) {
				var deferred = $q.defer();
				
				Connect.post(URL.PEOPLE_INVITE, params)
					.then(function (res) {
						deferred.resolve(res);
					})
					.catch(function (err) {
						deferred.reject(err);
					});

				return deferred.promise;
			},
			
			tagOrUntagPeople: function (params) {
				var deferred = $q.defer();
				
				Connect.post(URL.PEOPLE_TAG_UNTAG,params)
					.then(function (res) {
						deferred.resolve(res);
					}).catch(function (error) {
					deferred.reject(error);
				}).finally(function () {
				});
				
				return deferred.promise;
			},
			
			taggedStatusPeopleList: function (params) {
				var deferred = $q.defer();
				
				Connect.get(URL.PEOPLE_TAG_LIST,params)
					.then(function (res) {
						res.resp.results = addImgIcon(res.resp.results);
						deferred.resolve(res);
						
					}).catch(function (error) {
					deferred.reject(error);
				}).finally(function () {
				});
				
				return deferred.promise;
			},
			
			invitesList: function (params) {
				var deferred = $q.defer();
				
				Connect.get(URL.PEOPLE_INVITES_LIST,params)
					.then(function (res) {
						res.resp.results = addImgIcon(res.resp.results);
						deferred.resolve(res);
					}).catch(function (error) {
					deferred.reject(error);
				}).finally(function () {
				});
				
				return deferred.promise;
			}
        },
       
        PeoplePageFactory: function (auditListArray, url, params) {
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