/**
 * Created by Vikas on 24/11/16.
 */
angular.module("DL")
.service('MEETING', [
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
			name: "Meeting",
			schema: {},
			computed: {},
			meta: meta,
			methods: {
				getMeta: function () {
					return meta;
				}
			},
			endpoint: "/meeting",
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
			memberSearch: function (params) {
				var deferred = $q.defer();
				Connect.get(URL.MEETING_SEARCH, params)
				.then(function (res) {
					deferred.resolve(res.resp);
				})
				.catch(function (err) {
					deferred.reject(err);
				});
				return deferred.promise;
			},
			addMembers: function (params) {
				var deferred = $q.defer();
				Connect.post(URL.MEETING_MEMBER_ADD, params)
				.then(function (res) {
					deferred.resolve(res.resp);
				})
				.catch(function (err) {
					deferred.reject(err);
				});
				return deferred.promise;
			},
			meetingJoin: function (params) {
				var deferred = $q.defer();
				Connect.get(URL.MEETING_JOIN, params)
				.then(function (res) {
					deferred.resolve(res.resp);
				})
				.catch(function (err) {
					deferred.reject(err);
				});
				return deferred.promise;
			},
			meetingStart: function (params) {
				var deferred = $q.defer();
				Connect.get(URL.MEETING_START, params)
				.then(function (res) {
					deferred.resolve(res.resp);
				})
				.catch(function (err) {
					deferred.reject(err);
				});
				return deferred.promise;
			},
			meetingEnd: function (params) {
				var deferred = $q.defer();
				Connect.get(URL.MEETING_END, params)
				.then(function (res) {
					deferred.resolve(res.resp);
				})
				.catch(function (err) {
					deferred.reject(err);
				});
				return deferred.promise;
			}, meetingCreate: function (req) {
				var deferred = $q.defer();
				Connect.post(URL.MEETING_CREATE, req)
				.then(function (res) {
					deferred.resolve(res);
				})
				.catch(function (err) {
					deferred.reject(err);
				});
				return deferred.promise;
			}, meetingUpdate: function (req) {
				var deferred = $q.defer();
				Connect.post(URL.MEETING_UPDATE, req)
				.then(function (res) {
					deferred.resolve(res);
				})
				.catch(function (err) {
					deferred.reject(err);
				});
				return deferred.promise;
			}, ownedMeetingsList: function (req) {
				var deferred = $q.defer();
				Connect.get(URL.OWNED_MEETINGS_LIST, req)
				.then(function (res) {
					deferred.resolve(res);
				})
				.catch(function (err) {
					deferred.reject(err);
				});
				return deferred.promise;
			}, ownedMeetingsDelete: function (list, params) {
				var deferred = $q.defer();
				var reqParams = {
						catType: params.catType,
						catId: params.catId,
						meetings : _.map(list, function (list) {
							return {
								"id": list.id
							}
						})
					};
				Connect.post(URL.MEETING_DELETE,reqParams)
					.then(function (res) {
						deferred.resolve(res);
					}).catch(function (error) {
					deferred.reject(error);
				}).finally(function () {
				});
				return deferred.promise;
			},
			
			 meetingJoin: function (params) {
	        	  var deferred = $q.defer();

	        	  Connect.get(URL.MEETING_JOIN, params)
	        	  .then(function (res) {
	        		  deferred.resolve(res.resp);
	        	  })
	        	  .catch(function (err) {
	        		  deferred.reject(err);
	        	  });

	        	  return deferred.promise;
	          },
	          
	          notifyMeetingStart: function (params) {
	        	  var deferred = $q.defer();

	        	  Connect.post(URL.MEETING_START, params)
	        	  .then(function (res) {
	        		  deferred.resolve(res.resp);
	        	  })
	        	  .catch(function (err) {
	        		  deferred.reject(err);
	        	  });

	        	  return deferred.promise;
	          },
	          meetingEnd: function (req) {
	        	  var deferred = $q.defer();

	        	  Connect.post(URL.MEETING_END, req)
	        	  .then(function (res) {
	        		  deferred.resolve(res.resp);
	        	  })
	        	  .catch(function (err) {
	        		  deferred.reject(err);
	        	  });

	        	  return deferred.promise;
	          },
	          memberEvent: function (req) {
	        	  var deferred = $q.defer();

	        	  Connect.post(URL.MEETING_MEMBER_EVENT, req)
	        	  .then(function (res) {
	        		  deferred.resolve(res.resp);
	        	  })
	        	  .catch(function (err) {
	        		  deferred.reject(err);
	        	  });

	        	  return deferred.promise;
	          },
	          
	          meetingExtend: function (req) {
	        	  var deferred = $q.defer();

	        	  Connect.post(URL.MEETING_EXTEND, req)
	        	  .then(function (res) {
	        		  deferred.resolve(res.resp);
	        	  })
	        	  .catch(function (err) {
	        		  deferred.reject(err);
	        	  });

	        	  return deferred.promise;
	          },
	          
	          meetingView: function (req) {
	        	  var deferred = $q.defer();

	        	  Connect.get(URL.MEETING_VIEW, req)
	        	  .then(function (res) {
	        		  deferred.resolve(res.resp);
	        	  })
	        	  .catch(function (err) {
	        		  deferred.reject(err);
	        	  });

	        	  return deferred.promise;
	          },
	          roomStatus: function (params) {
	        	  var deferred = $q.defer();
	        	  var req = { orgId: params.orgId ? params.orgId : params.catId,
	        			      catId: params.catId,
	        			      catType: params.catType
	        			    };
	        	  
	        	  Connect.get(URL.ROOM_STATUS, req)
	        	  .then(function (res) {
	        		  deferred.resolve(res.resp);
	        	  })
	        	  .catch(function (err) {
	        		  deferred.reject(err);
	        	  });

	        	  return deferred.promise;
	          }
		},
		initResource: function  (newResource) {
		}
	};
}
]);