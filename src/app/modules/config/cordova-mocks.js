/**
 * Created by sudhir on 18/5/15.
 */


;(function () {
	"use strict";

	window.Camera = window.Camera || {
			DestinationType: {
				DATA_URL: 0,         // Return base64 encoded string
				FILE_URI: 1,         // Return file uri (content://media/external/images/media/2 for Android)
				NATIVE_URI: 2        // Return native uri (eg. asset-library://... for iOS)
			},
			EncodingType: {
				JPEG: 0,             // Return JPEG encoded image
				PNG: 1               // Return PNG encoded image
			},
			MediaType: {
				PICTURE: 0,          // allow selection of still pictures only. DEFAULT. Will return format specified via
				                     // DestinationType
				VIDEO: 1,            // allow selection of video only, ONLY RETURNS URL
				ALLMEDIA: 2         // allow selection from all media types
			},
			PictureSourceType: {
				PHOTOLIBRARY: 0,    // Choose image from picture library (same as SAVEDPHOTOALBUM for Android)
				CAMERA: 1,          // Take picture from camera
				SAVEDPHOTOALBUM: 2  // Choose image from picture library (same as PHOTOLIBRARY for Android)
			},
			PopoverArrowDirection: {
				ARROW_UP: 1,        // matches iOS UIPopoverArrowDirection constants to specify arrow location on popover
				ARROW_DOWN: 2,
				ARROW_LEFT: 4,
				ARROW_RIGHT: 8,
				ARROW_ANY: 15
			},
			Direction: {
				BACK: 0,
				FRONT: 1
			}
		}

	var CameraPopoverOptions = function (x, y, width, height, arrowDir) {
		// information of rectangle that popover should be anchored to
		this.x = x || 0;
		this.y = y || 32;
		this.width = width || 320;
		this.height = height || 480;
		// The direction of the popover arrow
		this.arrowDir = arrowDir || Camera.PopoverArrowDirection.ARROW_ANY;
	};
	window.CameraPopoverOptions = window.CameraPopoverOptions || CameraPopoverOptions;

})();