/**
 * Created by sudhir on 8/10/15.
 */

;
(function() {
  "use strict";

  angular.module('app')
    .controller('LinkFormPartialViewController', ['$scope', '$stateParams',
                'DataProvider', '$timeout', 'mDialog','blockUI', 'VaultServices',
                LinkFormPartialViewController
  ]);

  function LinkFormPartialViewController($scope, $stateParams, DataProvider, $timeout, Dialog,blockUI, VaultServices) {

   // $scope.getFileLinkClicked = getFileLinkClicked;
    $scope.removeSelectedFile = removeSelectedFile;
   // $scope.selectedFiles = [];
    $scope.availableFiles = [];
    $scope.selectionChange = selectionChange;
     getJobFilesList();

    function getJobFilesList() {

      blockUI.start("Loading Job Vault ", {
              status: 'isLoading'
      });

      var jobId  =  $stateParams.jobId;

      /* var formId  = $scope.formField.formId;
       var formModel  =  DataProvider.resource.Form.get(formId);*/

      VaultServices.FetchJobVaultFiles(jobId)
        .then(function(filesList) {
          $scope.filesList = filesList;

          angular.forEach(filesList, function(value, key) {
            var tempFileListObj = {
              fileName: value.fileDisplayName,
              fileId: value.id,
              selected: false
            }
            $scope.availableFiles.push(tempFileListObj);
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
    function selectionChange(file){

      var selectedFiles = [];

      angular.forEach($scope.availableFiles, function(value, key) {
        if (value.selected == true) {
          selectedFiles.push(value);
        }

      });

      $scope.formField.keyValue = selectedFiles;
    }

    function getFileLinkClicked() {
        getFileLink().then(function(data) {
                $scope.selectedFiles = data.selectedFiles;
                updateFormField();
                $timeout(function() {});
            });
    }

    function removeSelectedFile(index) {
            $scope.selectedFiles.splice(index, 1);
            updateFormField();
    }

    function updateFormField() {
            $scope.formField.keyValue = $scope.selectedFiles;
    }

/*        function getFileLink() {
            return Dialog.show({
                controller: ['$scope', '$controller', '$timeout', '$mdDialog', 'blockUI', 'VaultServices',
                    function selectFilesDialogController($scope, $controller, $timeout, $mdDialog, blockUI, VaultServices) {

                        getJobFilesList();
                        var self = this;

                        $scope.tempFileList = [];

                        function getJobFilesList() {


                            blockUI.start("Loading Job Vault ", {
                                status: 'isLoading'
                            });

                            VaultServices.FetchJobVaultFiles(115)
                                .then(function(filesList) {
                                    $scope.filesList = filesList;

                                    angular.forEach(filesList, function(value, key) {
                                        var tempFileListObj = {
                                            fileName: value.fileDisplayName,
                                            fileId: value.id,
                                            selected: false
                                        }
                                        $scope.tempFileList.push(tempFileListObj);
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

                        $scope.cancel = $mdDialog.cancel;

                        $scope.linkFile = function linkFile() {
                            var selectedFiles = [];

                            angular.forEach($scope.tempFileList, function(value, key) {
                                if (value.selected == true) {
                                    selectedFiles.push(value);
                                }

                            });

                            console.log($scope.tempFileList);
                            $mdDialog.hide({
                                selectedFiles: selectedFiles
                            });
                        };

                    }

                ],
                templateUrl: 'app/modules/form/templates/filelink-field/filelink-form.filelist.dialog.tpl.html'
            });


        }*/
    }

})();
