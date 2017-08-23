/**
 * Created by sudhir on 8/10/15.
 */

;
(function() {
  "use strict";

  angular.module('app')
    .controller('LinkFormPreviewViewController', ['$scope', '$stateParams',
                'DataProvider', '$timeout', 'mDialog','blockUI', 'Session','VaultServices',
                LinkFormPreviewViewController
  ]);

  function LinkFormPreviewViewController($scope, $stateParams, DataProvider, $timeout, Dialog,blockUI, Session,VaultServices) {

    $scope.downloadFile = downloadFile;
    $scope.fileLst = $scope.field.keyValue;

    if(!$scope.field.keyValue){

       $scope.fileLst = [];

      // getJobFilesList();
     
    }

    function downloadFile(fileId){
            var url = URL.JOB_FILE_DOWNLOAD + ';' + $.param({
            jsessionid: Session.id
            }) + '?' + $.param({
            userSessionId: Session.id,
            id: fileId
            }),
            target = '_system';
           var ref = window.open(url, target);
     }

     function getJobFilesList() {

      blockUI.start("Loading Job Vault ", {
              status: 'isLoading'
      });

      var jobId  =  $stateParams.jobId;

       if(!jobId){
       
          jobId = DataProvider.resource.Form.get($stateParams.formId).task.job.id;
       }

      VaultServices.FetchJobVaultFiles(jobId)
        .then(function(filesList) {
          $scope.filesList = filesList;

          angular.forEach(filesList, function(value, key) {
            var tempFileListObj = {
              fileName: value.fileDisplayName,
              fileId: value.id,
              selected: false
            }
            $scope.fileLst.push(tempFileListObj);
          });

          $timeout(function() {});

        }).catch(function(error) {

          blockUI.stop(error.respMsg, {
            status: 'isError',
            action: 'Ok'
          });

        }).finally(function() {
          blockUI.stop();
      });

    }
    
  }
})();
