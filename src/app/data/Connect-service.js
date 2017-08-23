// Connect.service.js

var DL = angular.module("DL");

angular.module('DL')
	.config(['$httpProvider', function ($httpProvider) {
		$httpProvider.defaults.timeout = 10000;
		delete $httpProvider.defaults.headers.common['X-Requested-With'];
	}]);

DL.constant('CONNECT_NOTIFICATION', {
	START: 'start',
	STOP: 'stop'
});

DL.service("Connect", [
	"$http", "$q",
	"Session", '$timeout', 'blockUI',
	"URL", "HTTP", 'CONNECT_NOTIFICATION', 'Lang','Securify','X_API_KEY',
	function Connect($http, $q, Session, $timeout, blockUI,
	                 URL, HTTP, CONNECT_NOTIFICATION, Lang, Securify,X_API_KEY) {

		var _config = {
				mocksEnabled: false
			}
			, _fileUploadOptions = {}
			;

		var LANG = Lang.en.data;

		var connectNotifyListersBucket = [];
		var sessionExpireListersBucket = [];
		var sessionResolver;

		function _parse(resp) {
			var _resp = resp;
			var _result = {
				resp: _resp.data,
				respMsg: resp.responseMessage,
				responseCode: _resp.responseCode,
				isSuccess: false
			};
			if (_resp && _resp.responseCode != undefined) {
				switch (_resp.responseCode) {
					case 0:
						// Success response
						_result.isSuccess = true;
						break;
					case 1:
						_result.isSuccess = false;
						break;
					case 2:
						// Session timeout
						_resp.responseMessage;
						_result.isSuccess = false;
					default:
						_result.isSuccess = false;
				}
			} else {
				_result.isSuccess = false;
			}
			return _result;
		}

		function _parseError(resp, status) {
			var _respMsg = "";
			if (!resp || status == 0) {
				//  Network Error
				_respMsg = LANG.ERROR.NETWORK_FAILURE;
			} else {
				_respMsg = resp.responseMessage || LANG.ERROR.SERVICE_ERROR;
			}
			return {
				resp: resp,
				respMsg: _respMsg,
				isSuccess: false
			}
		}

		/**
		 *
		 * TODO(Sudhir) Add cancel api for cancelling running uploads. ref:
		 * https://github.com/apache/cordova-plugin-file-transfer#abort
		 *
		 * @ref https://github.com/apache/cordova-plugin-file-transfer#upload
		 *
		 * @param url Target URL
		 * @param file File URI
		 * @param options
		 * @returns {promise.promise|Function|*|jQuery.promise}
		 */
		function uploadFile(url, fileURI, options) {
			var _options = options || {}
				, _deferred = $q.defer()
				, _fileURI = fileURI
				, _params =  options.params
				, _data = options.data
				, _targetUrl = url
				;

			if (!_fileURI || !_targetUrl) {
				_deferred.reject();
				return _deferred.promise;
			}
			if (_fileUploadOptions.inProgress) {
				_deferred.reject({
					respMsg: "File uploading in progress. " +
					"Please try again after the current upload is finished."
				});
				return _deferred.reject({})
			}

			// Add query parameters. if any
			//if (angular.isDefined(_params)) {
			//	var queryString = $.param(_params);
			//	if (queryString && queryString.length > 0) {
			//		_targetUrl += '?' + queryString;
			//		console.log('new target url: ' + _targetUrl);
			//	}
			//}

//			var fileUploadOptions = new FileUploadOptions();
//			fileUploadOptions.fileKey = options.fileKey || "vaultfile";
//			fileUploadOptions.fileName = options.fileName || '_filename.jpeg';
//			fileUploadOptions.mimeType = options.mimeType || "text/plain";

			/* JSON payload for the multipart request*/
//			fileUploadOptions.params = _params;

//			console.log(fileUploadOptions);
			_notifyOnConnectListeners(new mobos.Utils.deferredNotification(CONNECT_NOTIFICATION.START));
			_deferred.notify(0);
			
//			var ft = new FileTransfer();
//			ft.onprogress = function (progressEvent) {
//				var progressNotification = {
//					progressEvent: progressEvent
//				};
//				if (progressEvent.lengthComputable) {
//					percentage = progressEvent.loaded / progressEvent.total;
//				} else {
//					percentage = 1;
//				}
//				progressNotification.percentage = percentage;
//				_deferred.notify(progressNotification);
//			};
			
			console.log("uploading to :" + _targetUrl);
			_fileUploadOptions.inProgress = true;
			
			
			uploadFromWeb(_targetUrl, _params, _data, win, fail,_deferred);
			
//			ft.upload(_fileURI, encodeURI(_targetUrl), win, fail, fileUploadOptions);
			
			return _deferred.promise;

			function win(res) {
				console.log(res);
				_fileUploadOptions.inProgress = false;
				var result = _parseFileTransferResponseSuccess(res);
				if (result.isSuccess) {
					blockUI.stop("File uploaded..");
					_deferred.resolve(result);
				} else {
					_deferred.reject(result);
				}
				_notifyOnConnectListeners(new mobos.Utils.deferredNotification(CONNECT_NOTIFICATION.STOP));
			}

			function fail(error) {
				console.log(error);
				_fileUploadOptions.inProgress = false;
				if (error != null) {
					console.log("An error has occurred: Code = " + error.code);
					console.log("upload error source " + error.source);
					console.log("upload error target " + error.target);
					var result = _parseFileTransferResponseError(error);
					blockUI.stop();
					_deferred.reject(result);
				} else {
		       		blockUI.stop('Error While Uploading the file', {	
						status: 'isError',
						action: 'Ok'
					});
				}
				_notifyOnConnectListeners(new mobos.Utils.deferredNotification(CONNECT_NOTIFICATION.STOP));
			}

			function _parseFileTransferResponseSuccess(res) {
				"use strict";
				var responseCode, bytesSent, responseString, responseJSON, result;
				responseCode = res.responseCode;
				bytesSent = res.bytesSent;
				responseString = res;
				responseJSON = null;
				result = {
					isSuccess: false
				};

				try {
					responseJSON = responseString || {};
					result.respMsg = responseJSON.responseMessage;
					result.responseCode = responseJSON.responseCode;
					result.resp = responseJSON.data;
					result.bytesSent = responseJSON.data.size;
					result.isSuccess = result.responseCode == 0;
				} catch (e) {
					result.isSuccess = false;
					result.resp = responseString;
					result.serverResponseCode = responseCode;
				}
				return result;
			}

			function _parseFileTransferResponseError(error) {
				"use strict";
				var result = {
					isSuccess: false
				};
				result.error = error;

				switch (error.code) {
					case FileTransferError.FILE_NOT_FOUND_ERR:
						result.respMsg = LANG.ERROR.FILE_TRANSFER_ERROR.FILE_NOT_FOUND;
						break;
					case FileTransferError.INVALID_URL_ERR:
						result.respMsg = LANG.ERROR.FILE_TRANSFER_ERROR.INVALID_URL;
						break;
					case FileTransferError.CONNECTION_ERR:
						result.respMsg = LANG.ERROR.NETWORK_FAILURE;
						break;
					case FileTransferError.ABORT_ERR:
						result.respMsg = LANG.ERROR.FILE_TRANSFER_ERROR.ABORT_ERR;
						break;
					case FileTransferError.NOT_MODIFIED_ERR:
						result.respMsg = LANG.ERROR.FILE_TRANSFER_ERROR.NOT_MODIFIED;
						break;

					default:
						result.respMsg = "Some unknown error occurred during file transfer.";
						if (result.exception) {
							result.respMsg += " --- Exception: " + result.exception;
						}
				}

				return result;
			}
		}

		function isUploadingFile() {
			"use strict";
			return !!_fileUploadOptions.inProgress;
		}


		/**
		 *
		 * @param url Upload URL
		 * @param file filePath
		 * @param options
		 * @returns {promise.promise|Function|*|jQuery.promise}
		 * @private
		 */
		function _upload_native_2(url, file, options) {
			var _options = options || {};
			var _deferred = $q.defer();

			var _file = file;
			if (!file) {
				_deferred.reject({
					respMsg: "Upload file path was not found."
				});
				return _deferred.promise;
			}
			var _params = options.params;

			var params = angular.copy({
				userSessionId: Session.id,
				data: _params,
				ext: 'jpeg'
			});

			// var _formData = new FormData();
			// _formData.append('efile', _file);
			// _formData.append('json', {
			// 	sessionId: Session.userId,
			// 	data: _params
			// });
			_notifyOnConnectListeners(new mobos.Utils.deferredNotification(CONNECT_NOTIFICATION.START));
			var win = function (r) {
				
				_notifyOnConnectListeners(new mobos.Utils.deferredNotification(CONNECT_NOTIFICATION.STOP));
				try {
					if (angular.isString(r)) {
						r = JSON.parse(r);
					}
					var result = _parse(r);
					//var result = _parse(r);

					console.log("parse result: ");
					console.log(result);
				
					params.fileName = result.resp;
					if (result.isSuccess) {
						console.log('File upload success.. Updating File record.');
						console.log(params);
						  blockUI.start('Updating Image', {
								status: 'isLoading'
							});
						_post(URL.UPLOAD_FILE_META, params).then(function (result) {
							"use strict";
							_deferred.resolve(result);
//							blockUI.stop();
						}, function (error) {
							"use strict";
							if (error.responseCode == 500) {
								  blockUI.stop('Error While Updating the image', {
										status: 'isError',
										action: 'Ok'
									});
							} else {
								blockUI.stop(error.respMsg, {
									status: 'isError',
									action: 'Ok'
								});
							}
							_deferred.reject(error);
						});
						_deferred.resolve(result);
					} else {
						_deferred.reject(result);
					}
				} catch (e) {
					_deferred.reject({
						isSuccess: false
					});
					_notifyOnConnectListeners(new mobos.Utils.deferredNotification(CONNECT_NOTIFICATION.STOP));
				}
			};
			var fail = function (error) {
				_notifyOnConnectListeners(new mobos.Utils.deferredNotification(CONNECT_NOTIFICATION.STOP));
				console.log("An error has occurred: Code = " + error.code);
				console.log("upload error source " + error.source);
				console.log("upload error target " + error.target);
				_deferred.reject(error);
			};

			var options = {};
			options.params = {
				json: params
			};
			options.fileKey = "efile";
			//options.fileName = '_filename.jpeg';
			//options.fileName = JSON.stringify(params);
			options.fileName = Session.id + "_" + "jpeg" + "_" + _params.imgType;
			options.mimeType = "text/plain";

			console.log(options);
			console.log("file path: " + _file);
			
			uploadProfileFromWeb(url, _file, options, win, fail, _deferred);
			
			return _deferred.promise;
		}

		function _upload(url, file, options) {
			var _options = options || {};
			var _deferred = $q.defer();

			var _file = file
			var _params = options.params;

			var _formData = new FormData();

			window.resolveLocalFileSystemURI(file, function (fileEntry) {
					console.log(fileEntry)
					_formData.append('efile', fileEntry);
					_formData.append('json', JSON.stringify({
						sessionId: Session.userId,
						data: _params
					}));

					$http.post(URL.UPLOAD_FILE, _formData, {
						headers: {'Content-Type': undefined
								 // 'X-Api-Key' : Securify.encrypt(X_API_KEY, 'kef')  
								  },
						transformRequest: angular.identity
					}).success(function (resp) {
						"use strict";
						_deferred.resolve(resp);
					}).error(function (error) {
						"use strict";
						_deferred.reject(error);
					});

				},
				function () {
					"use strict";

				}
			);

			//$http.post({
			//  url: url,
			//  data: _formData,
			//  dataType: 'text',
			//  processData: false,
			//  contentType: false,
			//  type: 'POST',
			//  success: function (data) {
			//    _deferred.resolve(data);
			//  },
			//  error: function (error) {
			//    _deferred.reject(error);
			//  }
			//});

			return _deferred.promise;
		}

		function __http(method, url, params, data, options) {
			var _deferred = $q.defer()
				, options = options || {}
				, params = angular.isDefined(params) ? params : {}
				, data = angular.isDefined(data) ? data : {}
				, parentDefer = options.parentDefer || null
				;

			var _default_headers = {
				//'Content-type': "text/plain"
				//'X-Api-Key' : Securify.encrypt(X_API_KEY, 'kef'),
				'Content-type': 'application/json'
			};

			var args = {
				method: method,
				url: url,
				params: params,
				data: data,
				options: options
			};
			

			function addSessionInfo() {
				if (method == 'GET') {
					params.userSessionId = Session.id;
				}
				if (method == 'POST' && URL.REGISTER != url && URL.SUPPORT_FEEDBACK != url) {
					data.userSessionId = Session.id;
				}
			}

			function sendReq() {
				$http({
					method: method,
					url: url,
					params: params,
					data: data,
					headers: _default_headers,
					//withCredentials: true,
					timeout: HTTP.DEFAULT_TIMEOUT
				})
					.success(function onGetSuccess(data, status, headers, config) {
						var _result = _parse(data, status, headers, config)
							;
						_notifyOnConnectListeners(new mobos.Utils.deferredNotification(CONNECT_NOTIFICATION.STOP));
						if (_result.isSuccess) {
							_deferred.resolve(_result);
							if (parentDefer) {
								parentDefer.resolve(_result);
							}
						} else {

							if (_result.responseCode == 2 && sessionResolver) {
								// Session expired
								_notifyOnSessionExpireListeners();
							} else {
								_deferred.reject(_result);
								if (parentDefer) {
									parentDefer.reject(_result);
								}
							}
						}
					})
					.error(function onGetError(data, status, headers, config) {
						_notifyOnConnectListeners(new mobos.Utils.deferredNotification(CONNECT_NOTIFICATION.STOP));
						var _result = _parseError(data, status);
						_deferred.reject(_result);
						if (parentDefer) {
							parentDefer.reject(_result);
						}
					});
			}

			//function sendAjax() {
			//  "use strict";
			//  $.ajax(url, {
			//    method: method,
			//    params: params,
			//    data: data,
			//    headers: _default_headers,
			//    //withCredentials: true,
			//    timeout: TIMEOUT
			//  }).promise()
			//    .then(function onGetSuccess(data, status, headers, config) {
			//      var _result = _parse(data);
			//      _notifyOnConnectListeners(new mobos.Utils.deferredNotification(CONNECT_NOTIFICATION.STOP));
			//      if (_result.isSuccess) {
			//        _deferred.resolve(_result);
			//        if (parentDefer) {
			//          parentDefer.resolve(_result);
			//        }
			//      } else {
			//
			//        if (_result.responseCode == 2 && sessionResolver) {
			//          // Session expired
			//          _notifyOnSessionExpireListeners();
			//        } else {
			//          _deferred.reject(_result);
			//          if (parentDefer) {
			//            parentDefer.reject(_result);
			//          }
			//        }
			//      }
			//    }, function onGetError(data, status, headers, config) {
			//      _notifyOnConnectListeners(new mobos.Utils.deferredNotification(CONNECT_NOTIFICATION.STOP));
			//      var _result = _parseError(data, status);
			//      _deferred.reject(_result);
			//      if (parentDefer) {
			//        parentDefer.reject(_result);
			//      }
			//    })
			//}

			addSessionInfo();
			_notifyOnConnectListeners(new mobos.Utils.deferredNotification(CONNECT_NOTIFICATION.START));
			sendReq();

			return _deferred.promise;
		}

		function _get(url, params, options) {
			return __http('GET', url, params, null, options);
		}

		function _post(url, data, parentDefer) {
			return __http('POST', url, null, data, {
				parentDefer: parentDefer
			});
		}

		function waitForSessionExpire() {
			sessionResolver = $q.defer();
			sessionExpireListersBucket.push({
				deferred: sessionResolver
			});
			return sessionResolver.promise;
		}

		function notificationObject(status, data) {
			this.status = status;
			this.data = data;
		}

		function _notifyOnConnectListeners(notificationObj) {
			angular.forEach(connectNotifyListersBucket, function (listener) {
				listener.deferred.notify(notificationObj);
			});
		}

		function _notifyOnSessionExpireListeners(notificationObj) {
			angular.forEach(sessionExpireListersBucket, function (listener) {
				listener.deferred.notify(notificationObj);
			});
			blockUI.reset();
		}

		function registerOnConnectNotify() {
			var deferred = $q.defer();

			connectNotifyListersBucket.push({
				deferred: deferred
			});

			return deferred.promise;
		}


		function _runMockBackend(argument) {
			$httpBackend.whenGET(URL.LOGIN).respond({
				responseCode: 0
			});
		}

		function _initialize(config) {

			connectNotifyListersBucket = [];

			angular.forEach(_config, function (value, key) {
				_config[key] = config[key];
			});

			// if(_config.mocksEnabled) {
			// 	_runMockBackend();
			// }
		}
		
		/*
		 * this function is used to upload files with drag and drop from web
		 * 
		 */
		function uploadFromWeb(url, params, file,winSuccess,failure,_deferred) {
			  var data = new FormData();
			  data.append('vaultfile', file);
			  blockUI.start('Uploading ...', {
					status: 'isLoading'
				});
			$http({
				method: 'POST',
				url: url,
				params: params,
				data: data,
				  headers: {
                        'Content-Type': undefined
                       // 'X-Api-Key' : Securify.encrypt(X_API_KEY, 'kef')
                    },
                    transformRequest: angular.identity,
				timeout: "180000"
			})
			 .success(function (res) {
                 winSuccess(res);
             })
             .error(function (error) {
           		failure(error);
             });
		}
		
		function uploadProfileFromWeb(url,file,options,winSuccess,failure,_deferred) {
			  var data = new FormData();
			  data.append('efile', file,options.fileName);
			  data.append('json', options);
			  blockUI.start('Updating Image', {
					status: 'isLoading'
				});
			$http({
				method: 'POST',
				url: url,
				data: data,
				  headers: {
                      'Content-Type': undefined
                     // 'X-Api-Key' : Securify.encrypt(X_API_KEY, 'kef')
                  },
                  transformRequest: angular.identity,
				timeout: HTTP.DEFAULT_TIMEOUT
			})
			 .success(function (res) {
               winSuccess(res);
           })
           .error(function (error) {
       		blockUI.stop('Error While Uploading the image', {	
				status: 'isError',
				action: 'Ok'
			});
           });
		}
		
		function _rejectPendReqAfterSessionExpire(){
			if(sessionExpireListersBucket){
				angular.forEach(sessionExpireListersBucket, function (listener) {
					listener.deferred.resolve();
				});
				sessionExpireListersBucket = [];
			}
			
		}
		
		return {
			initialize: _initialize,
			post: _post,
			get: _get,
			parse: _parse,
			uploadFile: uploadFile,
			isUploadingFile: isUploadingFile,
			upload: _upload_native_2,
			upload_form: _upload,
			registerOnConnectNotiy: registerOnConnectNotify,
			waitForSessionExpire: waitForSessionExpire,
			rejectPendReqAfterSessionExpire : _rejectPendReqAfterSessionExpire,
			uploadFromWeb:uploadFromWeb
		}

	}]);
