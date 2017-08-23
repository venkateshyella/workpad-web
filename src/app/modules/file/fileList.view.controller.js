/**
 * Created by sudhir on 10/7/15.
 */

;
(function () {
  "use strict";

  angular.module('app')
    .controller('FileListViewController', [
      '$scope', '$q', 'FileService', 'fileReader', 'Connect', 'URL',
      FileListViewController
    ])
  ;

  function FileListViewController($scope, $q, FileService, fileReader, Connect, URL) {

    $scope.data = {
      files: [],
      inputFiles: []
    };

    /**
     *
     * File object definition:
     * - name: Display name of the file.
     * - type: File type, i.e. image/png, image/jpeg ...
     * - size: Size of the file in bytes.
     * - dataUrl: Filesystem URL of the file for FileTransfer library.
     */

    $scope.invokeFileChooser = function () {
      if($scope.inProgress) return;
      $scope.uploadDone = false;
      $scope.error = null;

      //fileChooser.open(success, error);

      FileService.pickFile()
        .then(function (file) {
          $scope.data.files = [];
          $scope.data.files.push(file);
        })
        .catch(function (reject) {
          $scope.data.files = [];
          console.log(reject);
        })
    };

    $scope.onFileInputChange = function () {
      $scope.noti = null;
      $scope.error = null;
      $scope.data.files = [];

      console.log($scope.data.inputFiles);
      var dataUrl = null
        , file = $scope.data.inputFiles[0]
        ;
      var newFile = {
        name: file.name,
        size: file.size,
        dataUrl: null,
        File: file
      };

      $scope.data.files.push(newFile);

      $scope.imageSrc = null;
      $scope.inProgress = true;
      $scope.uploadDone = false;
      fileReader.readAsDataUrl(file, $scope)
        .then(function (result) {
          dataUrl = result;
          newFile.dataUrl = result;
        })
        .finally(function () {
          $scope.inProgress = false;
        });
    };

    $scope.upload = function (file) {
      console.log(file);
      $scope.error = null;
      var userSessionId = $scope.session.id;
      $scope.noti = null;
      $scope.inProgress = true;
      Connect.uploadFile(URL.ORG_FILE_UPLOAD,
        file.dataUrl,
        {
          fileKey: 'vaultfile',
          params: {
            orgId: 134,
            userSessionId: userSessionId
          }
        })
        .then(function (res) {
          console.log(res);
          $scope.uploadDone = true;
        }, null, onUploadNotify)
        .catch(function (error) {
          console.log(error);
          $scope.error = error;
        })
        .finally(function () {
          $scope.inProgress = false;
        });

      function onUploadNotify(noti) {
        $scope.inProgress = true;
        $scope.noti = noti;
      }
    }


  }

})();