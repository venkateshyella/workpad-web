/**
 * Created by sudhir on 12/5/15.
 */

;
(function () {

	angular.module('app')
		.config(['$stateProvider', '$urlRouterProvider', ModuleRouter]);

	function ModuleRouter($stateProvider, $urlRouterProvider) {

		var moduleTemplatePath = "app/modules";

		$stateProvider

			.state('root.login', {
				url: 'login',
				templateUrl: moduleTemplatePath + '/user/auth/login.view.html',
				controller: 'LoginViewController',
				resolve: {}
			})

			.state('root.recoverPassword', {
				url: 'recover-password',
				templateUrl: moduleTemplatePath + '/user/recover-password/recover-password.view.html',
				controller: 'UserRecoverViewController',
				resolve: {}
			})

			.state('root.register', {
				url: 'register',
				templateUrl: moduleTemplatePath + '/user/register/register.view.html',
				controller: 'UserRegisterViewController',
				resolve: {}
			})
			
			.state('root.appDownload', {
				url: 'appDownload',
				templateUrl: moduleTemplatePath + '/app-core/boot/appDownload.view.html',
				controller: 'AppDownloadViewController',
				resolve: {}
			})

			.state('root.app.home', {
				url: 'home',
				templateUrl: moduleTemplatePath + '/user/profile/user-profile.view.html',
				controller: 'UserProfileViewController',
				resolve: {}
			})

			.state('root.app.user', {
				url: 'user/:id',
				templateUrl: moduleTemplatePath + '/user/profile/user-profile-tabs.view.html',
				controller: 'UserProfileViewController',
				resolve: {}
			})
			.state('root.app.subscriber', {
				url: 'subscriber',
				templateUrl: moduleTemplatePath + '/user/subscriber/user-payment-details.html',
				controller: 'UserPaymentViewController',
				resolve: {}
			})
			.state('root.app.subscribedOrgs', {
				url: 'subscribedOrgs',
				templateUrl: moduleTemplatePath + '/subscribed-orgs/subscribed-orgs-view.html',
				controller: 'SubscribedOrgsViewController',
				resolve: {}
			})
			.state('root.app.subscription', {
				url:'subscription',
				params: {orgId : null},
				templateUrl: moduleTemplatePath + '/subscription/subscription-view.html',
				controller: 'SubscriptionViewController',
				resolve: {}
			})
			.state('root.app.payment', {
				params : {options : null},
				url: 'payment',
				templateUrl: moduleTemplatePath + '/payment/payment-view.html',
				controller: 'PaymentViewController',
				resolve: {}
			})
			.state('root.app.transaction', {
				url: 'transaction',
				params: {trans: null},
				templateUrl: moduleTemplatePath + '/user/subscriber/user-payment-preview.html',
				controller: 'UserPaymentViewController',
				resolve: {}
			})
			.state('root.app.user-edit', {
				url: 'user/edit/:id',
				templateUrl: moduleTemplatePath + '/user/profile-edit/user-editor.master.view.html',
				controller: 'UserEditorMasterController',
				resolve: {}
			})

			.state('root.app.user-edit.profile', {
				url: '/profile',
				views: {
					"editor_form_content": {
						templateUrl: moduleTemplatePath + '/user/profile-edit/user-profile-editor.view.html',
						controller: 'UserProfileEditorViewController'
					}
				}
			})

			.state('root.app.user-edit.contacts', {
				url: '/contacts',
				views: {
					"editor_form_content": {
						templateUrl: moduleTemplatePath + '/user/profile-edit/user-contacts-editor.view.html',
						controller: 'UserContactsEditorViewController'
					}
				}
			})

			.state('root.app.user-edit.skills', {
				url: '/skills',
				views: {
					"editor_form_content": {
						templateUrl: moduleTemplatePath + '/user/profile-edit/user-skills-editor.view.html',
						controller: 'UserSkillsEditorViewController'
					}
				}
			})

			.state('root.app.org-list', {
				url: 'user/:userId/org',
				templateUrl: moduleTemplatePath + '/org/org-list/org-list.view.html',
				controller: 'OrgListViewController',
				resolve: {}
			})

			//	Route no longer used
			//	-------------------------
			// .state('root.app.org', {
			// 	url: 'org/:orgId/tab/:tab',
			// 	templateUrl: moduleTemplatePath + '/org/org-view/org-detail-tabs.view.html',
			// 	controller: 'OrgDetailViewController',
			// 	resolve: {}
			// })

			.state('root.app.org-edit', {
				url: 'org/:orgId/edit',
				templateUrl: moduleTemplatePath + '/org/org-edit/org-edit-admin.view.html',
				controller: 'OrganisationAdminViewController',
				resolve: {}
			})

			//	Route no longer used
			//	-------------------------
			// .state('root.app.org-members', {
			// 	url: 'org/:orgId/members',
			// 	templateUrl: moduleTemplatePath + '/org/org-view/org-members.view.html',
			// 	controller: 'OrgMemberListController',
			// 	resolve: {}
			// })

			.state('root.app.org-dashboard', {
				url: 'org/org-dashboard/:orgId',
				abstract: true,
				templateUrl: moduleTemplatePath + '/org/org-tabs/orgDashboard.view.html',
				controller: 'OrgDashboardViewController',
				resolve: {}
			})

			.state('root.app.org-dashboard.orgAudit', {
				url: '/orgAudit',
				views: {
					'orgDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/org/org-tabs/org-audit.partial.html',
						controller: 'OrgAuditViewController'
					}
				},
			})

			.state('root.app.org-dashboard.orgInfo', {
				url: '/orgInfo',
				views: {
					'orgDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/org/org-tabs/org-info.partial.html',
						controller: 'OrgInfoViewController'
					}
				},
			})

			.state('root.app.org-dashboard.orgMembers', {
				url: '/orgMembers',
				views: {
					'orgDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/org/org-tabs/org-memberList.partial.html',
						controller: 'OrgMemberViewController'
					}
				},
			})

			.state('root.app.org-dashboard.orgGroups', {
				url: '/orgGroups',
				views: {
					'orgDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/org/org-tabs/org-groups.partial.html',
						controller: 'OrgGroupsViewController'
					}
				},
			})
			.state('root.app.org-dashboard.orgJobs', {
				url: '/orgJobs',
				views: {
					'orgDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/org/org-tabs/org-jobs.partial.html',
						controller: 'OrgJobsViewController'
					}
				},
			})
			.state('root.app.org-dashboard.orgAnalysis', {
				url: '/orgAnalysis',
				views: {
					'orgDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/org/org-tabs/org-analysis.partial.html',
						controller: 'OrgAnalysisViewController'
					}
				},
			})

			.state('root.app.org-dashboard.orgChat', {
				url: '/orgChat',
				views: {
					'orgDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/org/org-tabs/org-chat.partial.html',
						controller: 'OrgChatViewController'
					}
				},
			})
			.state('root.app.org-dashboard.orgMeeting', {
				url: '/orgTalk',
				params : {orgId : null, meetingId : null},
				views: {
					'orgDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/org/org-tabs/org-meeting.partial.html',
						controller: 'OrgMeetingViewController'
					}
				},
			})
			
			.state('root.app.org-dashboard.joinedMeetingView', {
				url: '/joinedMeetingView',
				params : {meetingInfo : null},
				views: {
					'orgDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/org/org-tabs/org-joined-meeting.partial.html',
						controller: 'OrgJoinedMeetingViewController'
					}
				}
			})
			
			.state('root.app.org-dashboard.orgVault', {
				url: '/orgVault',
				views: {
					'orgDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/org/org-tabs/org-data.partial.html',
						controller: 'OrgDataViewController'
					}
				}
			})
			 .state('root.app.org-dashboard.orgEvents', {
		        url: '/orgEvents',
		        views: {
		          'orgDashboardTabContainer': {
		            templateUrl: moduleTemplatePath + '/org/org-tabs/org-event.partial.html',
		            controller: 'OrgEventViewController'
		          }
		        }
		      })
		      
		      .state('root.app.org-dashboard.orgSchedule', {
				url: '/orgSchedule',
				views: {
					'orgDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/org/org-tabs/org-schedule.partial.html',
						controller: 'OrgScheduleViewController'
					}
				},
			})

			.state('root.app.org-dashboard.orgJobTemplate', {
				url: '/orgJobTemplate',
				views: {
					'orgDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/org/org-tabs/org-jobsTemplate.partial.html',
						controller: 'OrgJobTemplateViewController'
					}
				},
			})
			/*-------------------*/
			/* Group detail tabs */
			/*-------------------*/
			.state('root.app.group-dashboard', {
				url: ':orgId/group/group-dashboard/:groupId',
				abstract: true,
				templateUrl: moduleTemplatePath + '/group/group-tabs/groupDashboard.view.html',
				controller: 'GroupDashboardViewController',
				resolve: {}
			})

			.state('root.app.group-dashboard.groupInfo', {
				url: '/groupInfo',
				views: {
					'groupDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/group/group-tabs/group-info.partial.html',
						controller: 'GroupInfoViewController'
					}
				}
			})

			.state('root.app.group-dashboard.groupMembers', {
				url: '/groupMembers',
				views: {
					'groupDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/group/group-tabs/group-memberList.partial.html',
						controller: 'GroupMemberViewController'
					}
				}
			})

			.state('root.app.group-dashboard.groupGroups', {
				url: '/groupGroups',
				views: {
					'groupDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/group/group-tabs/group-groups.partial.html',
						controller: 'GroupGroupsViewController'
					}
				}
			})

			.state('root.app.group-dashboard.groupJobs', {
				url: '/groupJobs',
				views: {
					'groupDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/group/group-tabs/group-jobs.partial.html',
						controller: 'GroupJobsViewController'
					}
				}
			})

			.state('root.app.group-dashboard.groupChat', {
				url: '/groupChat',
				views: {
					'groupDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/group/group-tabs/group-chat.partial.html',
						controller: 'GroupChatViewController'
					}
				}
			})
			
			.state('root.app.group-dashboard.groupMeeting', {
				url: '/groupTalk',
				params : {orgId:null, groupId : null, meetingId : null},
				views: {
					'groupDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/group/group-tabs/group-meeting.partial.html',
						controller: 'GroupMeetingViewController'
					}
				},
			})

			.state('root.app.group-dashboard.groupVault', {
				url: '/groupVault',
				views: {
					'groupDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/group/group-tabs/group-data.partial.html',
						controller: 'GroupDataViewController'
					}
				}
			})

			.state('root.app.group-dashboard.groupAudit', {
				url: '/groupAudit',
				views: {
					'groupDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/group/group-tabs/group-audit.partial.html',
						controller: 'GroupAuditViewController'
					}
				}
			})
			
			.state('root.app.group-dashboard.groupEvents', {
				url: '/groupEvents',
				views: {
					'groupDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/group/group-tabs/group-schedule.partial.html',
						controller: 'GroupScheduleViewController'
					}
				}
			})
			
			.state('root.app.group-dashboard.groupJobTemplate', {
				url: '/groupJobTemplate',
				views: {
					'groupDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/group/group-tabs/group-jobsTemplate.partial.html',
						controller: 'GroupJobTemplateViewController'
					}
				},
			})


			.state('root.app.settings', {
				url: 'settings',
//				templateUrl: moduleTemplatePath + '/settings/settings.list.view.html',
				templateUrl: moduleTemplatePath + '/settings/Settings_Comming_soon.view.html',
				//controller: 'UserProfileViewController',
				resolve: {}
			})

			.state('root.app.account', {
				url: 'account',
				templateUrl: moduleTemplatePath + '/settings/account.view.html',
				 controller: 'UserProfileViewController',
				resolve: {}
			})

			.state('root.app.files', {
				url: 'settings',
				templateUrl: moduleTemplatePath + '/file/file.list.view.html',
				controller: 'FileListViewController',
				resolve: {}
			})

			.state('root.app.change-password', {
				url: 'change-password',
				templateUrl: moduleTemplatePath + '/user/change-password/change-password.partial.html',
				controller: 'ChangePasswordViewController',
				resolve: {}
			})


			.state('root.app.dashboard', {
				url: 'dashboard',
				templateUrl: moduleTemplatePath + '/dashboard/dashboard.view.html',
				controller: 'DashboardViewController',
				resolve: {}
			})

			.state('root.app.logs', {
				url: 'logs',
				templateUrl: moduleTemplatePath + '/log/appLog.view.html',
				controller: 'AppLoggerViewController',
				resolve: {}
			})

			.state('root.app.job-view', {
				url: 'job-dashboard/:jobId',
				abstract: true,
				templateUrl: moduleTemplatePath + '/job/job-dashboard/job-dashboard.view.html',
				controller: 'JobDashboardViewController',
				resolve: {
					jobModel: ['$q', '$stateParams', 'BootService', 'DataProvider', 'blockUI', 'Lang',
						function ($q, $stateParams, BootService, DataProvider, blockUI, Lang) {
							var jobId = $stateParams.jobId
								, deferred = $q.defer()
								, LANG = Lang.data
								;
							if (!BootService.isAppReady()) {
								deferred.reject();
								return deferred.promise;
							}
							blockUI.start();
							DataProvider.resource.Job.find(jobId)
								.then(function (jobModel) {
									"use strict";
									blockUI.stop();
									deferred.resolve(jobModel);
								})
								.catch(function (err) {
									"use strict";
									blockUI.stop(err.respMsg, {
										status: 'isError',
										action: LANG.BUTTON.OK
									});
									deferred.reject(err)
								});
							return deferred.promise;
						}]
				}
			})

			.state('root.app.job-view.jobProfile', {
				url: '/jobProfile',
				views: {
					'jobDasboardTabContainer': {
						templateUrl: moduleTemplatePath + '/job/job-dashboard/job-info.partial.html',
						controller: 'JobInfoViewController'
					}
				}
			})

			.state('root.app.job-view.jobMembers', {
				url: '/jobMembers',
				views: {
					'jobDasboardTabContainer': {
						templateUrl: moduleTemplatePath + '/job/job-dashboard/job-memberList.partial.html',
						controller: 'JobMemeberViewController'

					}
				}
			})

			.state('root.app.job-view.jobChat', {
				url: '/jobChat',
				views: {
					'jobDasboardTabContainer': {
						templateUrl: moduleTemplatePath + '/job/job-dashboard/job-chat.partial.html',
						controller: 'JobChatViewController'
					}
				}
			})

			.state('root.app.job-view.jobVault', {
				url: '/jobVault',
				views: {
					'jobDasboardTabContainer': {
						templateUrl: moduleTemplatePath + '/job/job-dashboard/job-vault.partial.html',
						controller: 'JobVaultViewController'

					}
				}
			})

			.state('root.app.job-view.jobTask', {
				url: '/jobTask',
				views: {
					'jobDasboardTabContainer': {
						templateUrl: moduleTemplatePath + '/job/job-dashboard/job-taskList.partial.html',
						controller: 'JobTaskListViewController'

					}
				}
			})
			
			.state('root.app.job-view.jobForm', {
				url: '/jobForm',
				views: {
					'jobDasboardTabContainer': {
						templateUrl: moduleTemplatePath + '/job/job-dashboard/job-form.partial.html',
						controller: 'JobFormViewController'
					}
				}
			})

			.state('root.app.job-view.jobAudit', {
				url: '/jobAudit',
				views: {
					'jobDasboardTabContainer': {
						templateUrl: moduleTemplatePath + '/job/job-dashboard/job-audit.partial.html',
						controller: 'JobAuditViewController'

					}
				}
			})
			
			.state('root.app.job-view.jobTalk', {
				url: '/jobTalk',
				params : {meetingId : null},
				views: {
					'jobDasboardTabContainer': {
						templateUrl: moduleTemplatePath + '/job/job-dashboard/job-meeting.partial.html',
						controller: 'JobMeetingViewController'

					}
				}
			})
			


			// Create Job View
			.state('root.app.org-createJob', {
				url: 'org/:orgId/create-job',
				templateUrl: moduleTemplatePath + '/job/job-create/createJob.view.html',
				controller: 'CreateJobViewController',
				resolve: {}
			})

			// Edit Job details
			.state('root.app.job-edit', {
				url: 'job/:jobId/edit',
				templateUrl: moduleTemplatePath + '/job/job-edit/job-edit.view.html',
				controller: 'JobEditViewController',
				resolve: {}
			})

			// Job Listing View
			.state('root.app.job-list', {
				url: 'job/list/tab/',
				abstract: true,
				templateUrl: moduleTemplatePath + '/job/job-list/job-list.view.html',
				controller: 'JobTabsListViewController',
				resolve: {}
			})

			.state('root.app.job-list.openJobList', {
				url: 'openJobList',
				views: {
					'jobListTabContainer': {
						templateUrl: moduleTemplatePath + '/job/job-list/job-list.partial.html',
						controller: 'OpenJobsTabViewController',
						resolve: {}
					}
				},
			})

			.state('root.app.job-list.pendingTimesheetJobList', {
				url: 'pendingTimesheetJobList',
				views: {
					'jobListTabContainer': {
						templateUrl: moduleTemplatePath + '/job/job-list/job-timesheet.partial.html',
						controller: 'PTJobListViewController',
						resolve: {}
					}
				},
			})

			.state('root.app.job-list.pendingRatingJobList', {
				url: 'pending-rating',
				views: {
					'jobListTabContainer': {
						templateUrl: moduleTemplatePath + '/job/job-list/job-ratings.partial.html',
						controller: 'UnratedJobsTabViewController',
						resolve: {}
					}
				},
			})

			// Job Contributor Manager View
			.state('root.app.job-contributors', {
				url: 'job/:jobId/contributors',
				templateUrl: moduleTemplatePath + '/job/job-contrib/job-contrib.view.html',
				controller: 'ListJobContriViewController',
				resolve: {}
			})

			// Job Forms Listing
			.state('root.app.job-forms', {
				url: 'job/:jobId/forms',
				templateUrl: moduleTemplatePath + '/job/job-forms/job-forms-list.view.html',
				controller: 'JobFormsViewController',
				resolve: {}
			})

			.state('root.app.job-verify', {
				url: 'job/:jobId/job-verify',
				templateUrl: moduleTemplatePath + '/job/job-verify/jobVerify.view.html',
				controller: 'JobVerifyViewController',
				resolve: {}
			})
			.state('root.app.job-createTask', {
				url: 'job/:jobId/create-task',
				templateUrl: moduleTemplatePath + '/task/task-create/createTask.view.html',
				controller: 'CreateTaskViewController',
				resolve: {}
			})

			/*.state('root.app.task-dashboard', {
			 url: 'job/:jobId/:taskId/task-dashboard',
			 templateUrl: moduleTemplatePath + '/task/task-dashboard/taskDashboard.view.html',
			 controller: 'TaskDashboardViewController',
			 resolve: {}
			 })*/

			.state('root.app.task-dashboard', {
				url: 'job/:jobId/task-dashboard/:taskId',
				abstract: true,
				templateUrl: moduleTemplatePath + '/task/task-dashboard/taskDashboard.view.html',
				controller: 'TaskDashboardViewController',
				resolve: {}
			})

			.state('root.app.task-dashboard.taskProfile', {
				url: '/taskProfile',
				views: {
					'taskDasboardTabContainer': {
						templateUrl: moduleTemplatePath + '/task/task-dashboard/task-info.partial.html',
						controller: 'TaskInfoViewController'
					}
				},
			})
			.state('root.app.task-dashboard.taskMembers', {
				url: '/taskMembers',
				views: {
					'taskDasboardTabContainer': {
						templateUrl: moduleTemplatePath + '/task/task-dashboard/task-memberList.partial.html',
						controller: 'TaskMemberViewController'
					}
				},
			})
			.state('root.app.task-dashboard.taskChat', {
				url: '/taskChat',
				views: {
					'taskDasboardTabContainer': {
						templateUrl: moduleTemplatePath + '/task/task-dashboard/task-chat.partial.html',
						controller: 'TaskChatViewController'
					}
				}
			})
			.state('root.app.task-dashboard.taskVault', {
				url: '/taskVault',
				views: {
					'taskDasboardTabContainer': {
						templateUrl: moduleTemplatePath + '/task/task-dashboard/task-vault.partial.html',
						controller: 'TaskVaultViewController'
					}
				}
			})
      .state('root.app.task-dashboard.taskAudit', {
        url: '/taskAudit',
        views: {
          'taskDasboardTabContainer': {
            templateUrl: moduleTemplatePath + '/task/task-dashboard/task-audit.partial.html',
            controller: 'TaskAuditViewController'
          }
        }
      })
            .state('root.app.task-dashboard.taskTalk', {
        url: '/taskAudit',
        params : {jobId : null, taksId : null, meetingId : null},
        views: {
          'taskDasboardTabContainer': {
            templateUrl: moduleTemplatePath + '/task/task-dashboard/task-meeting.partial.html',
            controller: 'TaskMeetingViewController'
          }
        }
      })



			// Task Forms listing
			.state('root.app.task-forms', {
				url: 'task/:taskId/forms',
				templateUrl: moduleTemplatePath + '/task/task-forms/task-forms-list.view.html',
				controller: 'TaskFormsViewController',
				resolve: {}
			})

			.state('root.app.task-update', {
				url: 'task/:jobId/:taskId/update',
				templateUrl: moduleTemplatePath + '/task/task-update/taskUpdate.view.html',
				controller: 'UpdateTaskViewController',
				resolve: {}
			})

			// Form Creator
			.state('root.app.form-create', {
				url: 'form/create',
				templateUrl: moduleTemplatePath + '/form/form-build/form-factory.view.html',
				controller: 'FormFactoryViewController',
				resolve: {}
			})

			// Form Preview
			.state('root.app.form-view', {
				url: 'form/view?formId',
				templateUrl: moduleTemplatePath + '/form/form-view/form-view.view.html',
				controller: 'FormViewController',
				resolve: {}
			})

			// Template List
			.state('root.app.user-templates', {
				url: 'user/templates/',
				templateUrl: moduleTemplatePath + '/form/template-list/template-list.view.html',
				controller: 'TemplateListViewController',
				resolve: {}
			})

			// Template Editor
			.state('root.app.template-edit', {
				url: 'user/template/edit?id&name&desc',
				templateUrl: moduleTemplatePath + '/form/template-editor/templateEditor.view.html',
				controller: 'TemplateEditorViewController',
				resolve: {}
			})

			// Form Manager
			.state('root.app.job-form-manage', {
				url: 'job/:jobId/form-manage?:context',
				templateUrl: moduleTemplatePath + '/form/form-manage/form-manage.view.html',
				controller: 'FormManagerViewController',
				resolve: {}
			})

			.state('root.app.user-personal-chat', {
				url: 'user-personal-chat/from-:user1/to-:user2',
				templateUrl: moduleTemplatePath + '/chat/personal-chat/personalChat.view.html',
				controller: 'PersonalChatViewController',
				resolve: {}
			})
			
			//People Invitations
			.state('root.app.people', {
				url: 'people',
				abstract: true,
				templateUrl: moduleTemplatePath + '/people-invitation/people-invitation-tabs.view.html',
				controller: 'PeopleTabsViewController',
				resolve: {}
			})
			.state('root.app.people.search', {
				url: '/search',
				views: {
					'peopleTabContainer': {
						templateUrl: moduleTemplatePath + '/people-invitation/tabs/tab-searchPeople.html',
						controller: 'PeopleSearchViewController'

					}
				}
			})
			.state('root.app.people.tag', {
				url: '/tag',
				views: {
					'peopleTabContainer': {
						templateUrl: moduleTemplatePath + '/people-invitation/tabs/tab-tagPeople.html',
						controller: 'PeopleTagViewController'

					}
				}
			})
			.state('root.app.people.invites', {
				url: '/invites',
				views: {
					'peopleTabContainer': {
						templateUrl: moduleTemplatePath + '/people-invitation/tabs/tab-invites.html',
						controller: 'PeopleInvitesViewController'

					}
				}
			})
			.state('root.app.audit-org-list', {
				url: 'user/:userId/audit/org',
				templateUrl: moduleTemplatePath + '/wp-audit/wp-audit-org.partial.html',
				controller: 'wpAuditOrgController',
				resolve: {}
			})
			.state('root.app.audit-dashboard', {
				url: 'audit/dashboard/:orgId',
				abstract: true,
				templateUrl: moduleTemplatePath + '/wp-audit/audit-tabs/auditDashboard.view.html',
				controller: 'AuditDashboardViewController',
				resolve: {}
			})

			.state('root.app.audit-dashboard.forensics', {
				url: '/forensics',
				params: {org : null},
				views: {
					'auditDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/wp-audit/audit-tabs/auditForensics.view.html',
						controller: 'AuditForensicsViewController'
					}
				},
			})

			.state('root.app.audit-dashboard.productivity', {
				url: '/productivity',
				views: {
					'auditDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/wp-audit/audit-tabs/auditProductivity.view.html',
						controller: 'AuditProductivityViewController'
					}
				},
			})
			.state('root.app.audit-dashboard.collaboration', {
				url: '/collaboration',
				views: {
					'auditDashboardTabContainer': {
						templateUrl: moduleTemplatePath + '/wp-audit/audit-tabs/auditCollaboration.view.html',
						controller: 'AuditCollaborationViewController'
					}
				},
			})

		
	}

})();
