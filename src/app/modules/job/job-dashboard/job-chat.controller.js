;
(function () {
	"use strict";

	angular.module('app')
	.controller('JobChatViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session','CATEGORY_TYPE','chatThreadService','$rootScope', JobChatViewController])


	function JobChatViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, CATEGORY_TYPE, chatThreadService, $rootScope) {

		var LANG = Lang.en.data;

		//$scope.JobTabCtrl.tab_curr = 'TAB_CHAT';

		$scope.xtras.selectedTabIndex = 2;
		$scope.ui = $scope.ui || {
			flags: {}
		};
		$scope.ui.flags.isSendingMessage = false;

		var jobId = $stateParams.jobId;

		/*$scope.$on("$JOB_DETAILS_UPDATE:SUCCESS", function(ev, data) {
		 $scope.JobTabCtrl.tab_curr = 'TAB_CHAT';
		 });*/

		$scope.JobTabCtrl.jobModel = DataProvider.resource.Job.get(jobId);
		$scope.showMainChatTab = "";
		$scope.chatProfileParams = {};
		$scope.chatProfileParams.catId = jobId;
		$scope.chatProfileParams.catType = CATEGORY_TYPE.JOB;

		$scope.fetchJobDetails().then(function () {
			initJobChatView();
		});

		function initJobChatView() {

			$scope.sharedData.sideMenu.currItem = 'my_orgs';

			$scope.toggleOnChatTabs = toggleOnChatTabs;
			$scope.loadNext = loadNext;
			$scope.chatThread = {};
			$scope.isMenuEnabled = true;

			$scope.chatProfileParams.catId = jobId;
			$scope.chatProfileParams.catType = CATEGORY_TYPE.JOB;

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

			if (!$scope.JobChatroomNickName) {
				$scope.JobChatroomNickName = 'U' + Session.userId + '-J' + $scope.JobTabCtrl.jobModel.id;
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

			$scope.JobTabCtrl.optionMenuItems.TAB_CHAT = [];

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
					$scope.JobTabCtrl.optionMenuItems.TAB_CHAT.push(menuItem);
				}
			});
		}

		function syncChat() {

		}

		function addThreadClicked() {
			chatThreadService.createChatThread({"catId":jobId, "catType":CATEGORY_TYPE.JOB})
			.then(function (response) {
				$scope.toggleOnChatTabs(true);
			})
			.catch(function (error) {
			})
			.finally(function () {

			});
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
					catId: $stateParams.jobId,
					catType:CATEGORY_TYPE.JOB,
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
			getChatTabMenuList();
		};

		$scope.$on('JOB_THREAD_CHAT_TRANSATION', function () { 
			initJobChatView();
		});

		function sync() {

		}

	}


})();
