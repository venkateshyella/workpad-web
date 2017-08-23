/**
 * Created by sudhir on 15/7/15.
 */

;
(function () {
  "use strict";

  angular.module('app.services')
    .service('FileService', [
      '$q', 'Connect',
      'mDialog', '$mdToast',
      'blockUI', 'Lang','DataProvider', 
      'URL','State',
      FileService
    ])
  ;

  function FileService($q, Connect, Dialog, $mdToast, blockUI, Lang, DataProvider, URL, State) {
    var _filePickerConfirmDialogOptions = {
        active: false
      }
      , fileTranferQueue = []
      , fileBucket = {}
      , _dispatcher = {
        isActive: false
      }
      , LANG = Lang.en.data
      ;
    return {
      showFilePickerConfirmDialog: showFilePickerConfirmDialog,
      showFileUploadConfirmDialog: showFileUploadConfirmDialog,
      uploadFile: uploadFile,
      queueForUpload: queueForUpload,
      cancelFileTransferReq: cancelFileTransferReq,
      getFileTransferObjFromQueue: getFileTransferObjFromQueue,
      filterByTagName: filterByTagName,
      showFilePermissionsManager: showFilePermissionsManager,
      profileImageUpdate : profileImageUpdate,
      generateFileFromBlob : generateFileFromBlob,
      showCreateFolderDialog : showCreateFolderDialog

    };

    function showFilePermissionsManager(serverFileObject, fnFetchPermission, fnUpdatePermission, opts) {
      var deferred = $q.defer()
        , options = opts || {}
        , FilePermissionsManagerDialogOptions
        ;

      FilePermissionsManagerDialogOptions = {
        templateUrl: 'app/modules/file/templates/fileDetails.dialog.tpl.html',
        targetEvent: options.$event,
        controller: ['$scope', '$mdDialog',
          FilePermissionsManagerDialogController]
      };

      Dialog.show(FilePermissionsManagerDialogOptions, {
        clickOutsideToClose: !options.forcePermissionUpdate
      })
        .then(function (res) {
          deferred.resolve(res);
        })
        .catch(function (err) {
          deferred.reject(err);
        })
        .finally(function () {
        })
      ;

      return deferred.promise;

      function FilePermissionsManagerDialogController($scope, $mdDialog) {
        var self = this;
        $scope.fileDisplayName = serverFileObject.fileDisplayName;
        $scope.fileContextDisplayName = options.fileContextDisplayName;
        $scope.displaySize = mobos.Utils.getDisplaySize(serverFileObject.size);
        $scope.display_updatedAt = mobos.Utils.getDisplayDate(serverFileObject.updateTime);
        $scope.isPermissionsDirty = false;
        $scope.forcePermissionUpdate = options.forcePermissionUpdate || false;


        $scope.userPermissions = [];

        $scope.cancel = $mdDialog.cancel;
        $scope.update = update;
        $scope.toggleAllDownloadAccess = toggleAllDownloadAccess;
        $scope.allowAllDeleteAccess = allowAllDeleteAccess;
        $scope.onPermissionsChange = function (type, userPermission) {
          $scope.isPermissionsDirty = true;
          $scope.doAllMembersHaveDownloadAccess = isDownloadAccessAvailableToAll();

          switch (type) {
            case 'canDownload':
              !userPermission.canDownload && (userPermission.canDelete = false);
              break;
            case 'canDelete':
              userPermission.canDownload && (userPermission.canDelete = userPermission.canDelete ? false : true);
              break;
          }
        };

        self.fileObject = serverFileObject;

        $scope.loadNextPermissions = function () {
          $scope.isLoading_userPermissions = true;
          if ($scope.paginationData) {
            var nextPermissionPage = angular.copy($scope.paginationData);
            nextPermissionPage.pageNumber++;
            return fnFetchPermission(nextPermissionPage);
          } else {
            return fnFetchPermission();
          }
        };

        // Fetch permissions fn
        function updateScopeFromPermissionResult(res) {
          self.permissionsData = res.resp;
          self.permissionsList = res.resp.results;
          $scope.paginationData = res.resp.paginationMetaData;
          $scope.toSendNotification = false;
          $scope.pageSize = $scope.paginationData.pageSize;
          $scope.pageNumber = $scope.paginationData.pageNumber;
          $scope.isPaginated = $scope.paginationData.totalPages > 1;
          $scope.userPermissions = $scope.userPermissions.concat(res.resp.results || []);
          $scope.doAllMembersHaveDownloadAccess = isDownloadAccessAvailableToAll();


          

          /*for (var i in $scope.userPermissions) {
            if ($scope.userPermissions[i].canDownload) {
                     $scope.doAllMembersHaveDownloadAccess  = true;
            }
            else{
              $scope.doAllMembersHaveDownloadAccess  = false;
            }
          }*/

          $scope.remaining_results
            = $scope.paginationData.totalResults - $scope.userPermissions.length;

          $scope.nextResultsSetCount
            = $scope.remaining_results > $scope.pageSize ? $scope.pageSize : $scope.remaining_results;
        }

        $scope.refresh = function () {
          $scope.loadNextPermissions($scope.paginationData)
            .then(function (res) {
              updateScopeFromPermissionResult(res);
            })
            .catch(function (err) {
              Dialog.alert(err.respMsg || "Error loading permissions..");
              console.log(err);
            })
            .finally(function () {
              $scope.isLoading_userPermissions = false;
            });
        };

        $scope.refresh();

        // Update permissions fn
        $scope.isUpdating_userPermissions = false;
        function update() {
          if(!self.permissionsData) {
            return
          }
          $scope.isUpdating_userPermissions = true;
          var permissionUpdateData = {
            fileId: self.permissionsData.fileId,
            users: $scope.userPermissions

          };
          fnUpdatePermission(permissionUpdateData)
            //Connect.post(URL.ORG_PUT_FILE_PERMISSIONS, self.permissionsData)
            .then(function (res) {
              console.log(res);
              var msg = res.respMsg || "Permissions updated..";
              Dialog.alert(res.respMsg)
            })
            .catch(function (err) {
              console.log(err);
              Dialog.alert(err.respMsg || "Error updating permissions..")
            })
            .finally(function () {
              $scope.isPermissionsDirty = false;
              $scope.isUpdating_userPermissions = false;
            })
        }

        function isDownloadAccessAvailableToAll() {
          for (var i in $scope.userPermissions) {
            if (!$scope.userPermissions[i].canDownload) {
              return false;
            }
          }
          return $scope.userPermissions > 0 ? false : true;
        }

        function toggleAllDownloadAccess() {
          var i;
          for (i in $scope.userPermissions) {
            $scope.userPermissions[i].canDownload = $scope.doAllMembersHaveDownloadAccess;

            !$scope.doAllMembersHaveDownloadAccess
            && ($scope.userPermissions[i].canDelete = false)
          }
        }

        function allowAllDeleteAccess() {
        }
      }
    }

    function uploadFile(targetURL, fileURI, params, data, options) {
      var deferred = $q.defer();

    /*  if (!mobos.Platform.isWebView()) {
        // emulate success response..
        blockUI.reset();
        Dialog.alert({
          title: "File upload action",
          content: "Native file uploader in the WebView.",
          ok: "Ok"
        }).then(function () {
          var mockSuccessResponse = {
            resp: {
              id: 2,
              fileName: "actual_file_name",
              fileDisplayName: "Test file name",
              extType: "sql",
              size: 570303,
              canDelete: true,
              createTime: 1436789063747,
              updateTime: 1436789063747,
              admin: true
            },
            responseCode: 0,
            respMsg: "Success upload message from server",
            isSuccess: true
          };
          deferred.resolve(mockSuccessResponse);
        })
        ;
        return deferred.promise;
      }*/
//      
//      if (options.blockUI) {
//        blockUI.start("Uploading file..")
//      }
      
      Connect.uploadFile(targetURL, fileURI, {
        params: params,
        data: data,
        fileName: options.fileObject.name,
        fileKey: options.fileKey
      }).then(function (res) {
//          if (options.blockUI) {
//            blockUI.stop("File uploaded..")
//          }
          deferred.resolve(res);
        })
        .catch(function (err) {
        	blockUI.reset();
        	if (err.responseCode == 7) {
        		Dialog.confirm({
        			content: err.respMsg,
        			ok: 'Subscribe',
        			cancel: "Cancel"
        		}).then(function(err) {
        			deferred.reject(err);
        			State.transitionTo('root.app.subscription', {
        				orgId:params.orgId
        			}, {
        				FLAGS: {
        					CLEAR_STACK: true
        				}
        			});
        		}).catch(function() {

        		});
        	} else{
        		Dialog.alert({
        			content: err.respMsg,
        			ok: LANG.BUTTON.OK
        		}).then(function () {
        			deferred.reject(err);
        		});
        	};
        })
        .finally(function () {
        });

      return deferred.promise;
    }

    function showFilePickerConfirmDialog() {
      var deferred = $q.defer()
        , options
        , FilePickerDialogOptions
        ;
      if (_filePickerConfirmDialogOptions.active) {
        deferred.reject();
        return deferred.promise;
      }
//      options = opts || {};
      FilePickerDialogOptions = {
        controller: ['$scope', '$mdDialog', '$timeout',
          FilePickerDialogController],
        templateUrl: 'app/modules/file/templates/fileConfirm.dialog.tpl.html',
        clickOutsideToClose:false,
//        targetEvent: options.$event
      };
      Dialog.show(FilePickerDialogOptions)
        .then(function (res) {
          _filePickerConfirmDialogOptions.active = true;
          deferred.resolve(res)
        })
        .catch(function (err) {
          deferred.reject(err);
        })
        .finally(function () {
          _filePickerConfirmDialogOptions.active = false;
        })
      ;
      return deferred.promise;

      function FilePickerDialogController($scope, $mdDialog, $timeout) {
    	  
	      $scope.triggerFileNameInputFocus = false;
	      
	      $scope.getDisplaySize = function (fileSize) {
	    	  return mobos.Utils.getDisplaySize(fileSize);
	      }
        $scope.confirm = function () {
          return $mdDialog.hide($scope.fileObject);
        }
        $scope.cancel = $mdDialog.cancel;

	      $timeout(function() {
		      $scope.triggerFileNameInputFocus = true;
	      }, 1000)
      }
    }

    
    
    function showFileUploadConfirmDialog(params) {
        var deferred = $q.defer()
          , options
          , FilePickerDialogOptions
          ;
        if (_filePickerConfirmDialogOptions.active) {
          deferred.reject();
          return deferred.promise;
        }
//        options = opts || {};
        FilePickerDialogOptions = {
          controller: ['$scope', '$mdDialog', '$timeout',
            FilePickerDialogController],
          templateUrl: 'app/modules/file/templates/fileConfirm.dialog.tpl.html',
          clickOutsideToClose:false,
//          targetEvent: options.$event
        };
        Dialog.show(FilePickerDialogOptions)
          .then(function (res) {
            _filePickerConfirmDialogOptions.active = true;
            deferred.resolve(res)
          })
          .catch(function (err) {
            deferred.reject(err);
          })
          .finally(function () {
            _filePickerConfirmDialogOptions.active = false;
          })
        ;
        return deferred.promise;

        function FilePickerDialogController($scope, $mdDialog, $timeout) {
        	$scope.fileUploadModel = { file : null,
					    			  folderId : 0,
					    			  isNewFolder: false,
					    			  folderName : null
        						    };
        	
        	$scope.foldersList = [];
        	$scope.selectedFolder = null;
        	var defaultFolderHeader = {
        			id: -1,
        			name: "-- No Selection --"
        	};
        	
        	var _folderListParams = {
        			catId: params.catId,
        			catType: params.catType
        	};
        	
        	 DataProvider.resource.File.fetchFolderList(_folderListParams).then(function(result){
        		// $scope.foldersList = result;
        		 $scope.foldersList.push(defaultFolderHeader);
        		 
        		 angular.forEach(result, function (value, key) {
        			 $scope.foldersList.push(value);
        		 });

        		 $scope.selectedFolder = $scope.foldersList[0];
        		 
        		 if($scope.foldersList.length > 0){
        			 if(params.folderId){
        				var selFolder = _.find($scope.foldersList,{id:params.folderId});
        				if(selFolder){
        					$scope.selectedFolder = selFolder;
        				}
        			 }
        		 }
        		 
        	 });
      	  
          $scope.resetDDOptions = function(){
        	  $scope.selectedFolder = $scope.foldersList[0];
        	  $scope.fileUploadModel.folderName= '';
          };	 
        	 
  	      $scope.triggerFileNameInputFocus = false;
  	      
  	      $scope.getDisplaySize = function (fileSize) {
  	    	  return mobos.Utils.getDisplaySize(fileSize);
  	      }
          $scope.confirm = function () {
        	  $scope.fileUploadModel.file = $scope.fileObject;
        	  $scope.fileUploadModel.folderId = $scope.selectedFolder? $scope.selectedFolder.id : -1;
            return $mdDialog.hide($scope.fileUploadModel);
          }
          
          $scope.cancel = $mdDialog.cancel;

  	      $timeout(function() {
  		      $scope.triggerFileNameInputFocus = true;
  	      }, 1000)
        }
      }
    
    
    /**
     *
     * fileTransferObject Definition
     *
     * @id
     *  unique Id for the transfer activity.
     *
     * @fileObject.name
     *  File name
     *
     * @fileObject.fileURI
     *  URI from where file is read.
     *
     * @targetURL
     *
     * @params Query parameters
     *
     * @data JSON data.
     *
     * @tagName Tag name of the transfer object.
     *
     * @type File transfer type:
     *  - FILE_UPLOAD,
     *  - FILE_DOWNLOAD
     *
     * @status File transfer status.
     *  - INACTIVE
     *  - ACTIVE
     *  - CANCELLED
     *  - COMPLETE
     */

    /**
     * @desc Add new file to the upload queue.
     * Upload for this file will begin when there are no active uploads
     * queued ahead of this file.
     *
     * @fileName Name of the file.
     * @fileURI File URI form where the file is to be read.
     * @targetURL Target URL for the upload
     * @options
     *  - params Optional query parameters for the request.
     *  - data Optional JSON data to be sent with the request.
     *  - tagName Optional tag attached to this particular upload request.
     *    Later can be used to identify this queued object.
     */
    function queueForUpload(fileName, fileURI, targetURL, opts) {
      var options = opts || {}
        , _params = options.params
        , _tagName = options.tagName
        , _data = options.fileObject
        , deferred = $q.defer()
        ;
      var fileTransferObject = {
        id: mobos.Utils.nextUid(),
        fileObject: {
          name: fileName,
          fileURI: fileURI
        },
        targetURL: targetURL,
        params: _params,
        data: _data,
        tagName: _tagName,
        type: "UPLOAD_FILE",
        status: 'INACTIVE',
        deferred: deferred,
        options: options
      };
      fileBucket[fileTransferObject.id] = fileTransferObject;
      fileTranferQueue.push(fileTransferObject.id);
/*
      $mdToast.show(
        $mdToast.simple()
          .content('New file is queued for upload..')
          //.action('Dashboard')
          .position('bottom right')
          .hideDelay(4000)
      ); */
      _notify_newUploadReq();
      return deferred.promise;
    }

    function runJobDispatcher() {
      _dispatcher.isActive = true;
      var nextTransferJobId = fileTranferQueue.shift()
        , nextFileTransferObject = null
        ;
      if (nextTransferJobId) {
        nextFileTransferObject = fileBucket[nextTransferJobId];
   
        uploadFile(nextFileTransferObject.targetURL,
          nextFileTransferObject.fileObject.fileURI,
          nextFileTransferObject.params,
          nextFileTransferObject.data,
          nextFileTransferObject.options)
          .then(function (res) {
            nextFileTransferObject.deferred.resolve(res);
          })
          .catch(function (err) {
            nextFileTransferObject.deferred.reject(err);
          })
          .finally(function () {
            runJobDispatcher();
          })
      } else {
        _dispatcher.isActive = false;
      }
    }
    
    
    function profileImageUpdate(targetURL, fileURI, params, data, options) {
        var deferred = $q.defer();
//        if (options.blockUI) {
//          blockUI.start("Uploading file..")
//        }
        
        Connect.uploadFile(targetURL, fileURI, {
          params: params,
          data: data,
          fileName: options.fileObject.name,
          fileKey: options.fileKey
        }).then(function (res) {
//            if (options.blockUI) {
//              blockUI.stop("File uploaded..")
//            }
            deferred.resolve(res);
          })
          .catch(function (err) {
//            blockUI.reset();
            Dialog.alert({
              content: err.respMsg,
              ok: LANG.BUTTON.OK
            }).then(function () {
              deferred.reject(err);
            })
          })
          .finally(function () {
          })
        ;

        return deferred.promise;
      }
    
    
    function generateFileFromBlob(dataURI) {
    	var deferred = $q.defer();
    	   'use strict'
		    var byteString, 
		        mimestring 

		    if(dataURI.split(',')[0].indexOf('base64') !== -1 ) {
		        byteString = atob(dataURI.split(',')[1])
		    } else {
		        byteString = decodeURI(dataURI.split(',')[1])
		    }

		    mimestring = dataURI.split(',')[0].split(':')[1].split(';')[0]

		    var content = new Array();
		    for (var i = 0; i < byteString.length; i++) {
		        content[i] = byteString.charCodeAt(i)
		    }
			
		    deferred.resolve(new Blob([new Uint8Array(content)], {type: mimestring}));
		    
		    return deferred.promise; 
    	
    }
    
    function cancelFileTransferReq(fileId) {
    }

    function filterByTagName(tagName) {
      var fileObjects = _.filter(fileTranferQueue, function (fto) {
        return fto.tagName == tagName;
      });
      return fileObjects || [];
    }

    function getFileTransferObjFromQueue(fileId) {
    }

    function _notify_newUploadReq() {
      runJobDispatcher();
    }

    function showCreateFolderDialog(conParams) {
        var deferred = $q.defer()
          , options
          , createFolderDialogOptions
          ;
        
//        options = opts || {};
        createFolderDialogOptions = {
          controller: ['$scope', '$mdDialog', '$timeout',
           createFolderDialogController],
          templateUrl: 'app/modules/file/templates/createFolder.dialog.tpl.html',
          clickOutsideToClose:false,
//          targetEvent: options.$event
        };
        Dialog.show(createFolderDialogOptions)
          .then(function (res) {
           // _filePickerConfirmDialogOptions.active = true;
            deferred.resolve(res)
          })
          .catch(function (err) {
            deferred.reject(err);
          })
          .finally(function () {
           // _filePickerConfirmDialogOptions.active = false;
          })
        ;
        return deferred.promise;

        function createFolderDialogController($scope, $mdDialog, $timeout) {
      	  $scope.formModel = {};
      	  $scope.form = {};
  	     
          $scope.submit = function(){
        	  
        	  blockUI.start("Creating folder");
        	  var params = {
        			  catId: conParams.catId,
        			  catType: conParams.catType,
        			  folderName: $scope.formModel.folderName
        	  };
        	  
        	  DataProvider.resource.File.createFolder(params).then(function(result){
        		  console.log("create folder : "+JSON.stringify(result));
        		  
        		  if(result.responseCode == 0){
  					blockUI.stop("Created folder successfully", {
  						status: 'isSuccess',
  						action: LANG.BUTTON.OK
  					});
  				}else{
  					blockUI.stop();
  					Dialog.alert({
						content: result.responseMessage,
						ok: "Ok"
					});
  				}
        		  
        		  $mdDialog.hide(result);
        	  },function(err){
        		  blockUI.stop();
        		  if(err.respMsg){
        			  Dialog.alert({
  						content: err.respMsg,
  						ok: "Ok"
  					});
        		  }
					
        	  });
        	  
          };
          
          $scope.cancel = $mdDialog.cancel;

  	     
        }
      }
    
    
    
    //function _notify_newFileDownloadReq() {
    //}
  }

})();