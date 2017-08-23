// appCore.service.js

;(function () {

	angular.module('app')
	.service('AppCoreUtilityServices', 
			[
			 'Session',
			 '$http', '$templateCache',
			 'APP_INFO', 'URL','EVENT_REMINDER_DUR_TYPES',
			 AppCoreUtilityServices]).
			 filter('secondsToTimeString', secondsToTimeString );

	function AppCoreUtilityServices(Session, $http, $templateCache,
	                                APP_INFO, URL, EVENT_REMINDER_DUR_TYPES) {
		function isLikePromise(obj) {
			if (obj
				&& angular.isFunction(obj.then)) {
				return true;
			} else {
				return false;
			}
		}

		function isStrictUrl(s) {
			var regexp = /((http|https):\/\/)[A-Za-z0-9\.-]{3,}\.[A-Za-z]{2}/;
			return s.indexOf(' ') < 0 && regexp.test(s);
		}

		return {
			UrlBuilder: UrlBuilder,
			AuthUrlBuilder: function (url, params) {
				"use strict";
				var _authenticatedParams = angular.extend({}, params, {
					userSessionId: Session.id
				});
				return UrlBuilder(url, _authenticatedParams)
			},
			isLikePromise: isLikePromise,
			isStrictUrl: isStrictUrl,
			isNewUpdateAvailable: isNewUpdateAvailable,
			xmlToJson: xmlToJson,
			getUserIconImageUrl: getUserIconImageUrl,
			getEntityIconImageUrl : getEntityIconImageUrl,
			getDisplayDate_DDMMYYYY: mobos.Utils.createDateFormatter('DD/MM/YYYY'),
			getDisplayDate_DDMMYYYYHHMMSS: mobos.Utils.createDateFormatter('DD/MM/YYYY HH:mm:ss'),
			getDisplayDate: mobos.Utils.getDisplayDate,
			getDisplayDateOffset: mobos.Utils.getDisplayDateOffset,
			getDisplayTime: mobos.Utils.getDisplayTime,
			getDisplayDateTime: mobos.Utils.getDisplayDateTime,
			getDisplayDateTimeOffset: mobos.Utils.getDisplayDateTimeOffset,
			getDisplayAlphabet: getDisplayAlphabet,
			convertStringToDate : convertStringToDate,
			convertDateToTimeStamp : convertDateToTimeStamp,
			timePickerService : timePickerService,
			getReminderFreqTypes : getReminderFreqTypes,
			computeEventReminderToSeconds :  computeEventReminderToSeconds,
			computeReminderDurationType : computeReminderDurationType,
			

			getTemplate: getTemplate,

			fuzzyFinderFactory: fuzzyFinderFactory,

			multiSelectScopeControllerFactory: multiSelectScopeControllerFactory
		};

		function UrlBuilder(url, GETParams) {
			"use strict";
			return function (params) {
				var _params = angular.extend({}, GETParams, params);
				return url + "?" + $.param(_params);
			}
		}

		function multiSelectScopeControllerFactory(list, opts) {
			"use strict";

			var context = {
					isAllSelected: false,
					selectCount: 0,
					list: angular.copy(list)
				}
				;

			return {
				get list() {
					return context.list;
				},
				get isAllSelected() {
					return context.isAllSelected;
				},
				get selectCount() {
					return context.selectCount;
				},
				refresh: refreshContextProperties,
				getItems: function (isSelected) {
					var selectedItems = _.filter(angular.copy(context.list), function (item) {
						if(opts!= undefined && opts.ignoreItemSelection && item.ignoreSelection){
							return false;
						}else{
							return (item.isSelected == !!isSelected);
						}
						  
					});
					_.each(selectedItems, function (item) {
						delete(item.isSelected);
					});
					return selectedItems;
				},
				toggleItemSelection: function (item, doSelect) {
					var _doSelect = !item.isSelected;
					if (angular.isDefined(doSelect)) {
						_doSelect = !!doSelect;
					}
					item.isSelected = _doSelect;
					refreshContextProperties();
					return item;
				},
				toggleSelectionAll: function (doSelect) {
					var _doSelect = !context.isAllSelected;
					if (angular.isDefined(doSelect)) {
						_doSelect = !!doSelect;
					}
					_.each(context.list, function (item) {
						if(!item.ignoreSelection){
							item.isSelected = _doSelect;	
						}
					});
					context.isAllSelected = _doSelect;
					context.selectCount = _doSelect ? context.list.length : 0;
				}
			};

			function refreshContextProperties() {
				var selectedItems = _.where(context.list, {isSelected: true});
				var ignoredItemsCount = 0;
				
				
				if(opts!= undefined && opts.ignoreItemSelection){
					var ignoredItems =  _.where(context.list, {ignoreSelection: true});
					ignoredItemsCount = ignoredItems.length;
				}
				
				context.selectCount = selectedItems.length + ignoredItemsCount;
				context.isAllSelected = (selectedItems.length == context.list.length);
			}
		}

		function getDisplayAlphabet(notificationCategory) {
			var NotificationCategoryList = {
				POST_NOTIFICATION_CATEGORY_INFORMATION: -1,
				POST_NOTIFICATION_CATEGORY_ACTION: -2,
				POST_NOTIFICATION_CATEGORY_SPONSOR: -3
			};
			var NotificationCategory = "";
			switch (notificationCategory) {
				case NotificationCategoryList.POST_NOTIFICATION_CATEGORY_INFORMATION:
					NotificationCategory = "I";
					break;
				case NotificationCategoryList.POST_NOTIFICATION_CATEGORY_ACTION:
					NotificationCategory = "A";
					break;
				case NotificationCategoryList.POST_NOTIFICATION_CATEGORY_SPONSOR:
					NotificationCategory = "S";
					break;
				default:
					NotificationCategory = "";
			}
			return NotificationCategory;
		}

		function fuzzyFinderFactory(list, matchFields) {
			"use strict";
			var options = {
				keys: matchFields
			};
			return new Fuse(list, options);
		}

		function isNewUpdateAvailable(appInfoFromServer) {
			"use strict";
			/**
			 * If local app version smaller than the latest app info obtained from the
			 * ping service, Run app update flow.
			 */
			if (APP_INFO.version.numberString >= appInfoFromServer.version) {
				return false;
			} else {
				return true;
			}
		}

		// Changes XML to JSON
		function xmlToJson(xml) {

			// Create the return object
			var obj = {};

			if (xml.nodeType == 1) { // element
				// do attributes
				if (xml.attributes.length > 0) {
					obj["@attributes"] = {};
					for (var j = 0; j < xml.attributes.length; j++) {
						var attribute = xml.attributes.item(j);
						obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
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
						obj[nodeName] = xmlToJson(item);
					} else {
						if (typeof(obj[nodeName].push) == "undefined") {
							var old = obj[nodeName];
							obj[nodeName] = [];
							obj[nodeName].push(old);
						}
						obj[nodeName].push(xmlToJson(item));
					}
				}
			}
			return obj;
		};

		// Generate User Icon image URL
		function getUserIconImageUrl(userId, sessionId) {
			"use strict";
			return URL.GET_PIC + "?" + $.param({
					userSessionId: Session.id,
					entityId: userId,
					imgEntityType: "USER",
					imgType: "ICON",
					hash: mobos.Utils.imgHashCounter
				})
		};

		function getEntityIconImageUrl(entity_id,entity_type) {
			"use strict";
			return URL.GET_PIC + "?" + $.param({
					userSessionId: Session.id,
					entityId: entity_id,
					imgEntityType: entity_type,
					imgType: "ICON",
					hash: mobos.Utils.imgHashCounter
				})
		};
		
		function getTemplate(url) {
			var templateLoader
				;

			//var templateUrl = "app/modules/form/templates/string-field/string-editor.partial.html";
			var templateUrl = url;
			templateLoader = $http.get(templateUrl, {cache: $templateCache});

			return templateLoader;

		};
		
		
		function timePickerService(){

			function getTimePickerList(){
				var timeList = [];

				timeList.push({value : 0, label : "12:00 am"});
				timeList.push({value : 0.5, label : "12:30 am"});

				for(var i = 1; i<12; i++){
					timeList.push({value : i, label : i+":00 am"});
					timeList.push({value : (i+0.5), label : i+":30 am"});
				}
				
				timeList.push({value : 12, label : "12:00 pm"});
				timeList.push({value : 12.5, label : "12:30 pm"});
				
				for(var i = 12; i<23; i++){
					timeList.push({value : (i+1), label : (i-11)+":00 pm"});
					timeList.push({value : (i+1.5), label : (i-11)+":30 pm"});
				}

				return timeList;
			}
			
			function getTimeInSeconds(timePickVal){
				return (timePickVal*3600);
			}
			
			function getTimeInMilliSeconds(timePickVal){
				return (timePickVal*3600*1000);
			}
				
			return {
				getTimePickerList : getTimePickerList,
				getTimeInSeconds : getTimeInSeconds,
				getTimeInMilliSeconds : getTimeInMilliSeconds
			};
		};
		
		function convertStringToDate(_date,_format,_delimiter){
		            var formatLowerCase=_format.toLowerCase();
		            var formatItems=formatLowerCase.split(_delimiter);
		            var dateItems=_date.split(_delimiter);
		            var monthIndex=formatItems.indexOf("mm");
		            var dayIndex=formatItems.indexOf("dd");
		            var yearIndex=formatItems.indexOf("yyyy");
		            var month=parseInt(dateItems[monthIndex]);
		            month-=1;
		            var formatedDate = new Date(dateItems[yearIndex],month,dateItems[dayIndex]);
		            return formatedDate;
		};
		
		function convertDateToTimeStamp(dateObj){
			return (dateObj.getTime());
		};
		
		function computeEventReminderToSeconds(durationType, durationVal, freqType, freqVal){
			var reminderObj = { duration : 0,
								freq : 0
								};
			
			switch (durationType) {
			case EVENT_REMINDER_DUR_TYPES.MINUTES:
				reminderObj.duration = durationVal*60;
				reminderObj.freq = freqVal*60;
				break;
			case EVENT_REMINDER_DUR_TYPES.HOURS:
				reminderObj.duration = durationVal*3600;
				reminderObj.freq = freqVal*3600;
				break;
			case EVENT_REMINDER_DUR_TYPES.DAYS:
				reminderObj.duration = durationVal*24*3600;
				reminderObj.freq = freqVal*24*3600;
				break;
			case EVENT_REMINDER_DUR_TYPES.WEEKS:
				reminderObj.duration = durationVal*7*24*3600;
				reminderObj.freq = freqVal*24*3600;
				break;	
			default:
				break;
			}
			
			return reminderObj;
		};
		
		
		function getReminderFreqTypes(durationType){
			var freqObj = { label : "",
					value : 0,
					computeVal : 0,
				};

			switch (durationType) {
			case EVENT_REMINDER_DUR_TYPES.MINUTES:
				freqObj.label = "minutes";
				freqObj.computeVal = 60;
				break;
			case EVENT_REMINDER_DUR_TYPES.HOURS:
				freqObj.label = "hours";
				freqObj.computeVal = 3600;
				break;
			case EVENT_REMINDER_DUR_TYPES.DAYS:
				freqObj.label = "days";
				freqObj.computeVal = 24*3600;
				break;
			case EVENT_REMINDER_DUR_TYPES.WEEKS:
				freqObj.label = "days";
				freqObj.computeVal = 24*3600;
				break;	
			default:
				break;
			}
			
			return freqObj;
		};
		
		function computeReminderDurationType(durationVal){
			var remObj = { type : 0,
							value : 0
				};
			
			var durVal = durationVal/3600;
			
			if(durVal > 1){
				
				if((durationVal/(24*3600)) > 1){
					remObj.type = EVENT_REMINDER_DUR_TYPES.DAYS;
					remObj.value = durationVal/(24*3600);
				}else{
					remObj.type = EVENT_REMINDER_DUR_TYPES.HOURS;
					remObj.value = durationVal/(3600);
				}
			}else{
				remObj.type = EVENT_REMINDER_DUR_TYPES.MINUTES;
				remObj.value = durationVal/(60);
			}

			return remObj;
			
		};
		
		
		
	}

	function secondsToTimeString() {
		 return function(seconds) {
			 var days = Math.floor(seconds / 86400);
			 var hours = Math.floor((seconds % 86400) / 3600);
			 var minutes = Math.floor(((seconds % 86400) % 3600) / 60);
			 var timeString = '';
			 if(days > 0) timeString += (days > 1) ? (days + " days ") : (days + " day ");
			 if(hours > 0) timeString += (hours > 1) ? (hours + " hours ") : (hours + " hour ");
			 if(minutes > 0) timeString += (minutes > 1) ? (minutes + " minutes ") : (minutes + " minute ");
			 return timeString;
		 }
	 }
	AppCoreUtilityServices.$inject = ['APP_INFO'];

})();
