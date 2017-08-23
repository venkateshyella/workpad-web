;
(function() {
    "use strict";

    angular.module('app')
        .controller('TaskChatViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'TaskWorkflowRunner', 'Lang', 'TaskAdminService', 'Session','CATEGORY_TYPE','chatThreadService','$rootScope', TaskChatViewController])


    function TaskChatViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, TaskWorkflowRunner, Lang, TaskAdminService, Session, CATEGORY_TYPE, chatThreadService, $rootScope) {

        $scope.xtras.selectedTabIndex = 2;
        var taskId = $stateParams.taskId;
       /* if ($scope.taskTabCtrl.taskModel && $scope.taskTabCtrl.jobModel) {
            getChatTabMenuItems();
        } else {
            $scope.fetchTaskModelAndJobModel().then(function() {
                getChatTabMenuItems();
            });
        }*/

        $scope.taskTabCtrl.taskModel = DataProvider.resource.Task.get(taskId);
        
        $scope.fetchTaskModelAndJobModel().then(function() {
        	  initTaskChatView();
            });
      	
		$scope.showMainChatTab = "";
		$scope.chatProfileParams = {};
		$scope.chatProfileParams.catId = taskId;
		$scope.chatProfileParams.catType = CATEGORY_TYPE.TASK;

		function initTaskChatView() {

			$scope.sharedData.sideMenu.currItem = 'my_orgs';

			$scope.toggleOnChatTabs = toggleOnChatTabs;
			$scope.loadNext = loadNext;
			$scope.chatThread = {};
			$scope.isMenuEnabled = true;

			$scope.chatProfileParams.catId = taskId;
			$scope.chatProfileParams.catType = CATEGORY_TYPE.TASK;

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

			if (!$scope.TaskChatroomNickName) {
				$scope.TaskChatroomNickName = 'U' + Session.userId + '-J' + $scope.taskTabCtrl.taskModel.id;
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

			$scope.taskTabCtrl.optionMenuItems.TAB_CHAT = [];

			if (!$scope.showMainChatTab) {
				var chatTabMenuItems = [{
					name: "Sync",
					action: syncChat,
					isAllowed: false
				}];
			} else {
				var chatTabMenuItems = [{
					name: "Create Thread",
					action: addThreadClicked,
					isAllowed: $scope.isMenuEnabled && $scope.isAccessProvided
				}];
			}

			angular.forEach(chatTabMenuItems, function(menuItem) {
				if (menuItem.isAllowed) {
					$scope.taskTabCtrl.optionMenuItems.TAB_CHAT.push(menuItem);
				}
			});
		}

		function syncChat() {

		}

		function addThreadClicked() {
			chatThreadService.createChatThread({"catId":taskId, "catType":CATEGORY_TYPE.TASK})
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
					catId: $stateParams.taskId,
					catType:CATEGORY_TYPE.TASK,
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

		$scope.$on('TASK_THREAD_CHAT_TRANSATION', function () { 
			initJobChatView();
		});

          
          

        function chatSyncClicked() {

        }


    }


})();
