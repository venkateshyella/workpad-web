;
(function() {
	"use strict";

	angular.module('app')
	.controller('OrgChatViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session','chatThreadService','CATEGORY_TYPE','$rootScope', OrgChatViewController])


	function OrgChatViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, chatThreadService, CATEGORY_TYPE, $rootScope) {

		var LANG = Lang.en.data;

		console.log("In Org chat controller");

		$scope.xtras.selectedTabIndex = 3;
		$scope.ui = $scope.ui || {
			flags: {}
		};
		$scope.ui.flags.isSendingMessage = false;

		var orgId = $scope.orgTabCtrl.orgId || $stateParams.orgId;

		var _rawResponse;

		$scope.orgTabCtrl.orgModel = DataProvider.resource.Organisation.get(orgId);

		/*if ($scope.orgTabCtrl.orgModel) {
            initOrgChatView();
        } else {
            $scope.getOrgDetails().then(function() {
                initOrgChatView();
            });
        }*/
		
		$scope.chatProfileParams = {};
		$scope.chatProfileParams.catId = orgId;
		$scope.chatProfileParams.catType = CATEGORY_TYPE.ORG;

		$scope.getOrgDetails().then(function() {
			initOrgChatView();
		});

		function initOrgChatView() {
			
			$scope.sharedData.sideMenu.currItem = 'my_orgs';
			
			$scope.toggleOnChatTabs = toggleOnChatTabs;
			$scope.loadNext = loadNext;
			$scope.chatThread = {};
			$scope.forceChatReload = false;
			$scope.isMenuEnabled = true;
			$scope.chatProfileParams.catId = orgId;
			$scope.chatProfileParams.catType = CATEGORY_TYPE.ORG;
			$scope.chatProfileParams.threadId = null;
			
			if ($rootScope.chatThread) {
				$scope.chatThread.chatRoomId = $rootScope.chatThread.chatRoomId;
				$scope.chatThread.chatRoomName = $rootScope.chatThread.chatRoomName;
				$scope.chatThread.threadId = $rootScope.chatThread.threadId;
				$scope.chatProfileParams.threadId = $rootScope.chatThread.threadId;
			}
			
			if ($scope.chatThread && $scope.chatThread.chatRoomId && $scope.chatThread.chatRoomName && $scope.chatThread.threadId) {
				var params = {
						id:$scope.chatThread.threadId,
						name:$scope.chatThread.chatRoomName,
						chatRoomId:$scope.chatThread.chatRoomId
				};
				
				$scope.showMainChatTab = true;
				$scope.showThreadView = true;

				viewChatThread(params);	
				
				delete $rootScope.chatThread;;
			} else {
				$scope.showMainChatTab = false;
				$scope.showThreadView = false;
			};
			
			$scope.viewChatThread = viewChatThread;
			
			if (!$scope.OrgChatroomNickName) {
				$scope.OrgChatroomNickName = 'U' + Session.userId + '-J' + $scope.orgTabCtrl.orgModel.id;
			}
			getChatTabMenuList();

			$scope.isNextPageAvailable = false;
			$scope.loadingNext = false;
			$scope.ChatThreadsData = {
					threads: [],
					pgInfo: {
						pageSize: 25,
						currPage: 1
					}
			};
			
		}

		function getChatTabMenuList() {

			$scope.orgTabCtrl.optionMenuItems.TAB_CHAT = [];

			if (!$scope.showMainChatTab) {
				var chatTabMenuItems = [{
					name: "Sync",
					action: syncChat,
					isAllowed: true
				}];
			} else {
				var chatTabMenuItems = [{
					name: "Create Thread",
					action: addThreadClicked,
					isAllowed: $scope.isMenuEnabled
				}];
			}


			angular.forEach(chatTabMenuItems, function(menuItem) {
				if (menuItem.isAllowed) {
					$scope.orgTabCtrl.optionMenuItems.TAB_CHAT.push(menuItem);
				}
			});
		}

		function syncChat() {

		}

		function addThreadClicked() {
			chatThreadService.createChatThread({"catId":orgId, "catType":CATEGORY_TYPE.ORG})
			.then(function (response) {
				$scope.toggleOnChatTabs(true);
			})
			.catch(function (error) {
			})
			.finally(function () {

			});
		}

		function getOrgChatroomNickName() {
			return 'U' + Session.userId + '-J' + $scope.orgTabCtrl.orgModel.id;
		}

		function toggleOnChatTabs(enable){
			$scope.showMainChatTab = !!enable;
			$scope.isMenuEnabled = true;
			getChatTabMenuList();

			if ($scope.showMainChatTab) {
				$scope.showThreadView = false;

				$scope.ChatThreadsData = {
						threads: [],
						pgInfo: {
							pageSize: 25,
							currPage: 1
						}
				};
				getChatThreadsList();
			} else {
				$scope.chatProfileParams.threadId = null;
			}

		};

		function getChatThreadsList(){
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			var _params = {
					catId: $stateParams.orgId,
					catType:CATEGORY_TYPE.ORG,
					pageSize: $scope.ChatThreadsData.pgInfo.pageSize,
					pageNumber: $scope.ChatThreadsData.pgInfo.currPage,
			};

			DataProvider.resource.ChatMessage.findAllChatThreads(_params)
			.then(function (res) {
				$scope.loadingNext = false;
				angular.forEach(res.results, function (value, key) {
					$scope.ChatThreadsData.threads.push(value);
				});
				$timeout();
				checkNextPgAvailability(res.paginationMetaData);

			}).catch(function (error) {
				Dialog.alert({
					content: error.respMsg,
					ok: "Ok"
				});
			}).finally(function () {
				blockUI.stop();
			});
		}

		function checkNextPgAvailability(paginationMetaData) {
			var totalResults = paginationMetaData.totalResults;
			if ($scope.ChatThreadsData.threads.length < totalResults) {
				$scope.isNextPageAvailable = true;
			} else {
				$scope.isNextPageAvailable = false;
			};
		};

		function loadNext() {
			$scope.loadingNext = true;
			$scope.ChatThreadsData.pgInfo.currPage += 1;
			getChatThreadsList();
		};

		function viewChatThread(threadObj) {
			$scope.isMenuEnabled = false;
			$scope.threadRoomId = threadObj.chatRoomId;
			$scope.ThreadroomNickName = 'U' + Session.userId + '-J' + threadObj.id;
			$scope.showThreadView = true;
			$scope.threadName = threadObj.name;
			$scope.chatProfileParams.threadId = threadObj.id;
			$scope.forceChatReload = !$scope.forceChatReload;
			getChatTabMenuList();
		};

		 $scope.$on('ORG_THREAD_CHAT_TRANSATION', function () { 
			 initOrgChatView();
		 });
		
		
	};


})();