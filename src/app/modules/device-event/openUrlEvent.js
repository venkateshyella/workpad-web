/**
 * Created by sudhir on 16/3/16.
 */

;(function () {

	var urlSchemaStore = {
		schemaMatcher: [],
		evInbox: []
	};

	/**
	 * Listen for device events and stores events in an events inbox.
	 *
	 * @param stickyEvents
	 * @constructor
	 */

	function OpenUrlEventLogger(stickyEvents) {
		var self = this
			, store = urlSchemaStore
			;

		/* Initialize */

		if (stickyEvents instanceof Array) {
			store.schemaMatcher = store.schemaMatcher.concat(stickyEvents);
			store.schemaMatcher = _.uniq(store.schemaMatcher);
		}


		if (window.cordova && cordova.addStickyDocumentEventHandler) {
			store.schemaMatcher.forEach(function (urlSchema) {
				"use strict";

			});
		} else {
			throw "cordova API not found. Please make sure to use DeviceEventLogger in a Cordova webview.";
		}

		cordova.addStickyDocumentEventHandler('handleopenurl');
		window.handleOpenURL = handleOpenUrl;

		/*-------------*/

		function handleOpenUrl(event) {
			"use strict";
			//console.info('handleopenurl:', event);
			store.evInbox.push(new OpenUrlEvent(event));
			emitStoredEvents()
		}

		/**
		 * OpenUrlEventLogger.inbox
		 */
		Object.defineProperty(self, 'inbox', {
			get: function () {
				return urlSchemaStore.evInbox;
			}
		});

	}

	OpenUrlEventLogger.prototype.subscribe = function (schemaMatcher, cb) {
		"use strict";
		var schemaSubscription = {}
			, schemaRegex;
		if (typeof schemaMatcher == 'string') {
			schemaRegex = schemaMatcher
		}
		schemaSubscription.schemaRegex = schemaRegex;
		schemaSubscription.cb = cb;
		urlSchemaStore.schemaMatcher.push(schemaSubscription);
		emitStoredEvents();
	};

	function emitStoredEvents() {
		"use strict";
		urlSchemaStore.schemaMatcher.forEach(function (schemaSubscription) {
			var eventRegex = schemaSubscription.schemaRegex;
			urlSchemaStore.evInbox.forEach(function (openUrlEvent) {
				try {
					var match = openUrlEvent.url.match(eventRegex);
					if (match) {
						schemaSubscription.cb && schemaSubscription.cb(openUrlEvent, match);
						openUrlEvent.delete();
					}
				} catch (e) {

				}
			})
		});
	}

	/**
	 *
	 * @param eventName
	 * @param eventData
	 * @constructor
	 */
	function OpenUrlEvent(eventData) {
		"use strict";
		this.url = eventData;
		this.id = OpenUrlEvent.evCounter + 1;
		OpenUrlEvent.evCounter++;
	}

	OpenUrlEvent.evCounter = 0;
	OpenUrlEvent.prototype.delete = function () {
		"use strict";
		var id = this.id;
		_.remove(urlSchemaStore.evInbox, function (ev) {
			return ev.id == id;
		})
	};


	window.OpenUrlEventLogger = OpenUrlEventLogger;
	window.OpenUrlEvent = OpenUrlEvent;

})();