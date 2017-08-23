/**
 * Created by sudhir on 15/7/15.
 */

;(function () {

	var DL = angular.module("DL");

	DL.service('FILE', [
		'Session', 'URL','$q',
		function FileSchema(Session, URL, $q) {

			var meta = {};

			return {
				config: {
					name: "File",
					schema: {},
					computed: {
						updatedAt_displayText: ['updateTime', function (updateTime) {
							"use strict";
							var d = new Date(updateTime);
							return d.toLocaleDateString();
						}],
						size_displayText: ['size', function (size) {
							"use strict";
							return mobos.Utils.getDisplaySize(size);
						}]
					},
					methods: {
						downloadUrl: function () {
						}
					},
					endpoint: "/file",
					customEndpoint: {

						//findAll: "/list.ws",
						//find: "/view.ws"
					},
					respAdapter: {
						findAll: function (resp) {
							if (resp.paginationMetaData) {
								meta.paginationMetaData = resp.paginationMetaData;
								angular.forEach(resp.results, function (res) {
									if (res.postId) res.id = res.postId;
								});
								if (resp.results) {
									return resp.results;
								} else {
									console.error('invalid paginated response data format');
								}
							} else {
								return resp
							}
						}
						,
						destroyAll: function (resp) {
							return resp;
						}
					},
					reqAdapter: {
						defaultAdapter: function (req) {
							return req;
						}
						,
						find: function (definition, id, options) {
							"use strict";
							return {
								postId: id
							}
						}
					},
					
					createFolder : function(params){
						 var _deferred = $q.defer();
			        	  Connect.post(URL.VAULT_CREATE_FOLDER, params)
			        	  .then(function (res) {
			        		  _deferred.resolve(res);
			        	  })
			        	  .catch(function (err) {
			        		  _deferred.reject(err);
			        	  });

			        	  return _deferred.promise;
					},
					
					deleteFolders: function(params){
						var _deferred = $q.defer();
			        	  Connect.post(URL.VAULT_DELETE_FOLDER, params)
			        	  .then(function (res) {
			        		  _deferred.resolve(res);
			        	  })
			        	  .catch(function (err) {
			        		  _deferred.reject(err);
			        	  });

			        	  return _deferred.promise;
					},
					
					fetchFolderList: function(params){
						var _deferred = $q.defer();
			        	  Connect.get(URL.VAULT_FOLDERS_LIST, params)
			        	  .then(function (res) {
			        		  _deferred.resolve(res.resp);
			        	  })
			        	  .catch(function (err) {
			        		  _deferred.reject(err);
			        	  });

			        	  return _deferred.promise;
					},
					
					fetchOwnedFolderList: function(params){
						var _deferred = $q.defer();
			        	  Connect.get(URL.VAULT_OWNED_FOLDERS_LIST, params)
			        	  .then(function (res) {
			        		  _deferred.resolve(res.resp);
			        	  })
			        	  .catch(function (err) {
			        		  _deferred.reject(err);
			        	  });

			        	  return _deferred.promise;
					},
					
					/*
					 * fetches all files and folders list
					 * @param catId
					 * @param catType
					 * @param folderId (optional)
					 */
					fetchFilesList: function(params){
						var _deferred = $q.defer();
			        	  Connect.get(URL.VAULT_FOLDER_FILES_LIST, params)
			        	  .then(function (res) {
			        		  _deferred.resolve(res.resp);
			        	  })
			        	  .catch(function (err) {
			        		  _deferred.reject(err);
			        	  });

			        	  return _deferred.promise;
					}
					
					
				}
			}
		}
	])

})();