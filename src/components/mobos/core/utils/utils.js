;
(function (mobos) {

	mobos = mobos || {};
	window.mobos = mobos;


	var uid = ['0', '0', '0']
		, MS_PER_SEC = 1000
		, MS_PER_MIN = 1000 * 60
		, MS_PER_HR = 1000 * 60 * 60
		, MS_PER_DAY = 1000 * 60 * 60 * 24
		, MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365
		;

	var LANG = {
		TODAY_PREFIX: 'today ',
		YESTERDAY_PREFIX: 'yesterday '
	};

	mobos.Utils = {
		escapeRegExp: function (str) {
			return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
		},
		setLangAssets: function (langJSON) {
			"use strict";
			LANG = langJSON;
		},
		imgHashCounter: Math.random().toString(36).substring(7),
		renewImgHash: function () {
			"use strict";
			mobos.Utils.imgHashCounter = Math.random().toString(36).substring(7)
		},
		// Changes XML to JSON
		xmlToJson: function (xml) {

			// Create the return object
			var obj = {};

			if (xml.nodeType == 1) { // element
				// do attributes
				if (xml.attributes.length > 0) {
					obj["$_attributes"] = {};
					for (var j = 0; j < xml.attributes.length; j++) {
						var attribute = xml.attributes.item(j);
						obj["$_attributes"][attribute.nodeName] = attribute.nodeValue;
					}
				}
			} else if (xml.nodeType == 3) { // text
				obj = xml.nodeValue;
			}

			// do children
			if (xml.hasChildNodes()) {
				for (var i = 0; i < xml.childNodes.length; i++) {
					var item = xml.childNodes.item(i);
					var nodeName = item.nodeName;
					if (typeof(obj[nodeName]) == "undefined") {
						obj[nodeName] = mobos.Utils.xmlToJson(item);
					} else {
						if (typeof(obj[nodeName].push) == "undefined") {
							var old = obj[nodeName];
							obj[nodeName] = [];
							obj[nodeName].push(old);
						}
						obj[nodeName].push(mobos.Utils.xmlToJson(item));
					}
				}
			}
			return obj;
		},

		getDisplaySize: function (size) {
			"use strict";
			var sizeInKb = size / 1024
				, sizeInMb = sizeInKb / 1024
				;
			if (sizeInKb < 1) {
				return (Math.round(size * 100) / 100) + ' b';
			} else if (sizeInMb < 1) {
				return (Math.round(sizeInKb * 100) / 100) + ' Kb';
			} else {
				return (Math.round(sizeInMb * 100) / 100) + ' Mb';
			}
		},

		formatDate: function (dateInMilliSeconds, options) {
			"use strict";

			var formatString = 'DD/MM/YYYY';

			// Using Moment.js
			var m = moment(dateInMilliSeconds);
			return m.format(formatString);
		},

		getCalendarDate: function (dateInMilliSeconds, options) {
			var m = moment(dateInMilliSeconds);

			if (m.calendar().indexOf("Yesterday") > -1) {
				return m.format('dddd');
			}
			else if (m.calendar().indexOf("Last") > -1) {
				return m.format('dddd');
			}
			else if (m.calendar().indexOf("Today") > -1) {
				return m.calendar().replace("Today at", "");
			}
			else {
				return m.calendar();
			}


		},
		getDisplayDate: function (dateInMilliSeconds, options) {
			"use strict";

			var options = options || {}
				, M
				, m
				, formatString = 'D '
				;
			/**
			 *
			 * Date field format:
			 * 20 Oct
			 */

			M = "MMM";
			if (options.fullMonth) {
				M = "MMMM";
			}
			formatString = formatString + M;

			if (options.year) {
				formatString = formatString + ' YYYY';
			}

			// Using Moment.js
			m = moment(dateInMilliSeconds);
			return m.format(formatString);

			//return new Date(dateInMilliSeconds).toLocaleDateString();
		},

		createDateFormatter: function (formatString) {
			"use strict";
			var outputFormatString = formatString;

			return function (dateInMilliSeconds) {
				return moment(dateInMilliSeconds)
					.format(outputFormatString);
			}
		},

		getDisplayDateOffset: function getDisplayDateOffset(formattedDateTime, options) {
			"use strict";
			var m = moment(formattedDateTime)
				, m_curr = moment()
				, m_diff = m_curr.diff(m)
				;
			if (m_diff < MS_PER_HR * 5) {
				return m.fromNow(true);
			}
			else if (m_diff < MS_PER_DAY) {
				if (m_curr.date() == m.date()) {
					return LANG.TODAY_PREFIX + mobos.Utils.getDisplayTime(formattedDateTime);
				}
				else if (m_curr.date() == m.date() + 1) {
					return LANG.YESTERDAY_PREFIX + mobos.Utils.getDisplayTime(formattedDateTime);
				}
			}
			else {
				return mobos.Utils.getDisplayDate(formattedDateTime, {year: true});
			}
		},

		getDisplayTime: function getDisplayTime(formattedDateTime) {
			"use strict";

			// Using moment.js
			return moment(formattedDateTime).format('h:mm a');

			//return new Date(formattedDate).toLocaleTimeString();
		},

		getDisplayDateTime: function getDisplayDateTime(formattedDateTime, options) {
			return moment(formattedDateTime).format('D MMM h:mm a');
		},

		getDisplayDateTimeOffset: function getDisplayDateTimeOffset(formattedDateTime, options) {
			"use strict";
			if (!formattedDateTime) {
				return "";
			}
			var m = moment(formattedDateTime)
				, m_curr = moment()
				, m_diff = m_curr.diff(m)
				, _options = options || {}
				;
			if (m_diff > MS_PER_HR * 12) {
				return _options.showFrom ? m.fromNow(true) : m.format('D MMM h:mm a');
			} else if (m_curr.date() == m.date()) {
				return LANG.TODAY_PREFIX + mobos.Utils.getDisplayTime(formattedDateTime);
			} else if (m_curr.date() == m.date() + 1) {
				return LANG.YESTERDAY_PREFIX + mobos.Utils.getDisplayTime(formattedDateTime);
			} else {
				return mobos.Utils.getDisplayDateTime(formattedDateTime);
			}
		},
		
		getDisplayDateSet: function getDisplayDateSet(formattedDateTime) {
			"use strict";

			// Using moment.js
			return moment(formattedDateTime).format('dddd, DD MMM');

			//return new Date(formattedDate).toLocaleTimeString();
		},
		
		getDisplayDateOff: function getDisplayDateOff(formattedDateTime, options) {
			"use strict";
			if (!formattedDateTime) {
				return "";
			}
			var m = moment(formattedDateTime)
				, m_curr = moment()
				, m_diff = m_curr.diff(m)
				, _options = options || {}
				;
//		if (m_curr.date() == m.date()) {
//				return LANG.TODAY_PREFIX;
//			} else if (m_curr.date() == (m.date() + 1)) {
//				return LANG.YESTERDAY_PREFIX;
//			} else {
				return mobos.Utils.getDisplayDateSet(formattedDateTime);
//			}
		},

		getDateTimeOffset: function (formattedDateTime, currDate) {
			"use strict";
			var currentDateTime = currDate || new Date().getTime();
			var targetDate = new Date(formattedDateTime);

			var diff = (currentDateTime - targetDate);
			var duration = {};

			duration.milli = diff;
			duration.year = Math.floor(diff / MS_PER_YEAR);
			duration.day = Math.floor((diff % MS_PER_YEAR) / MS_PER_DAY);
			duration.hr = Math.floor(((diff % MS_PER_YEAR) % MS_PER_DAY) / MS_PER_HR);
			duration.min = Math.floor((((diff % MS_PER_YEAR) % MS_PER_DAY) % MS_PER_HR) / MS_PER_MIN);
			duration.sec = Math.floor(((((diff % MS_PER_YEAR) % MS_PER_DAY) % MS_PER_HR) % MS_PER_MIN) / MS_PER_SEC);

			return duration;
		},

		arrayMove: function (arr, old_index, new_index) {
			if (new_index >= arr.length) {
				var k = new_index - arr.length;
				while ((k--) + 1) {
					arr.push(undefined);
				}
			}
			arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
			return arr;
		},

		/**
		 * Return a function that will be called with the given context
		 */
		proxy: function (func, context) {
			var args = Array.prototype.slice.call(arguments, 2);
			return function () {
				return func.apply(context, args.concat(Array.prototype.slice.call(arguments)));
			};
		},

		/**
		 * Only call a function once in the given interval.
		 *
		 * @param func {Function} the function to call
		 * @param wait {int} how long to wait before/after to allow function calls
		 * @param immediate {boolean} whether to call immediately or after the wait interval
		 */
		debounce: function (func, wait, immediate) {
			var timeout, args, context, timestamp, result;
			return function () {
				context = this;
				args = arguments;
				timestamp = new Date();
				var later = function () {
					var last = (new Date()) - timestamp;
					if (last < wait) {
						timeout = setTimeout(later, wait - last);
					} else {
						timeout = null;
						if (!immediate) result = func.apply(context, args);
					}
				};
				var callNow = immediate && !timeout;
				if (!timeout) {
					timeout = setTimeout(later, wait);
				}
				if (callNow) result = func.apply(context, args);
				return result;
			};
		},

		/**
		 * Throttle the given fun, only allowing it to be
		 * called at most every `wait` ms.
		 */
		throttle: function (func, wait, options) {
			var context, args, result;
			var timeout = null;
			var previous = 0;
			options || (options = {});
			var later = function () {
				previous = options.leading === false ? 0 : Date.now();
				timeout = null;
				result = func.apply(context, args);
			};
			return function () {
				var now = Date.now();
				if (!previous && options.leading === false) previous = now;
				var remaining = wait - (now - previous);
				context = this;
				args = arguments;
				if (remaining <= 0) {
					clearTimeout(timeout);
					timeout = null;
					previous = now;
					result = func.apply(context, args);
				} else if (!timeout && options.trailing !== false) {
					timeout = setTimeout(later, remaining);
				}
				return result;
			};
		},
		// Borrowed from Backbone.js's extend
		// Helper function to correctly set up the prototype chain, for subclasses.
		// Similar to `goog.inherits`, but uses a hash of prototype properties and
		// class properties to be extended.
		inherit: function (protoProps, staticProps) {
			var parent = this;
			var child;

			// The constructor function for the new subclass is either defined by you
			// (the "constructor" property in your `extend` definition), or defaulted
			// by us to simply call the parent's constructor.
			if (protoProps && protoProps.hasOwnProperty('constructor')) {
				child = protoProps.constructor;
			} else {
				child = function () {
					return parent.apply(this, arguments);
				};
			}

			// Add static properties to the constructor function, if supplied.
			angular.extend(child, parent, staticProps);

			// Set the prototype chain to inherit from `parent`, without calling
			// `parent`'s constructor function.
			var Surrogate = function () {
				this.constructor = child;
			};
			Surrogate.prototype = parent.prototype;
			child.prototype = new Surrogate();

			// Add prototype properties (instance properties) to the subclass,
			// if supplied.
			if (protoProps) angular.extend(child.prototype, protoProps);

			// Set a convenience property in case the parent's prototype is needed
			// later.
			child.__super__ = parent.prototype;

			return child;
		},

		// Extend adapted from Underscore.js
		extend: function (obj) {
			var args = Array.prototype.slice.call(arguments, 1);
			for (var i = 0; i < args.length; i++) {
				var source = args[i];
				if (source) {
					for (var prop in source) {
						obj[prop] = source[prop];
					}
				}
			}
			return obj;
		},

		/**
		 * A consistent way of creating unique IDs in angular. The ID is a sequence of alpha numeric
		 * characters such as '012ABC'. The reason why we are not using simply a number counter is that
		 * the number string gets longer over time, and it can also overflow, where as the nextId
		 * will grow much slower, it is a string, and it will never overflow.
		 *
		 * @returns an unique alpha-numeric string
		 */
		nextUid: function () {
			var index = uid.length;
			var digit;

			while (index) {
				index--;
				digit = uid[index].charCodeAt(0);
				if (digit == 57 /*'9'*/) {
					uid[index] = 'A';
					return uid.join('');
				}
				if (digit == 90  /*'Z'*/) {
					uid[index] = '0';
				} else {
					uid[index] = String.fromCharCode(digit + 1);
					return uid.join('');
				}
			}
			uid.unshift('0');
			return uid.join('');
		},

		deferredNotification: function deferredNotification(status, data) {
			this.status = status;
			this.data = data;
		},

		isStrictUrl: function isStrictUrl(url) {
			var regexp = /((http|https):\/\/)[A-Za-z0-9\.-]{3,}\.[A-Za-z]{2}/;
			return url.indexOf(' ') < 0 && regexp.test(url);
		},

		disconnectScope: function disconnectScope(scope) {
			if (!scope) return;

			if (scope.$root === scope) {
				return; // we can't disconnect the root node;
			}
			var parent = scope.$parent;
			scope.$$disconnected = true;

			// See Scope.$destroy
			if (parent.$$childHead === scope) {
				parent.$$childHead = scope.$$nextSibling;
			}
			if (parent.$$childTail === scope) {
				parent.$$childTail = scope.$$prevSibling;
			}
			if (scope.$$prevSibling) {
				scope.$$prevSibling.$$nextSibling = scope.$$nextSibling;
			}
			if (scope.$$nextSibling) {
				scope.$$nextSibling.$$prevSibling = scope.$$prevSibling;
			}
			scope.$$nextSibling = scope.$$prevSibling = null;
		},

		reconnectScope: function reconnectScope(scope) {
			if (!scope) return;

			if (scope.$root === scope) {
				return; // we can't disconnect the root node;
			}
			if (!scope.$$disconnected) {
				return;
			}
			var parent = scope.$parent;
			scope.$$disconnected = false;
			// See Scope.$new for this logic...
			scope.$$prevSibling = parent.$$childTail;
			if (parent.$$childHead) {
				parent.$$childTail.$$nextSibling = scope;
				parent.$$childTail = scope;
			} else {
				parent.$$childHead = parent.$$childTail = scope;
			}
		},

		isScopeDisconnected: function (scope) {
			var climbScope = scope;
			while (climbScope) {
				if (climbScope.$$disconnected) return true;
				climbScope = climbScope.$parent;
			}
			return false;
		},
		getEventEndDate: function (type) {
			var date = new Date();
			var toDate;
			switch(type) {
			    case "day":
			    	toDate = date.setHours(23,59,59,999);
			        break;
			    case "week":
			    	toDate = new Date(new Date().setDate(date.getDate() + (0+(7-date.getDay())) % 7)).setHours(23,59,59,999);
			        break;
			    case "month":
			    	toDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).setHours(23,59,59,999);
			        break;
			    case "all":
			    	toDate = new Date(date.getFullYear(), date.getMonth() + 6, 0).setHours(23,59,59,999);
			        break;
			    default:
			    	toDate = null;
			}
			
		return toDate;
		}
		
	};

})(mobos);
