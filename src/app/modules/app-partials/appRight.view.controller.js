/**
 * Created by Vikas on 1-Aug-2016.
 */

;
(function () {

	angular.module('app.modules')
		.controller('AppRightViewController', [
			'$scope', '$q', '$rootScope', '$controller', '$timeout',
			'State', 'DataProvider',
			'$mdToast',
			'PostControllerService', 'PostService', 'PushNotificationService',
			'ChatSummaryLoader',
			'Lang', 'APP_BROADCAST', 'PUSH_NOTIFICATION_TYPE', 'mDialog','blockUI',
			'AppCoreUtilityServices','Connect','URL','$state','$stateParams',
			AppRightViewController
		]);

	function AppRightViewController($scope, $q, $rootScope, $controller, $timeout
		, State, DataProvider, $mdToast
		, PostControllerService, PostService, PushNotificationService
		, ChatSummaryLoader
		, Lang, APP_BROADCAST, PUSH_NOTIFICATION_TYPE, Dialog,blockUI
		, AppCoreUtilityServices, Connect, URL, $state, $stateParams) {

		var self = this
			, LANG = Lang.en.data
			, deregisterNotificationListener = null
			, DASHBOARD_NOTIFICATION_CHAT = "NEW_DASHBOARD_POST_REFRESH_CHAT"
			, DASHBOARD_NOTIFICATION_POST = "NEW_DASHBOARD_POST_REFRESH_POST"

			, notificationAuditCollection = []
			, notificationAuditData = []
			, notificationAuditLoader
			;

		angular.extend(self, $controller('ViewDataBaseController', {
			$scope: $scope
		}));

		self.viewData = {
			posts: self.initializeViewDataBaseController('postList', fetchPosts, getPosts),
			chatSummaryLoader: self.initializeViewDataBaseController('chatSummary', fetchChatSummary),
		};
		self.optionsMenu = {
			items: [{
				name: 'refresh',
				value: LANG.OPTIONS_MENU.REFRESH
			}],
			handlers: {}
		};

		$scope.data = {
			postsPageCtx: {
				currPageNumber: 1,
				nextPageNumber: 2,
				pageSize: 25
			}
		};
		$scope.ui = {
			isRefreshing: false,
			isLoadingNext: false,
			isAuditSelected: false
		};
		$scope.isNextPageAvailable = false;
		$scope.enableActions = true;
		$scope.postListBundle = self.viewData.posts.postList;
		$scope._activity = self.viewData.posts.postList.activity;
		$scope.showOptionsMenu = showOptionsMenu;
		$scope.fetchMorePosts = fetchMorePosts;
		$scope.onChatSummaryItemClick = onChatSummaryItemClick;
		$scope.isNextAuditPageAvailable = isNextAuditPageAvailable;
		$scope.state = {
			showAudit: false,
			showRead: false
		};

		$scope.refresh = self.optionsMenu.handlers.refresh = function () {
			$scope._state = self.viewData.posts.postList.state;
			return refresh({
				bypassCache: true,
				cacheResponse: false
			}).then(function (posts) {
					"use strict";
					$scope.data.posts = [];
					$scope.data.posts = posts;
				})
				.finally(function () {
				})
		};
		$scope.refreshAudit = function () {
			fetchAudits();
		};
		$scope.fetchMoreAudits = fetchMoreAudits;

		$scope.asyncRefresh = function () {
			"use strict";
			return refresh({
				bypassCache: true
			})
		};

		$scope.toggleAudit = function (enable) {
			"use strict";
			$timeout(function () {
				$scope.state.showAudit = !!enable;
				if ($scope.state.showAudit) {
					resetAuditList();
					$scope.refreshAudit();
				}
				else {
					$scope.refresh();
				}
			}, 0);
		};
		
		$scope.getChatUserIconUrl = function(chatEntity){
			
            var _iconUrl = null
            	, _defaultOrgIcon = 'assets/images/org-icon-placeholder.png'
            	, _defaultGroupIcon = 'assets/images/group-icon-placeholder.png'
            	, _defaultJobIcon = 'assets/images/org-icon-placeholder.png'
            	,_defaultTaskIcon = 'assets/images/org-icon-placeholder.png';
            
            
            switch (chatEntity.chatType) {
            case 'ORGANIZATION':

            	if (chatEntity.organization) {
            		_iconUrl = AppCoreUtilityServices.getEntityIconImageUrl(chatEntity.organization.id, 'ORG');
            	}

            	if(!_iconUrl){
            		_iconUrl = _defaultOrgIcon;
            	}


            	break;

            case 'GROUP':

            	if (chatEntity.group) {
            		_iconUrl = AppCoreUtilityServices.getEntityIconImageUrl(chatEntity.group.groupId, 'GRP');
            	}

            	if(!_iconUrl){
            		_iconUrl = _defaultGroupIcon;
            	}

            	break;
            case 'JOB':

            	if(chatEntity.organization){
            		_iconUrl = AppCoreUtilityServices.getEntityIconImageUrl(chatEntity.organization.id, 'ORG');
            	}

            	if(!_iconUrl){
            		_iconUrl = _defaultJobIcon;
            	}

            	break;
            case 'TASK':

            	if (chatEntity.organization) {
            		_iconUrl = AppCoreUtilityServices.getEntityIconImageUrl(chatEntity.organization.id, 'ORG');
            	}

            	if(!_iconUrl){
            		_iconUrl = _defaultTaskIcon;
            	}

            	break;
            case 'ORGANIZATION_THREAD':

            	if (chatEntity.organization) {
            		_iconUrl = AppCoreUtilityServices.getEntityIconImageUrl(chatEntity.organization.id, 'ORG');
            	}

            	if(!_iconUrl){
            		_iconUrl = _defaultOrgIcon;
            	}


            	break;

            case 'GROUP_THREAD':

            	if (chatEntity.group) {
            		_iconUrl = AppCoreUtilityServices.getEntityIconImageUrl(chatEntity.group.groupId, 'GRP');
            	}

            	if(!_iconUrl){
            		_iconUrl = _defaultGroupIcon;
            	}


            	break;

            default:
            	return _defaultOrgIcon;
            }
		
			
			return _iconUrl;
		};

		
		 $rootScope.$on('REFRESH_NOTIFICATIONS', function () { 

			 console.log("refershing notifications...");
			 $scope.chatSummary.refresh().then(function(){
				 $scope.refresh();
			 });
		 });
		
		
		
		_init();
		State.waitForTransitionComplete()
			.then(function () {
				$scope.enableActions = false;
				$scope.data.posts = findPosts();
				refresh({
					bypassCache: true
				}).then(function (posts) {
					$scope.data.posts = posts;
				}).catch(function (error) {
					console.log(error);
				}).finally(function () {
					$scope.enableActions = true;
				});
				$rootScope.$broadcast('DashboardController:ENTER');

				//PushNotificationService.waitForNewNotification(PUSH_NOTIFICATION_TYPE.NEW_POST, DASHBOARD_NOTIFICATION_POST)
				//	.then(angular.noop, angular.noop, PushNotificationHandler);

				//PushNotificationService.waitForNewNotification(PUSH_NOTIFICATION_TYPE.CHAT_SUMMARY, DASHBOARD_NOTIFICATION_CHAT)
				//	.then(angular.noop, angular.noop, PushNotificationHandler);

			});

		function PushNotificationHandler(noti) {
			"use strict";
			console.log("new dashboard post notification");
			console.log(noti);
			console.log("----------------");

			var _curr_view = State.curr().toState

			if (_curr_view == 'root.app.dashboard') {
				if (noti) {
					var toastMessage = noti.title || noti.message || null;
					if (toastMessage) {
						$mdToast.show(
							$mdToast.simple()
								.content(toastMessage)
								.action('Sync')
								.position('bottom right')
								.hideDelay(4000))
							.then(function () {
								$scope.refresh();
							})
					}
				}
			}
		}

		$scope.$on('$destroy', onScopeDestroy);

		$scope.postItemPrimaryAction = postItemPrimaryAction;

		function _init() {
			notificationAuditLoader = PostService.createPostAuditListLoader(notificationAuditCollection);
			self.viewData.notificationAudit = self.initializeViewDataBaseController('notificationAudit',
				function () {
					return notificationAuditLoader.fn()
						.then(function (audits) {
							"use strict";
							notificationAuditData = _.uniq(notificationAuditData.concat(audits));
							$timeout(function () {
								$scope.notificationAuditData = notificationAuditData;
							});
							return notificationAuditData;
						});
				});
			$scope.ui.auditActivityStore = notificationAuditLoader.getActivityStore();
		}

		function resetAuditList() {
			$scope.notificationAuditData = [];
			notificationAuditLoader.resetPagination();
		}

		function fetchAudits() {
			$scope.notificationAudit.refresh();
		}

		function fetchMoreAudits() {
			fetchAudits();
		}

		function isNextAuditPageAvailable() {
			return notificationAuditLoader
				&& notificationAuditLoader.isNextPageAvailable()
		}

		function postItemPrimaryAction(post, $event) {
			PostControllerService.runPostHandler(post, {
				targetEvent: $event
			}).then(function (res) {

					console.log("in then block ---dashboard view controller");
					"use strict";
					$rootScope.$broadcast('PostHandler:COMPLETE_SUCCESS');

					//  DataProvider.resource.Post.eject(post.id); /* for removing the post from store */
					//$timeout(function() {}, 10);
					$rootScope.$broadcast("DashboardInfo", {});
					/*	$scope.refresh({
						blockUI: 'auto'
					}).then(function () {
						console.log("refresh finish");
						$timeout(function () {
						}, 10);
					});
					 */
				})
				.finally(function () {
					console.log("in finally block ---dashboard view controller");
					$scope.refresh({
						blockUI: 'auto'
					}).then(function () {
						console.log("refresh finish");
						$timeout(function () {
						}, 10);
					});
					$timeout(function () {
						
					}, 10);
					/*$scope.refresh({
					 blockUI: 'auto'
					 });*/
				})

			;
		}

		function showOptionsMenu(e) {
			Popup.showMenu({
				targetEl: e.currentTarget || e.target,
				menuItems: self.optionsMenu.items
			}).then(function (name, $event) {
				if (self.optionsMenu.handlers[name]) {
					return self.optionsMenu.handlers[name]();
				}
			})
		}

		function fetchChatSummary() {
			"use strict";
			return ChatSummaryLoader.fn();
		}
		
		function refershNotifications(){
			$scope.toggleAudit(false);
		}

		function onChatSummaryItemClick(item) {

			Dialog.show({
					controller: chatDetailDialogCtrl,
					templateUrl: 'app/modules/posts/templates/chatDetail.dialog.tpl.html',
				})
				.then(function (res) {
					if (res == "success") {
						$scope.toggleAudit(false);	
					}
					
				}, function () {
					console.log();
				});

			function chatDetailDialogCtrl($scope, $mdDialog, $stateParams) {

				$scope.chatRoomName = item.chatRoomName;
				$scope.fullPath = item.fullPath;
				$scope.chatDate = mobos.Utils.getDisplayDateTime(item.createDate);
				$scope.chatRestricted = false;
				$scope.ackMessage = "";

				var oldOrgId = $stateParams.orgId;
				var oldGroupId = $stateParams.groupId;
				
				$scope.cancel = function () {
					$mdDialog.hide();
				};

				$scope.handleChatAction = function (hideDailog) {
					Connect.post(URL.CHAT_UPDATE, {id : item.chatRoomId})
					.then(function (res) {
						if(hideDailog){
							$mdDialog.hide("success")
						}else{
							refershNotifications();	
						}
						
					})
					.catch(function (err) {
					});
				};

				$scope.submit = function submit() {

					onChatDetailDialogSubmit(oldOrgId,oldGroupId).then(function(res){
						if(!!res){
							$scope.chatRestricted = true;
							$scope.ackMessage = res.message;
							$scope.handleChatAction(false);
							$rootScope.refreshNotifications();
						}else{
							$mdDialog.hide("success");
						}

					});


				};
				
				
			}	
			
			
			
			function onChatDetailDialogSubmit(oldOrgId,oldGroupId) {

				var _chatNotiDeferred = $q.defer();

				_verifyChatAccess(item).then(function(result){

					//console.log("has access ==> "+result);

					if(result.hasAccess){
						_chatNotiDeferred.resolve();
						var _targetRoute = _getChatroomRoute(item);

						if ($state.current.name == _targetRoute.name && _targetRoute.params.orgId == oldOrgId && _targetRoute.params.groupId == oldGroupId) {
							if (_targetRoute.name == "root.app.org-dashboard.orgChat") {
								$rootScope.$broadcast('ORG_THREAD_CHAT_TRANSATION');
							}
							if (_targetRoute.name == "root.app.group-dashboard.groupChat") {
								$rootScope.$broadcast('GRP_THREAD_CHAT_TRANSATION');
							}
							if (_targetRoute.name == "root.app.job-view.jobChat") {
								$rootScope.$broadcast('JOB_THREAD_CHAT_TRANSATION');
							}
							if (_targetRoute.name == "root.app.task-dashboard.taskChat") {
								$rootScope.$broadcast('TASK_THREAD_CHAT_TRANSATION');
							}
							
						} else {
							_targetRoute &&
							$scope.transitionTo(_targetRoute.name, _targetRoute.params);
						}
						
					}else{
						_chatNotiDeferred.resolve(result);
					}

					return _chatNotiDeferred.promise;
				});


				function _getChatroomRoute(item) {
					var route = {};
					switch (item.chatType) {
					case 'ORGANIZATION':
						route.name = 'root.app.org-dashboard.orgChat';
						if (!item.organization) {
							return null;
						} else {
							route.params = {
									orgId: item.organization.id
							}
						}
						break;
					case 'GROUP':
						route.name = 'root.app.group-dashboard.groupChat';
						if (!item.organization || !item.group) {
							return null;
						} else {
							route.params = {
									orgId: item.organization.id,
									groupId: item.group.groupId
							}
						}
						break;
					case 'JOB':
						route.name = 'root.app.job-view.jobChat';
						if (!item.job) {
							return null;
						} else {
							route.params = {
									jobId: item.job.id
							}
						}
						break;
						
					case 'TASK':
						route.name = 'root.app.task-dashboard.taskChat';
						if (!item.task) {
							return null;
						} else {
							route.params = {
									jobId: item.job.id,
									taskId: item.task.id
							}
						}
						break;
					case 'ORGANIZATION_THREAD':
						route.name = 'root.app.org-dashboard.orgChat';
						if (!item.organization) {
							return null;
						} else {
							route.params = {
									orgId: item.organization.id
							}
							$rootScope.chatThread = {
									orgId: item.organization.id,
									chatRoomId: item.chatRoomId,
									chatRoomName: item.chatRoomName,
									threadId:item.thread.id
							}
						}
						break;
						
					case 'GROUP_THREAD':
						route.name = 'root.app.group-dashboard.groupChat';
						if (!item.organization || !item.group) {
							return null;
						} else {
							route.params = {
									orgId: item.organization.id,
									groupId: item.group.groupId,
							}
							$rootScope.chatThread = {
									orgId: item.organization.id,
									groupId: item.group.groupId,
									chatRoomId: item.chatRoomId,
									chatRoomName: item.chatRoomName,
									threadId:item.thread.id
							}
						}
						break;
					case 'JOB_THREAD':
						route.name = 'root.app.job-view.jobChat';
						if (!item.job) {
							return null;
						} else {
							route.params = {
									jobId: item.job.id
							}
							$rootScope.chatThread = {
									jobId: item.job.id,
									chatRoomId: item.chatRoomId,
									chatRoomName: item.chatRoomName,
									threadId:item.thread.id
							}
						}
						break;
					
					case 'TASK_THREAD':
						route.name = 'root.app.task-dashboard.taskChat';
						if (!item.task) {
							return null;
						} else {
							route.params = {
									jobId: item.job.id,
									taskId: item.task.id
							}
							$rootScope.chatThread = {
									jobId: item.job.id,
									taskId: item.task.id,
									chatRoomId: item.chatRoomId,
									chatRoomName: item.chatRoomName,
									threadId:item.thread.id
							}
						}
						break;

					default:
						return null
					}
					return route;
				}




				function _verifyChatAccess(item) {
					var accessInfo = {hasAccess : false, message : ""};

					var deferred = $q.defer();

					switch (item.chatType) {
					case 'ORGANIZATION':
					case 'ORGANIZATION_THREAD':

						Connect.get(URL.ORG_VIEW, {id : item.organization.id})
						.then(function (res) {

							accessInfo.hasAccess = res.resp.role > 0? true: false;
							deferred.resolve(accessInfo);
							accessInfo.message = "You are no longer associated with WorkSpace "+res.resp.orgName;

						})
						.catch(function (err) {
						});

						break;
					case 'GROUP':
					case 'GROUP_THREAD':

						Connect.get(URL.ORG_GROUP_VIEW, {orgId : item.organization.id, grpId : item.group.groupId})
						.then(function (res) {

							accessInfo.hasAccess = res.resp.role > 0? true: false;
							deferred.resolve(accessInfo);
							accessInfo.message = "You are no longer associated with group "+res.resp.groupName;

						})
						.catch(function (err) {
						});

						break;
					case 'JOB':
					case 'JOB_THREAD':
						Connect.get(URL.JOB_FIND, {jobId : item.job.id})
						.then(function (res) {

							accessInfo.hasAccess = res.resp.roles.length > 0? true: false;
							deferred.resolve(accessInfo);
							accessInfo.message = "You are no longer associated with job "+res.resp.title;

						})
						.catch(function (err) {
						});


						break;
					case 'TASK':
					case 'TASK_THREAD':
						Connect.get(URL.JOB_TASK_VIEW, {taskId : item.task.id})
						.then(function (res) {

							accessInfo.hasAccess = res.resp.roles.length > 0? true: false;
							deferred.resolve(accessInfo);
							accessInfo.message = "You are no longer associated with task "+res.resp.title;

						})
						.catch(function (err) {
						});
						break;

					default:
						return false
					}

					return deferred.promise;
				}
				
				return _chatNotiDeferred.promise;

			};
			
		}
		
		
		

		function fetchPosts(opts) {
			var options = opts || {},
				pageData = options.pageData;
			var nextPageRequestParams = {
				type: $scope.state.showRead ? 'read' : 'unread',
				pageSize: pageData.pageSize,
				pageNumber: pageData.pageNumber || 1
			};

			$scope.ui.isRefreshing = true;
			return DataProvider.resource.Post.findAll(nextPageRequestParams, {
					bypassCache: true
				})
				.then(function (posts) {
					"use strict";
					$scope.data.postPaginationData =
						DataProvider.resource.Post.result.resp.paginationMetaData;
					return posts;
				})
				.finally(function () {
					"use strict";
					$scope.ui.isRefreshing = false;
				});
		}

		function findPosts() {
			"use strict";
			return DataProvider.resource.Post.filter({
				where: {
					status: {
						'==': $scope.state.showRead ? -2 : -1
					}
				},
				orderBy: [
					['createDate', 'DESC']
				]
			}, {loadFromAdapter : true});
		}

		function fetchMorePosts() {
			"use strict";
			var nextPageData = {
				pageNumber: $scope.data.postsPageCtx.currPageNumber + 1
			};
			$scope.ui.isLoadingNext = true;
			$scope.postList.refresh({
					pageData: nextPageData
				})
				.then(function () {
					$scope.data.posts = findPosts();
					$timeout(function () {
					}, 10);
					var rawResult = DataProvider.resource.Post.result,
						paginationData = rawResult.resp.paginationMetaData;

					$scope.isNextPageAvailable = $scope.data.posts.length < paginationData.totalResults;
					$scope.data.postsPageCtx.currPageNumber++;
					$scope.data.postsPageCtx.nextPageNumber++;
				})
				.finally(function () {
					$scope.ui.isLoadingNext = false;
				})
		}

		function refresh(options) {
	
			blockUI.start('Please wait...');

			$scope.data.postsPageCtx.currPageNumber = 1;
			var deferred = $q.defer();
			$scope.ui.isRefreshing = true;
			var options = options || {};
			options.pageData = {
				pageNumber: 1,
				pageSize: $scope.page
			};
			$q.all([
					$scope.postList.refresh(options),
					$scope.chatSummary.refresh()
				])
				.then(function (resultArray) {
					"use strict";
					var posts = resultArray[0],
						chatSummaryList = resultArray[1];
					$scope.chatSummaryList = chatSummaryList;
					$scope._state = self.viewData.posts.postList.state;
					var rawResult = DataProvider.resource.Post.result,
						paginationData = rawResult.resp.paginationMetaData;

					if (paginationData.totalResults > 25) {
						$scope.isNextPageAvailable = true;
					} else {
						$scope.isNextPageAvailable = false;
					}
					
					//$scope.isNextPageAvailable = $scope.data.posts.length < paginationData.totalResults;
					deferred.resolve(posts);
					blockUI.stop();
				})
				.catch(function (error) {
					"use strict";
					deferred.reject(error);
				})
				.finally(function () {
					"use strict";
					$scope.ui.isRefreshing = false;
				});

			return deferred.promise;
		}

		function getPosts(options) {
			return DataProvider.resource.Post.getAll();
		}

		function onScopeDestroy() {
			"use strict";
			//deregisterNotificationListener && deregisterNotificationListener();
			PushNotificationService.unWaitForNewNotification(DASHBOARD_NOTIFICATION_CHAT);
		}

	}

})();
