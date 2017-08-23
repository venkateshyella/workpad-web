/**
 * Created by sudhir on 18/5/15.
 */

;
(function () {
  "use strict";
  angular.module('mobos.utils')
    .service('ImagePicker', ImagePicker)
  ;


  function ImagePicker($q, $cordovaCamera, $mdBottomSheet, IMAGE_PRESET) {

    var defaults = {
      //quality: 50,
      destinationtype: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: true,
      encodingType: Camera.EncodingType.PNG,
      targetWidth: 1024,
      targetHeight: 512,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };

    var publicService = {
      grabNewImage: grabNewImage,
      IMAGE_PRESET: IMAGE_PRESET
    };
    return publicService;

    function grabNewImage(options) {
      var deferred = $q.defer();

      var photoOptions = angular.extend({}, defaults, options);

      $mdBottomSheet.show({
        templateUrl: 'components/angular-material/bottom-sheet/bottom-sheet-list.tpl.html',
        controller: ['$scope', '$mdBottomSheet', function ($scope, $mdBottomSheet) {
          $scope.subHeader = "Select Picture from";
          $scope.items = [
            {type: "CAMERA", name: 'Camera', icon: 'icon-left icon icon-camera-alt'},
            //{type: "PHOTOLIBRARY", name: 'Gallery', icon: 'icon-left icon icon-photo-library'},
            {type: "SAVEDPHOTOALBUM", name: 'Photo Album', icon: 'icon-left icon icon-picture'}
          ];
          $scope.listItemClick = function ($index) {
            var clickedItem = $scope.items[$index];
            $mdBottomSheet.hide(clickedItem);
          };
        }]
      }).then(function (item) {
        photoOptions.sourceType = Camera.PictureSourceType[item.type];
        $cordovaCamera.getPicture(photoOptions)
          .then(function(img) {
            deferred.resolve(img);
          }).catch(function(reason) {
            deferred.reject(reason);
          })
      });

      return deferred.promise;
    }
  }

  ImagePicker.$inject = ['$q', '$cordovaCamera', '$mdBottomSheet', 'IMAGE_PRESET'];


})();

