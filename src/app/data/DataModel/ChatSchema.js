/**
 * Created by sudhir on 4/9/15.
 */

;
(function () {

	var DL = angular.module("DL");

	DL.service('CHAT', ['$q','Session', 'URL','Connect',
		function ChatSchema($q,Session, URL, Connect) {

			var meta = {};

			return {
				config: {
					name: "ChatMessage",
					relations: {
						belongsTo: {
							Chatroom: {
								localField: 'chatroom',
								localKey: '_chatroomId'
							}
						}
					},
					computed: {
						//createdDate_displayText: ['createDate', function (createDate) {
						//  "use strict";
						//  var d = new Date(createDate);
						//  return d.toLocaleDateString();
						//}]
						now: ['timestamp', function (timestamp) {
							"use strict";
							return new Date(timestamp).getTime()
						}]
					},
					methods: {
						//getMeta: function() {
						//  return meta;
						//}
					},
					endpoint: "--",
					customEndpoint: {
						//findAll: "/list.ws",
					},
					respAdapter: {},
					reqAdapter: {},
					createChatThread: function (params) {
						var deferred = $q.defer();
						Connect.post(URL.CREATE_CHAT_THREAD, params)
						.then(function (res) {
							deferred.resolve(res.resp);
						})
						.catch(function (err) {
							deferred.reject(err);
						});
						return deferred.promise;
					},
					viewChatThread: function (params) {
						var deferred = $q.defer();
						Connect.post(URL.VIEW_CHAT_THREAD, params)
						.then(function (res) {
							deferred.resolve(res.resp);
						})
						.catch(function (err) {
							deferred.reject(err);
						});
						return deferred.promise;
					},
					findAllChatThreads: function (params) {
						var deferred = $q.defer();
						Connect.get(URL.LIST_CHAT_THREAD, params)
						.then(function (res) {
							deferred.resolve(res.resp);
						})
						.catch(function (err) {
							deferred.reject(err);
						});
						return deferred.promise;
					}
				}
			}
		}
	])

})();