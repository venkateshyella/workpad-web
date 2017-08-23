/**
 * Created by sudhir on 8/10/15.
 */

;
(function() {
    "use strict";

    angular.module('app')
        .controller('UploadFormPreviewViewController', ['$scope', '$stateParams',
            'DataProvider','FileSystem', 'FileService','Session',
            UploadFormPreviewViewController
        ]);

    function UploadFormPreviewViewController($scope, $stateParams, DataProvider,FileSystem, FileService,Session) {

          

        
         $scope.downloadFile =downloadFile;

         if($scope.field.keyValue){

         $scope.uploadedFileName  = $scope.field.keyValue.filename;                                             
         $scope.uploadedImageUrl = URL.FORM_FILE_DOWNLOAD + '?' + $.param({id: $scope.field.keyValue.id});
         }

         else{
           $scope.uploadedFileName = false;
         }

          function downloadFile() {
            var url = URL.FORM_FILE_DOWNLOAD + '?' + $.param({id: $scope.field.keyValue.id}),
                target = '_system';
            var ref = window.open(url, target);
        }

    }

})();
