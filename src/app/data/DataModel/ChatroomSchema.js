/**
 * Created by sudhir on 7/9/15.
 */


;
(function () {

	var DL = angular.module("DL");

	DL.service('CHATROOM', [
		function ChatRoomSchema() {

			return {
				config: {
					name: "Chatroom",
					schema: {},
					computed: {
						$_latestMessage: {
							enumerable: true,
							get: function () {
								"use strict";
								var self = this;
								return _.max(self.messages, function (msgModel) {
									return msgModel.now;
								})
							}
						}
					},
					methods: {},
					endpoint: "chatroom",
					relations: {
						hasMany: {
							ChatMessage: {
								localField: 'messages',
								foreignKey: '_chatroomId'
							}
						}
					},
					customEndpoint: {},
					respAdapter: {},
					reqAdapter: {}
				}
			}
		}
	])

})();