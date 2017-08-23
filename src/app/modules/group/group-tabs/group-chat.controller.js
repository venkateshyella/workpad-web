;
(function() {
    "use strict";

    angular.module('app')
        .controller('GroupChatViewController', ['$scope', '$stateParams', 'blockUI', 'DataProvider', 'mDialog', '$timeout', 'Lang', 'Session','chatThreadService','CATEGORY_TYPE','$rootScope', GroupChatViewController])


    function GroupChatViewController($scope, $stateParams, blockUI, DataProvider, Dialog, $timeout, Lang, Session, chatThreadService, CATEGORY_TYPE, $rootScope) {

        var LANG = Lang.en.data;

        console.log("In Group chat controller");
        if(!$scope.groupTabCtrl.groupModel.isSupportGroup){
        	$scope.xtras.selectedTabIndex = 3;
        }else{
        	$scope.xtras.selectedTabIndex = 2;
        }
        
        $scope.ui = $scope.ui || {
			flags: {}
		};
        $scope.ui.flags.isSendingMessage = false;
       
        var groupId = $scope.groupTabCtrl.groupId || $stateParams.groupId;

        var _rawResponse;
        
        $scope.groupTabCtrl.groupModel  = DataProvider.resource.Group.get(groupId);

        /*if($scope.groupTabCtrl.orgModel){
              initGroupChatView();
        }else{

             $scope.getGroupModelAndOrgModel().then(function() {
                initGroupChatView();
            });

        }*/
        $scope.chatProfileParams = {};
        $scope.chatProfileParams.catId = groupId;
		$scope.chatProfileParams.catType = CATEGORY_TYPE.GROUP;

        $scope.getGroupModelAndOrgModel().then(function() {
                initGroupChatView();
            });

        function initGroupChatView(){
        	
        	$scope.sharedData.sideMenu.currItem = 'my_orgs';
        	
        	$scope.toggleOnChatTabs = toggleOnChatTabs;
        	$scope.loadNext = loadNext;
        	$scope.chatThread = {};
        	$scope.forceChatReload = false;
        	$scope.isMenuEnabled = true;
        	
        	$scope.chatProfileParams.catId = groupId;
    		$scope.chatProfileParams.catType = CATEGORY_TYPE.GROUP;
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

				$scope.viewChatThread(params);	
				
				delete $rootScope.chatThread;
			} else {
				$scope.showMainChatTab = false;
				$scope.showThreadView = false;
			};
			
           if (!$scope.GroupChatroomNickName) {
                $scope.GroupChatroomNickName = 'U' + Session.userId + '-J' +  $scope.groupTabCtrl.groupModel.id;
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

            $scope.groupTabCtrl.optionMenuItems.TAB_CHAT = [];
            if(!$scope.showMainChatTab){
            	 var chatTabMenuItems = [{
                     name: "Sync",
                     action: syncChat,
                     isAllowed: true
                 }];
            }else{
            var chatTabMenuItems = [{
                name: "Create Thread",
                action: addThreadClicked,
                isAllowed: $scope.isMenuEnabled 
            }];
            }

            angular.forEach(chatTabMenuItems, function(menuItem) {
                if (menuItem.isAllowed) {
                    $scope.groupTabCtrl.optionMenuItems.TAB_CHAT.push(menuItem);
                }
            });
        }

        function syncChat() {

        }
        
        function addThreadClicked(){
        	chatThreadService.createChatThread({"catId":groupId, "catType":CATEGORY_TYPE.GROUP})
        	.then(function (response) {
        		$scope.toggleOnChatTabs(true);
        		// refresh list
        	})
        	.catch(function (error) {
        	})
        	.finally(function () {

        	});
        
        }

        function getGroupChatroomNickName() {
            return 'U' + Session.userId + '-J' + $scope.groupModel.id;
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
		}
        
        function getChatThreadsList(){
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			var _params = {
					catId: groupId,
					catType:CATEGORY_TYPE.GROUP,
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
		
		$scope.viewChatThread = function(threadObj) {
			$scope.isMenuEnabled = false;
			$scope.threadRoomId = threadObj.chatRoomId;
			$scope.ThreadroomNickName = 'U' + Session.userId + '-J' + threadObj.id;
			$scope.showThreadView = true;
			$scope.threadName = threadObj.name;
			$scope.chatProfileParams.threadId = threadObj.id;
			$scope.forceChatReload = !$scope.forceChatReload;
			getChatTabMenuList();
		};
		$scope.clickedOnBack = function() {
			$scope.showThreadView = false;
			$scope.toggleOnChatTabs(true);
		}
		
		 $scope.$on('GRP_THREAD_CHAT_TRANSATION', function () { 
			 
			 initGroupChatView();
			 
		 });
    }


})();
