(function (window, document, mobos) {
	var viewportTag;
	var viewportProperties = {};

	mobos = mobos || {};
	window.mobos = mobos;

	var VIEWPORT_UPDATE_TRIGGER_DELAY_SHORT = 200;
	var VIEWPORT_UPDATE_TRIGGER_DELAY_MEDIUM = 500;
	var VIEWPORT_UPDATE_TRIGGER_DELAY_LONG = 700;

	var orientationIn = null;

	mobos.Viewport = {

		isKeyPadUp: false,
		keypadHeight: 0,

		orientation: function () {
			/**
			 * 0 = Portrait
			 * 90 = Landscape
			 */

			/**
			 * Using window.innerWidth/innerHeight ratio.
			 * Dose not work for small devices:
			 *    when keyboard is up, innerWidth becomes larger than innerHeight,
			 *    resulting in incorrect orientation value.
			 */
			//return (window.innerWidth > window.innerHeight ? 90 : 0);

			/**
			 * Using 'cordova-yoik-screenorientation' plugin
			 * ref: https://github.com/yoik/cordova-yoik-screenorientation
			 *
			 * Supported Orientations:
			 *
			 * portrait-primary The orientation is in the primary portrait mode.
			 * portrait-secondary The orientation is in the secondary portrait mode.
			 * landscape-primary The orientation is in the primary landscape mode.
			 * landscape-secondary The orientation is in the secondary landscape mode.
			 * portrait The orientation is either portrait-primary or portrait-secondary (sensor).

			 landscape The orientation is either landscape-primary or landscape-secondary (sensor).
			 */
			var PORTRAIT_REGEX = /^(portrait)-{0,1}\w*$/;
			var LANDSCAPE_REGEX = /^(landscape)-{0,1}\w*$/;

			if (mobos.Platform.isAndroid()) {

				/**
				 * Using crosswalk screen orientation api
				 * */
				return window.screen.orientation.angle;
			} else {

				/**
				 * Using cordova-yoik-screenorientation
				 * */
				//return LANDSCAPE_REGEX.test(window.screen.orientation) ? 90 : 0;


				/**
				 * Using window.orientation
				 */
				return window.orientation;
			}


		},

		/**
		 * portrait-primary The orientation is in the primary portrait mode.
		 * portrait-secondary The orientation is in the secondary portrait mode.
		 * landscape-primary The orientation is in the primary landscape mode.
		 * landscape-secondary The orientation is in the secondary landscape mode.
		 * portrait The orientation is either portrait-primary or portrait-secondary (sensor).
		 * landscape The orientation is either landscape-primary or landscape-secondary (sensor).
		 *
		 * */
		lockOrientation: function (ORIENTATION_STRING) {
			"use strict";
			var o = ORIENTATION_STRING || screen.orientation;
			if (o != orientationIn) {
				console.log('locking orientation to: ' + o);
				screen.lockOrientation(o);
				orientationIn = o;
			}
		},
		unLockOrientation: function () {
			"use strict";
			screen.unlockOrientation();
		},
		$initialize: function () {

			var viewportUpdateTriggerDelay
				= mobos.Platform.isIOS() ? VIEWPORT_UPDATE_TRIGGER_DELAY_MEDIUM : VIEWPORT_UPDATE_TRIGGER_DELAY_LONG;

			viewportLoadTag();

			window.addEventListener("orientationchange", function () {
				setTimeout(function () {
					viewportUpdate();
					mobos.trigger('mobos.orientationChange');
				}, viewportUpdateTriggerDelay);
			}, false);

			window.addEventListener("native.keyboardshow", function (e) {
				var keyboardShowEvent = e;
				//document.body.classList.add('keyboard-open');
				mobos.Viewport.isKeyPadUp = true;
				//mobos.Viewport.keypadHeight = e && e.detail && e.detail.keyboardHeight;
				setTimeout(function () {
					viewportUpdate();
					mobos.trigger('mobos.keyboardshow', keyboardShowEvent);
				}, viewportUpdateTriggerDelay);
			}, false);

			window.addEventListener("native.keyboardhide", function (e) {
				var keyboardHideEvent = e;
				mobos.Viewport.isKeyPadUp = false;
				//document.body.classList.remove('keyboard-open');
				setTimeout(function () {
					viewportUpdate();
					mobos.trigger('mobos.keyboardhide', keyboardHideEvent);
				}, viewportUpdateTriggerDelay);
			}, false);

		},

		screen: function () {
			//return {
			//  height: window.innerHeight,
			//  width: window.innerWidth
			//}
			var height = window.screen.height
				, width = window.screen.width;
			if (mobos.Platform.isAndroid()) {
				height = window.innerHeight;
				width = window.innerWidth;
			}
			if (mobos.Platform.isWebView()) {
				if (Math.abs(this.orientation()) == 90) {
					/**
					 * interchange height and width properties for iOS
					 * */
					if (mobos.Platform.isIOS()) {
						return {
							height: width,
							width: height
						}
					} else {
						return {
							height: height,
							width: width
						}
					}
				} else {
					return {
						height: height,
						width: width
					}
				}
			} else {
				return {
					height: height,
					width: width
				}
			}
		}

	};

	function viewportLoadTag() {
		var x;

		for (x = 0; x < document.head.children.length; x++) {
			if (document.head.children[x].name == 'viewport') {
				viewportTag = document.head.children[x];
				break;
			}
		}

		if (viewportTag) {
			var props = viewportTag.content.toLowerCase().replace(/\s+/g, '').split(',');
			var keyValue;
			for (x = 0; x < props.length; x++) {
				if (props[x]) {
					keyValue = props[x].split('=');
					viewportProperties[keyValue[0]] = (keyValue.length > 1 ? keyValue[1] : '_');
				}
			}
			viewportUpdate();
		}
	}

	function viewportUpdate() {
		// unit tests in viewport.unit.js

		var initWidth = viewportProperties.width;
		var initHeight = viewportProperties.height;
		var p = mobos.Platform;
		var version = p.version();
		var DEVICE_WIDTH = 'device-width';
		var DEVICE_HEIGHT = 'device-height';
		var orientation = mobos.Viewport.orientation();

		// Most times we're removing the height and adding the width
		// So this is the default to start with, then modify per platform/version/oreintation
		delete viewportProperties.height;
		viewportProperties.width = DEVICE_WIDTH;

		if (p.isIPad()) {
			// iPad

			if (version > 7) {
				// iPad >= 7.1
				// https://issues.apache.org/jira/browse/CB-4323
				delete viewportProperties.width;

			} else {
				// iPad <= 7.0

				if (p.isWebView()) {
					// iPad <= 7.0 WebView

					if (orientation == 90) {
						// iPad <= 7.0 WebView Landscape
						viewportProperties.height = '0';

					} else if (version == 7) {
						// iPad <= 7.0 WebView Portait
						viewportProperties.height = DEVICE_HEIGHT;
					}
				} else {
					// iPad <= 6.1 Browser
					if (version < 7) {
						viewportProperties.height = '0';
					}
				}
			}

		} else if (p.isIOS()) {
			// iPhone

			if (p.isWebView()) {
				// iPhone WebView

				if (version > 7) {
					// iPhone >= 7.1 WebView
					delete viewportProperties.width;

				} else if (version < 7) {
					// iPhone <= 6.1 WebView
					// if height was set it needs to get removed with this hack for <= 6.1
					if (initHeight) viewportProperties.height = '0';

				} else if (version == 7) {
					//iPhone == 7.0 WebView
					viewportProperties.height = DEVICE_HEIGHT;
				}

			} else {
				// iPhone Browser

				if (version < 7) {
					// iPhone <= 6.1 Browser
					// if height was set it needs to get removed with this hack for <= 6.1
					if (initHeight) viewportProperties.height = '0';
				}
			}

		}

		// only update the viewport tag if there was a change
		if (initWidth !== viewportProperties.width || initHeight !== viewportProperties.height) {
			viewportTagUpdate();
		}
	}

	function viewportTagUpdate() {
		var key, props = [];
		for (key in viewportProperties) {
			if (viewportProperties[key]) {
				props.push(key + (viewportProperties[key] == '_' ? '' : '=' + viewportProperties[key]));
			}
		}

		viewportTag.content = props.join(', ');
	}

})(window, document, window.mobos);
