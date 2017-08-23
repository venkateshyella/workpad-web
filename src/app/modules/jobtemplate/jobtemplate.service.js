/**
 * Created by sandeep on 28/09/16.
 */
(function () {
	"use strict";

	angular.module('app.services')
	.service('JobTemplateService', [
	                                '$q', 'Connect',
	                                'mDialog', '$mdToast',
	                                'blockUI', 'Lang','DataProvider','URL',
	                                'AppCoreUtilityServices','Session','JobAdvertisementFactory','JobTemplateMemberSearchFactory',
	                                JobTemplateService
	                                ]);

	function JobTemplateService($q, Connect, Dialog, $mdToast, blockUI, Lang, 
			DataProvider, URL, AppCoreUtilityServices, Session,JobAdvertisementFactory,JobTemplateMemberSearchFactory) {

		var LANG = Lang.en.data;

		function createJobTemplateDialog(orgId, groupId, template, jobList) { 

			var _deferred = $q.defer(), createJobTemplateDialogOptions;

			createJobTemplateDialogOptions = {
					controller: ['$scope', '$mdDialog', '$timeout',
					             createJobTemplateController],
					             templateUrl: 'app/modules/jobtemplate/JobTemplateCreate.dialog.tpl.html',
					             clickOutsideToClose:false,
			};

			Dialog.show(createJobTemplateDialogOptions)
			.then(function (res) {
				_deferred.resolve(res)
			})
			.catch(function (err) {
				_deferred.reject(err);
			})
			.finally(function () {
			});

			return _deferred.promise;

			function createJobTemplateController($scope, $mdDialog, $timeout) {
				var ownerInviteTemp = new JobAdvertisementFactory.GroupAdvertisement();
				var memberInviteTemp = new JobAdvertisementFactory.GroupAdvertisement();
			
				if (jobList) {
					$scope.isTemplateFromJob = true;
					$scope.fromClosedJob = true;
					$scope.closedJobs = jobList;
					$scope.form = {};
				}
				
				$scope.expectedFinishTime = function(type,value){
            		var now = new Date();
            		if(type == "-523" ){
            			now.setHours(now.getHours() + value);
            		}else if(type == "-524"){
            			now.setHours(((value*24)+23),59,59,0);
            		}else if(type == "-525"){
            			now.setHours(((value*24*7)+23),59,59,0);
            		}else if(type == "-526"){
            			now.setMonth(now.getMonth() + value);
            		}else if(type == "-520"){
            			now = $scope.jobTemplateModel.expectedFinishDate;
            			return now;
            		}else{
            			now = value;
            		}
            		return (now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-GB'));
            	}
				
				function initScope(template) {
					
					if (!$scope.fromClosedJob) {
						$scope.form = {};
					}
					
					$scope.taskForm = {};
					$scope.jobTemplateModel = {};
					$scope.jobTemplateModel.tasks = [];
					$scope.jobTemplateTaskModel = {};
					$scope.templateOwnerInvites = [];
					$scope.templateMemberInvites = [];
					$scope.maxLength = 256;
					 
					$scope.jobTemplateModel.jobOwner = false;
					$scope.isUpdate = false;
					$scope.isPreview = false;

					$scope.memberInvite = memberInviteTemp;
					$scope.ownerInvite = ownerInviteTemp;
					$scope.eventDateFormat = "dd-MM-yyyy";
	                var d = new Date();
					d.setDate(d.getDate() - 1);
					$scope.minDate = d.toString();
					
					$scope.jobendTimeValueTypes = [ {label :"Hours", value : "-523"},
					                                 {label : "Days", value : "-524"},
					                                 {label : "Weeks", value : "-525"},
					                                 {label : "Months", value : "-526"},
					                                 {label : "Select date", value : "-520"},
					                                 ];
					
					$scope.endtimeTypeLabels = {
							"-523" : "Hours", 
							"-524" : "Days",
							"-525" : "Weeks", 
							"-526" : "Months",
							"-520" : "Date"
					};
					
					$scope.jobTemplateModel.endTimeType = "-523";
	            	$scope.jobTemplateModel.endTimeValue = 24; 
	            	
	            	
					
					if (template) {
						
						$scope.isMemUpdated = false;
						$scope.isUpdate = true;
						$scope.jobTemplateModel = template;
						$scope.jobTemplateModel.endTimeType = template.endTimeType.toString();

						if ($scope.jobTemplateModel.expectedFinishDate != null) {
							var startdate = new Date($scope.jobTemplateModel.expectedFinishDate);
							var formattedDateStr = startdate.getDate()+"-"+(startdate.getMonth()+1)+"-"+startdate.getFullYear();
							$scope.jobTemplateModel.expectedFinishDate = formattedDateStr;
						}

						$scope.ownerOrgs = [];
						$scope.ownerGroups = [];
						$scope.selectedOwnerOrgs = [];
						$scope.selectedOwnerGroup = [];

						/* fetching org ids,group ids and member ids for owners */
						if (template.owners.length > 0) {
							var ownerOrgData = [];
							var ownerGroupData = [];
							angular.forEach(template.owners, function (owner) {
								if (owner.organization != null && owner.group != null) {
									var obj = angular.toJson({'type':'GRP','groupId':owner.group.id});
									if (ownerGroupData.indexOf(obj) < 0) {
										ownerGroupData.push(obj);
										$scope.ownerGroups.push(angular.fromJson(obj));
									}
									$scope.selectedOwnerGroup.push({'userId':owner.id,'groupId':owner.group.id})
								} 
								if (owner.organization != null && owner.group == null) {
									var obj = angular.toJson({'type':'ORG','orgId':owner.organization.id});
									if (ownerOrgData.indexOf(obj) < 0) {
										ownerOrgData.push(obj);
										$scope.ownerOrgs.push(angular.fromJson(obj));
									}
									$scope.selectedOwnerOrgs.push({'userId':owner.id,'orgId':owner.organization.id})
								}
							});
							ownerOrgData = [];
							ownerGroupData = [];
						}

						/* fetching org ids,group ids and member ids for contributors */
						$scope.memOrgs = [];
						$scope.memGoups = [];
						$scope.selectedmemOrgs = [];
						$scope.selectedmemGroup = [];

						if (template.contributors.length > 0) {
							var memOrgData = [];
							var memGroupData = [];
							angular.forEach(template.contributors, function (mem) {
								if (mem.organization != null && mem.group != null) {
									var obj = angular.toJson({'type':'GRP','groupId':mem.group.id});
									if (memGroupData.indexOf(obj) < 0) {
										memGroupData.push(obj);
										$scope.memGoups.push(angular.fromJson(obj));
									}
									$scope.selectedmemGroup.push({'userId':mem.id,'groupId':mem.group.id});
								} 
								if (mem.organization != null && mem.group == null) {
									var obj = angular.toJson({'type':'ORG','orgId':mem.organization.id});
									if (memOrgData.indexOf(obj) < 0) {
										memOrgData.push(obj);
										$scope.memOrgs.push(angular.fromJson(obj));	
									}
									$scope.selectedmemOrgs.push({'userId':mem.id,'orgId':mem.organization.id});
								}
							});
							memOrgData = [];
							memGroupData = [];
						}

						/* to fill owner object for org*/
						angular.forEach($scope.ownerOrgs, function (owner) {
							updateOwnerAddNewSearchResult(owner);	
							ownerToggleOrgMembersList(owner.orgId);
						});

						/* to fill owner object for group*/
						angular.forEach($scope.ownerGroups, function (owner) {
							updateOwnerAddNewSearchResult(owner);	
							ownerToggleAdvGroupMembersList(owner.groupId)
						});

						/* to fill contributor object for org*/
						angular.forEach($scope.memOrgs, function (mem) {
							updateMemAddNewSearchResult(mem);	
							memberToggleOrgMembersList(mem.orgId);
						});

						/* to fill contributor object for group*/
						angular.forEach($scope.memGoups, function (mem) {
							updateMemAddNewSearchResult(mem);	
							memberToggleAdvGroupMembersList(mem.groupId);
						});
					}

					var d = new Date();
					d.setDate(d.getDate() - 1);
					$scope.minDate = d.toString();
					$scope.eventDateFormat = "dd-MM-yyyy";

					$scope.getOwnerModel = {
							User: DataProvider.resource.User.get,
							Group: DataProvider.resource.Group.get,
							Org: DataProvider.resource.Organisation.get
					};

					$scope.getMemberModel = {
							User: DataProvider.resource.User.get,
							Group: DataProvider.resource.Group.get,
							Org: DataProvider.resource.Organisation.get
					};

					$scope.ownerToggleSelectAllOrgMembers = ownerToggleSelectAllOrgMembers;
					$scope.ownerToggleOrgMembersList = ownerToggleOrgMembersList;
					$scope.ownerRemoveOrg = ownerRemoveOrg;
					$scope.ownerToggleAdvOrgMember = ownerToggleAdvOrgMember;
					$scope.ownerToggleAdvGroupSelectAll = ownerToggleAdvGroupSelectAll;
					$scope.ownerRemoveGroup = ownerRemoveGroup;
					$scope.ownerToggleAdvGroupMember = ownerToggleAdvGroupMember;
					$scope.ownerToggleAdvGroupMembersList = ownerToggleAdvGroupMembersList;

					$scope.memberToggleSelectAllOrgMembers = memberToggleSelectAllOrgMembers;
					$scope.memberToggleOrgMembersList = memberToggleOrgMembersList;
					$scope.memberRemoveOrg = memberRemoveOrg;
					$scope.memberToggleAdvOrgMember = memberToggleAdvOrgMember;
					$scope.memberToggleAdvGroupSelectAll = memberToggleAdvGroupSelectAll;
					$scope.memberRemoveGroup = memberRemoveGroup;
					$scope.memberToggleAdvGroupMember = memberToggleAdvGroupMember;
					$scope.memberToggleAdvGroupMembersList = memberToggleAdvGroupMembersList;
					$scope.removeTask=removeTask;
					$scope.taskSubmit=taskSubmit;
					$scope.templateSubmit=templateSubmit;
					$scope.updateSubmit = updateSubmit;
					$scope.showJobTemplatePreview = _showJobTemplatePreview;
					$scope.closeTemplatePreview = _closeTemplatePreview;
					$scope.existingjobTemplateInfo = existingjobTemplateInfo;
				}

				$scope.close = function () {
					$mdDialog.hide();
				}

				$scope.formWizard = function () {
					$scope.vm = this;
					$scope.vm.currentStep = 1;
					$scope.vm.steps = [
					                   {
					                	   step: 1,
					                	   name: "Info",
					                	   template: "app/modules/jobtemplate/jobInfoTemplate.dialog.tpl.html"
					                   },
					                   {
					                	   step: 2,
					                	   name: "Members",
					                	   template: "app/modules/jobtemplate/jobMembersTemplate.dialog.tpl.html"
					                   },   
					                   {
					                	   step: 3,
					                	   name: "Tasks",
					                	   template: "app/modules/jobtemplate/jobTaskTemplate.dialog.tpl.html"
					                   },             
					                   ];


					$scope.vm.gotoStep = function(newStep , currentStep) {

						blockUI.start("Verifying form", {
							status: 'isLoading'
						});
						
						/*if (currentStep == 1 && !$scope.form.createTemplate.$valid) {
							blockUI.stop("Template name and Description are mandatory", {
								status: 'isError',
								action: 'Ok'
							});

						} else if (currentStep == 2 && !$scope.ownerInvite.isValid() && !$scope.jobTemplateModel.jobOwner) {
							blockUI.stop("Inviting Owners to the Template is mandatory", {
								status: 'isError',
								action: 'Ok'
							});
						} */
						
						if (currentStep == 1) {
							if((newStep == 2 || newStep == 3)&& !$scope.form.createTemplate.$valid){
								blockUI.stop("Job name and Description are mandatory", {
									status: 'isError',
									action: 'Ok'
								});
							}else if(newStep == 3 && !$scope.jobTemplateModel.jobOwner){
								blockUI.stop("Only owner of the job can add tasks", {
									status: 'isError',
									action: 'Ok'
								});
							}else {
								blockUI.stop();
								$scope.vm.currentStep = newStep;
							}
						} else if (currentStep == 2) {
							if(newStep == 1 && !$scope.ownerInvite.isValid() && !$scope.jobTemplateModel.jobOwner){
								blockUI.stop("Inviting Owners to the job is mandatory", {
									status: 'isError',
									action: 'Ok'
								});
							}else if(newStep == 3 && !$scope.jobTemplateModel.jobOwner){
								blockUI.stop("Only owner of the job can add tasks", {
									status: 'isError',
									action: 'Ok'
								});
							}else {
								blockUI.stop();
								$scope.vm.currentStep = newStep;
							}
						}else {
							blockUI.stop();
							$scope.vm.currentStep = newStep;
						}
						
						if (newStep != 1 && !$scope.isMemUpdated) {
							$scope.isMemUpdated = true;
						
							/* remove all org mem for owner*/
							angular.forEach($scope.ownerOrgs, function (ownerOrg) {
								ownerToggleSelectAllOrgMembers(ownerOrg.orgId);
							});
							
							/* add selected org mem for owner*/
							angular.forEach($scope.selectedOwnerOrgs, function (ownerOrg) {
								ownerToggleAdvOrgMember(ownerOrg.orgId,ownerOrg.userId);
							});
							
							/* remove all group mem for owner*/
							angular.forEach($scope.ownerGroups, function (ownerGrp) {
								ownerToggleAdvGroupSelectAll(ownerGrp.groupId);
							});
							
							/* add selected group mem for owner*/
							angular.forEach($scope.selectedOwnerGroup, function (ownerGrp) {
								ownerToggleAdvGroupMember(ownerGrp.groupId,ownerGrp.userId);
							});
							
							/* remove all org mem for contributor*/
							angular.forEach($scope.memOrgs, function (memOrg) {
								memberToggleSelectAllOrgMembers(memOrg.orgId);
							});
							
							/* add selected org mem for contributor*/
							angular.forEach($scope.selectedmemOrgs, function (memOrg) {
								memberToggleAdvOrgMember(memOrg.orgId,memOrg.userId);
							});
							
							/* remove all group mem for contributor*/
							angular.forEach($scope.memGoups, function (memGrp) {
								memberToggleAdvGroupSelectAll(memGrp.groupId);
							});
							
							/* add selected group mem for contributor*/
							angular.forEach($scope.selectedmemGroup, function (memGrp) {
								memberToggleAdvGroupMember(memGrp.groupId,memGrp.userId);
							});

						}
					}

					$scope.vm.getStepTemplate = function(){
						for (var i = 0; i < $scope.vm.steps.length; i++) {
							if ($scope.vm.currentStep == $scope.vm.steps[i].step) {
								return $scope.vm.steps[i].template;
							}
						}
					}
				}

				function existingjobTemplateInfo(jobId){
					$scope.isTemplateFromJob = false;
					var params = {
							jobId : jobId,
							userSessionId : Session.id
					}
					DataProvider.resource.JobTemplate.existingJobTemplateInfo(params)
					.then(function (res) {
						res.owners = res.invitedOwners;
						res.contributors = res.invitedContributors;
						delete res.invitedOwners;
						delete res.invitedContributors;
						
						initScope(res);
						
					}, function (error) {
						
					});

				}

				function templateSubmit(templateObj) {

					blockUI.start("Creating Template...", {
						status: 'isLoading'
					});
					
					var template = parseToTemplateEntity(templateObj);

					createTemplate(template).then(function(res) {
						blockUI.stop("Template "+res.templateName+" created successfully.");
						res.isSuccess = true;
						$mdDialog.hide(res);
					}).catch(function (err) {             		
						blockUI.stop(err.respMsg, {
							status: 'isError',
							action: 'Ok'
						});
					})
					.finally(function () {
					})
				}

				function updateSubmit(templateObj) {
					blockUI.start("Updating Template...", {
						status: 'isLoading'
					});
					
					var template = parseToTemplateEntity(templateObj);

					updateTemplate(template).then(function(res) {
						blockUI.stop("Template "+res.resp.templateName+" updated successfully.");
						res.isSuccess = true;
						$mdDialog.hide(res);
					}).catch(function (err) {             		
						blockUI.stop(err.respMsg, {
							status: 'isError',
							action: 'Ok'
						});
					})
					.finally(function () {
					})
				}

				function createTemplate(template) {
					var deferred = $q.defer();
					DataProvider.resource.JobTemplate.create(template)
					.then(function (res) {
						deferred.resolve(res);
					}, function (error) {
						deferred.reject(error)
					});

					return deferred.promise;
				};

				function updateTemplate(template) {
					var deferred = $q.defer();
					DataProvider.resource.JobTemplate.updateTemplate(template)
					.then(function (res) {
						deferred.resolve(res);
					}, function (error) {
						deferred.reject(error)
					});

					return deferred.promise;
				};

				function parseToTemplateEntity(templateObj) {

					$scope.templateModel = {};
					
					if (templateObj.id) {
						$scope.templateModel.id = templateObj.id;
					}
					
					$scope.templateModel.orgId = orgId;
					$scope.templateModel.groupId = groupId;
					$scope.templateModel.templateName = templateObj.templateName;
					$scope.templateModel.desc = templateObj.desc;
					$scope.templateModel.expectedFinishDate = templateObj.expectedFinishDate;
					$scope.templateModel.userSessionId = Session.id;
					$scope.templateModel.tasks = templateObj.tasks;
					$scope.templateModel.jobOwner=templateObj.jobOwner;
					$scope.templateModel.owners = [];
					$scope.templateModel.contributors = [];
					$scope.templateModel.endTimeType = templateObj.endTimeType;
	            	$scope.templateModel.endTimeValue = templateObj.endTimeValue;

					if (templateObj.expectedFinishDate) {
						var date = AppCoreUtilityServices.convertStringToDate(templateObj.expectedFinishDate,'dd-mm-yyyy','-');
						$scope.templateModel.expectedFinishDate = AppCoreUtilityServices.convertDateToTimeStamp(date);
					}
					
					var ownerOrg = ownerInviteTemp.getInvitationOrgs() || {};
					var ownerGroup = ownerInviteTemp.getInvitationGroups() || {};
					var memberOrg = memberInviteTemp.getInvitationOrgs() || {};
					var memberGroup = memberInviteTemp.getInvitationGroups() || {};

					if (!$scope.templateModel.jobOwner) {

						var ownerOrgKeys = Object.keys(ownerOrg);
						if (ownerOrgKeys.length > 0) {
							for (var i= 0; i < ownerOrgKeys.length; i++) {
								if (ownerOrg[ownerOrgKeys[i]] != undefined && ownerOrg[ownerOrgKeys[i]].invitee.length > 0) {
									angular.forEach(ownerOrg[ownerOrgKeys[i]].invitee, function (invitee) {
										var user = {
												userId : invitee,
												orgId : ownerOrgKeys[i]
										}
										$scope.templateModel.owners.push(user);
									});
								}
							}
						}
						
						
						var ownerGroupKeys = Object.keys(ownerGroup);
						if (ownerGroupKeys.length > 0) {
							for (var i= 0; i < ownerGroupKeys.length; i++) {
								if (ownerGroup[ownerGroupKeys[i]] != undefined && ownerGroup[ownerGroupKeys[i]].invitee.length > 0) {
									angular.forEach(ownerGroup[ownerGroupKeys[i]].invitee, function (invitee) {
										var user = {
												userId : invitee,
												groupId : ownerGroupKeys[i]
										}
										$scope.templateModel.owners.push(user);
									});
								}
							}
						}
					
					}
					
					var memberOrgKeys = Object.keys(memberOrg);
					if (memberOrgKeys.length>0) {
						for (var i= 0; i < memberOrgKeys.length; i++) {
							if ( memberOrg[memberOrgKeys[i]] != undefined && memberOrg[memberOrgKeys[i]].invitee.length>0) {
								angular.forEach(memberOrg[memberOrgKeys[i]].invitee, function (invitee) {
									var user = {
											userId : invitee,
											orgId : memberOrgKeys[i]
									}
									$scope.templateModel.contributors.push(user);
								});
							}
						}
					}
				
					var memberGroupKeys = Object.keys(memberGroup);
					if (memberGroupKeys.length>0) {
						for (var i= 0; i < memberGroupKeys.length; i++) {
							if ( memberGroup[memberGroupKeys[i]] != undefined && memberGroup[memberGroupKeys[i]].invitee.length>0) {
								angular.forEach(memberGroup[memberGroupKeys[i]].invitee, function (invitee) {
									var user = {
											userId : invitee,
											groupId : memberGroupKeys[i]
									}
									$scope.templateModel.contributors.push(user);
								});
							}
						}
					}

					return $scope.templateModel;
				}

				function taskSubmit(task,form) {
					$scope.jobTemplateModel.tasks.push(task);
					$scope.jobTemplateTaskModel = {};
					if (form) {
						var actualMaxLength = $scope.maxLength;
                        $scope.maxLength = 500;
                        $timeout(function () {
                            $scope.maxLength = actualMaxLength;
                        })
						form.$setPristine();
						form.$setUntouched();
					}
				}

				function removeTask(index) {
					$scope.jobTemplateModel.tasks.splice(index, 1);

				}

				/* members search code starts from here */
				$scope.ownerSearchCtrl = {
						selection: null,
						searchText: "",
						selectedItemChange: function (item,type) {
							if (item) {
								ownerAddNewSearchResult(item);
								
							}
							$timeout(function () {
								$scope.ownerSearchCtrl.searchText = "";
							}, 200)
						},
						querySearch: function (queryStr) {
							if (queryStr && queryStr.length > 0) {
								var params =  {
										searchByName: queryStr,
										orgId : orgId,
										inviteType : "OWNER",
										userSessionId : Session.id
								}
								return DataProvider.resource.JobTemplate.searchOrgsAndGroups(params)
								.then(function (res) {
									var groups = prepareGroupQueryResult(res.groups);
									var orgs = prepareOrgQueryResult(res.orgs);
									var result = [].concat(orgs, groups);
									console.log(result);
									return result;
								})
								.catch(function () {
									return null;
								})
								;
							} else {
								return [];
							}

							function prepareOrgQueryResult(orgs) {
								var searchResults = _.map(orgs, function (orgSearchResult) {
									return {
										displayText: orgSearchResult.orgName,
										val: orgSearchResult,
										type: 'ORG'
									}
								});
								return searchResults;
							}

							function prepareGroupQueryResult(groups) {
								_.remove(groups, function (group) {
									var resultGroup = group;
									return (_.findIndex($scope.selectedGroups, function (advGroup) {
										return resultGroup.groupId == advGroup.groupId;
									}) != -1);
								});
								var searchResults = _.map(groups, function (group) {
									return {
										displayText: group.groupName,
										val: group,
										type: "GRP"
									};
								});
								return searchResults
							}
						}
				};

				function ownerAddNewSearchResult(result) {
					switch (result.type) {
					case 'GRP':
						var group = result.val;
						ownerInviteTemp.addGroup(group.groupId);
						ownerInviteTemp.addSendToAllFlag(group.groupId);
						ownerToggleAdvGroupMembersList(group.groupId);
						break;
					case 'ORG':
						var org = result.val;
						ownerInviteTemp.addOrg(org.orgId);
						ownerInviteTemp.setOrgSendToAll(org.orgId, true);
						ownerToggleOrgMembersList(org.orgId);
						break;
					}
				}

				function ownerRemoveOrg(orgId) {
					$scope.ownerInvite.removeOrg(orgId);	
				}

				function _ownerLoadOrgInvitees(orgId) {
					var deferred = $q.defer()
					, orgExtras = $scope.ownerInvite.getOrgExtras(orgId);
					if (orgExtras.isLoaded) {
						deferred.resolve(orgExtras.users);
					}
					else {
						var options = {
								inviteType: "OWNER",
								orgId : orgId,
								userSessionId : Session.id
						};
						DataProvider.resource.JobTemplate.searchOrgMembers(options)
						.then(function (orgMembers) {
							DataProvider.resource.User.inject(orgMembers);
							orgExtras.users = DataProvider.resource.User.filter({
								where: {
									id: {
										in: _.pluck(orgMembers, "id")
									}
								}
							});
							orgExtras.isLoaded = true;
							_.each(orgMembers, function (user) {
								$scope.ownerInvite.addOrgMember(orgId, user.id);
							});
							deferred.resolve(orgMembers);
						})
						.catch(function (err) {
							orgExtras.err = err;
						})
						.finally(function () {
							orgExtras.isLoading = false;
						})
					}
					return deferred.promise;
				}

				function _ownerLoadGroupInvitees(groupId) {
					$scope.ownerInvite.setGroupExtras(groupId, {});
					var deferred = $q.defer()
					, groupExtras = $scope.ownerInvite.getGroupExtras(groupId);
					if (groupExtras.isLoaded) {
						deferred.resolve(groupExtras.users);
					}
					else {
						var options = {
								inviteType: "OWNER",
								groupId:groupId,
								userSessionId : Session.id
						};
						DataProvider.resource.JobTemplate.searchGroupMembers(options)
						.then(function (groupMembers) {
							DataProvider.resource.User.inject(groupMembers);
							groupExtras.users = DataProvider.resource.User.filter({
								where: {
									id: {
										in: _.pluck(groupMembers, "id")
									}
								}
							});
							groupExtras.isLoaded = true;
							_.each(groupMembers, function (user) {
								$scope.ownerInvite.addGroupMember(groupId, user.id);
							});
							deferred.resolve(groupMembers);
						})
						.catch(function (err) {
							groupExtras.err = err;
						})
						.finally(function () {
							groupsMeta[groupId].isLoading = false;
						})
					}

					return deferred.promise;
				}

				function ownerToggleSelectAllOrgMembers(orgId) {
					var advOrgMembers = $scope.ownerInvite.getOrgExtras(orgId).users;
					if ($scope.ownerInvite.getOrgSendToAll(orgId)) {
						$scope.ownerInvite.setOrgSendToAll(orgId, false);
						$scope.ownerInvite.removeAllOrgMembers(orgId);
					} else {
						$scope.ownerInvite.setOrgSendToAll(orgId, true);
						$scope.ownerInvite.addAllOrgMembers(orgId, _.pluck(advOrgMembers, 'id'));
					}
				}

				function ownerToggleAdvOrgMember(orgId, userId) {
					if ($scope.ownerInvite.getOrgMember(orgId, userId)) {
						$scope.ownerInvite.removeOrgMember(orgId, userId);
					}
					else {
						$scope.ownerInvite.addOrgMember(orgId, userId);
					}
					_ownerUpdateOrgSendToAllFlag(orgId);
				}

				function _ownerUpdateOrgSendToAllFlag(orgId) {
					try {
						var orgInvitees = $scope.ownerInvite.getOrgExtras(orgId).users;
						var selectedOrgInvitees = $scope.ownerInvite.getOrg(orgId).invitee;
						if (orgInvitees.length == selectedOrgInvitees.length) {
							$scope.ownerInvite.setOrgSendToAll(orgId, true);
						} else {
							$scope.ownerInvite.setOrgSendToAll(orgId, false);
						}
					} catch (e) {

					}
				}

				function ownerToggleAdvGroupSelectAll(groupId) {
					var group = $scope.ownerInvite.getGroupExtras(groupId);
					if (ownerInviteTemp.getInvitationGroups()[groupId].sendToAll) {
						ownerInviteTemp.removeSendToAllFlag(groupId);
						_.each(group.users, function (user) {
							ownerInviteTemp.removeGroupMember(groupId, user.id);
						})
					} else {
						ownerInviteTemp.addSendToAllFlag(groupId);
						_.each(group.users, function (user) {
							ownerInviteTemp.addGroupMember(groupId, user.id);
						})
					}
				}

				function ownerRemoveGroup(groupId) {
					if (!groupId) return;
					ownerInviteTemp.removeGroup(groupId);
				}

				function ownerToggleOrgMembersList(orgId) {
					var orgExtras = $scope.ownerInvite.getOrgExtras(orgId) || {};

					$scope.ownerInvite.setOrgExtras(orgId, {
						flag_expanded: !orgExtras.flag_expanded
					});
					_ownerLoadOrgInvitees(orgId)
					.then(function (users) {
						$scope.ownerInvite.setOrgExtras(orgId, {
							users: users
						});
					})

				}

				function ownerToggleAdvGroupMembersList(groupId, isOpen) {

					var groupExtras = $scope.ownerInvite.getGroupExtras(groupId) || {};
					$scope.ownerInvite.setGroupExtras(groupId, {
						flag_expanded: !groupExtras.flag_expanded
					});

					var group = $scope.ownerInvite.getGroupExtras(groupId);
					group._isMembersListExpanded = !group._isMembersListExpanded;
					
					if (group._isLoadingMembersList) return;
					group._isLoadingMembersList = true;
					group._isMemberListLoadError = false;
					return _ownerLoadGroupInvitees(groupId)
					.then(function (users) {
						$scope.ownerInvite.getGroupExtras(groupId, {
							users: users
						});
					})
					.catch(function () {
						group._isMemberListLoadError = true;
						group.users = [];
					})
					.finally(function () {
						group._isLoadingMembersList = false;
					});
				}

				function ownerToggleAdvGroupMember(groupId, userId) {
					var advData = $scope.ownerInvite.getSavedData();
					if (advData.groups[groupId].invitee.indexOf(userId) > -1) {
						ownerInviteTemp.removeGroupMember(groupId, userId);
					}
					else {
						ownerInviteTemp.addGroupMember(groupId, userId);
					}
					_ownerUpdateGroupSendToAllFlag(groupId);
				}

				function _ownerUpdateGroupSendToAllFlag(groupId) {
					try {
						var groupInvitees = $scope.ownerInvite.getGroupExtras(groupId).users;
						var selectedGroupInvitees = $scope.ownerInvite.getGroup(groupId).invitee;
						if (groupInvitees.length == selectedGroupInvitees.length) {
							$scope.ownerInvite.setGroupSendToAll(groupId, true);
						} else {
							$scope.ownerInvite.setGroupSendToAll(groupId, false);
						}
					} catch (e) {

					}
				}

				$scope.memberSearchCtrl = {
						selection: null,
						searchText: "",
						selectedItemChange: function (item,type) {
							if (item) {
								memberAddNewSearchResult(item);
								
							}
							$timeout(function () {
								$scope.memberSearchCtrl.searchText = "";
							}, 200)
						},
						querySearch: function (queryStr) {
							if (queryStr && queryStr.length > 0) {
								var params =  {
										searchByName: queryStr,
										orgId : orgId,
										inviteType : "OWNER",
										userSessionId : Session.id
								}
								return DataProvider.resource.JobTemplate.searchOrgsAndGroups(params)
								.then(function (res) {
									var groups = prepareGroupQueryResult(res.groups);
									var orgs = prepareOrgQueryResult(res.orgs);
									var result = [].concat(orgs, groups);
									console.log(result);
									return result;
								})
								.catch(function () {
									return null;
								})
								;
							} else {
								return [];
							}

							function prepareOrgQueryResult(orgs) {
								var searchResults = _.map(orgs, function (orgSearchResult) {
									return {
										displayText: orgSearchResult.orgName,
										val: orgSearchResult,
										type: 'ORG'
									}
								});
								return searchResults;
							}

							function prepareGroupQueryResult(groups) {
								_.remove(groups, function (group) {
									var resultGroup = group;
									return (_.findIndex($scope.selectedGroups, function (advGroup) {
										return resultGroup.groupId == advGroup.groupId;
									}) != -1);
								});
								var searchResults = _.map(groups, function (group) {
									return {
										displayText: group.groupName,
										val: group,
										type: "GRP"
									};
								});
								return searchResults
							}
						}
				};

				function memberAddNewSearchResult(result) {
					switch (result.type) {
					case 'GRP':
						var group = result.val;
						memberInviteTemp.addGroup(group.groupId);
						memberInviteTemp.addSendToAllFlag(group.groupId);
						memberToggleAdvGroupMembersList(group.groupId);
						break;
					case 'ORG':
						var org = result.val;
						memberInviteTemp.addOrg(org.orgId);
						memberInviteTemp.setOrgSendToAll(org.orgId, true);
						memberToggleOrgMembersList(org.orgId);
						break;
					}
				}

				function memberRemoveOrg(orgId) {
					$scope.memberInvite.removeOrg(orgId);	
				}

				function memberToggleOrgMembersList(orgId) {
					var orgExtras = $scope.memberInvite.getOrgExtras(orgId) || {};

					$scope.memberInvite.setOrgExtras(orgId, {
						flag_expanded: !orgExtras.flag_expanded
					});
					_memberLoadOrgInvitees(orgId)
					.then(function (users) {
						$scope.memberInvite.setOrgExtras(orgId, {
							users: users
						});
					})

				}

				function _memberLoadOrgInvitees(orgId) {
					var deferred = $q.defer()
					, orgExtras = $scope.memberInvite.getOrgExtras(orgId);
					if (orgExtras.isLoaded) {
						deferred.resolve(orgExtras.users);
					}
					else {
						var options = {
								inviteType: "OWNER",
								orgId : orgId,
								userSessionId : Session.id
						};
						DataProvider.resource.JobTemplate.searchOrgMembers(options)
						.then(function (orgMembers) {
							DataProvider.resource.User.inject(orgMembers);
							orgExtras.users = DataProvider.resource.User.filter({
								where: {
									id: {
										in: _.pluck(orgMembers, "id")
									}
								}
							});
							orgExtras.isLoaded = true;
							/* Add all users to invitee list */
							_.each(orgMembers, function (user) {
								$scope.memberInvite.addOrgMember(orgId, user.id);
							});
							deferred.resolve(orgMembers);
						})
						.catch(function (err) {
							orgExtras.err = err;
						})
						.finally(function () {
							orgExtras.isLoading = false;
						})
					}
					return deferred.promise;
				}

				function _memberLoadGroupInvitees(groupId) {
					$scope.memberInvite.setGroupExtras(groupId, {});
					var deferred = $q.defer()
					, groupExtras = $scope.memberInvite.getGroupExtras(groupId);
					if (groupExtras.isLoaded) {
						deferred.resolve(groupExtras.users);
					}
					else {
						var options = {
								inviteType: "OWNER",
								groupId:groupId,
								userSessionId : Session.id
						};
						DataProvider.resource.JobTemplate.searchGroupMembers(options)
						.then(function (groupMembers) {
							DataProvider.resource.User.inject(groupMembers);
							groupExtras.users = DataProvider.resource.User.filter({
								where: {
									id: {
										in: _.pluck(groupMembers, "id")
									}
								}
							});
							groupExtras.isLoaded = true;
							_.each(groupMembers, function (user) {
								$scope.memberInvite.addGroupMember(groupId, user.id);
							});
							deferred.resolve(groupMembers);
						})
						.catch(function (err) {
							groupExtras.err = err;
						})
						.finally(function () {
							groupsMeta[groupId].isLoading = false;
						})
					}

					return deferred.promise;
				}

				function memberToggleSelectAllOrgMembers(orgId) {
					var advOrgMembers = $scope.memberInvite.getOrgExtras(orgId).users;
					if ($scope.memberInvite.getOrgSendToAll(orgId)) {
						$scope.memberInvite.setOrgSendToAll(orgId, false);
						$scope.memberInvite.removeAllOrgMembers(orgId);
					} else {
						$scope.memberInvite.setOrgSendToAll(orgId, true);
						$scope.memberInvite.addAllOrgMembers(orgId, _.pluck(advOrgMembers, 'id'));
					}
					
				}

				function memberToggleAdvOrgMember(orgId, userId) {
					if ($scope.memberInvite.getOrgMember(orgId, userId)) {
						$scope.memberInvite.removeOrgMember(orgId, userId);
					}
					else {
						$scope.memberInvite.addOrgMember(orgId, userId);
					}
					_memberUpdateOrgSendToAllFlag(orgId);
				}

				function _memberUpdateOrgSendToAllFlag(orgId) {
					try {
						var orgInvitees = $scope.memberInvite.getOrgExtras(orgId).users;
						var selectedOrgInvitees = $scope.memberInvite.getOrg(orgId).invitee;
						if (orgInvitees.length == selectedOrgInvitees.length) {
							$scope.memberInvite.setOrgSendToAll(orgId, true);
						} else {
							$scope.memberInvite.setOrgSendToAll(orgId, false);
						}
					} catch (e) {

					}
				}

				function memberToggleAdvGroupSelectAll(groupId) {
					var group = $scope.memberInvite.getGroupExtras(groupId);
					if (memberInviteTemp.getInvitationGroups()[groupId].sendToAll) {
						memberInviteTemp.removeSendToAllFlag(groupId);
						_.each(group.users, function (user) {
							memberInviteTemp.removeGroupMember(groupId, user.id);
						})
					} else {
						memberInviteTemp.addSendToAllFlag(groupId);
						_.each(group.users, function (user) {
							memberInviteTemp.addGroupMember(groupId, user.id);
						})
					}
				}

				function memberRemoveGroup(groupId) {
					if (!groupId) return;
					memberInviteTemp.removeGroup(groupId);
				}

				function memberToggleAdvGroupMembersList(groupId, isOpen) {

					var groupExtras = $scope.memberInvite.getGroupExtras(groupId) || {};
					$scope.memberInvite.setGroupExtras(groupId, {
						flag_expanded: !groupExtras.flag_expanded
					});

					var group = $scope.memberInvite.getGroupExtras(groupId);
					group._isMembersListExpanded = !group._isMembersListExpanded;
					
					if (group._isLoadingMembersList) return;
					group._isLoadingMembersList = true;
					group._isMemberListLoadError = false;
					return _memberLoadGroupInvitees(groupId)
					.then(function (users) {
						$scope.memberInvite.setGroupExtras(groupId, {
							users: users
						});
					})
					.catch(function () {
						group._isMemberListLoadError = true;
						group.users = [];
					})
					.finally(function () {
						group._isLoadingMembersList = false;
					});
				}

				function memberToggleAdvGroupMember(groupId, userId) {
					var advData = $scope.memberInvite.getSavedData();
					if (advData.groups[groupId].invitee.indexOf(userId) > -1) {
						memberInviteTemp.removeGroupMember(groupId, userId);
					}
					else {
						memberInviteTemp.addGroupMember(groupId, userId);
					}
					_memberUpdateGroupSendToAllFlag(groupId);
				}

				function _memberUpdateGroupSendToAllFlag(groupId) {
					try {
						var groupInvitees = $scope.memberInvite.getGroupExtras(groupId).users;
						var selectedGroupInvitees = $scope.memberInvite.getGroup(groupId).invitee;
						if (groupInvitees.length == selectedGroupInvitees.length) {
							$scope.memberInvite.setGroupSendToAll(groupId, true);
						} else {
							$scope.memberInvite.setGroupSendToAll(groupId, false);
						}
					} catch (e) {

					}
				}
				
				function updateMemAddNewSearchResult(result) {
					switch (result.type) {
					case 'GRP':
						var group = result;
						memberInviteTemp.addGroup(group.groupId);
						memberInviteTemp.addSendToAllFlag(group.groupId);
						break;
					case 'ORG':
						var org = result;
						memberInviteTemp.addOrg(org.orgId);
						memberInviteTemp.setOrgSendToAll(org.orgId, true);
						break;
					}
				}

				function updateOwnerAddNewSearchResult(result) {
					switch (result.type) {
					case 'GRP':
						var group = result;
						ownerInviteTemp.addGroup(group.groupId);
						ownerInviteTemp.addSendToAllFlag(group.groupId);
						break;
					case 'ORG':
						var org = result;
						ownerInviteTemp.addOrg(org.orgId);
						ownerInviteTemp.setOrgSendToAll(org.orgId, true);
						break;
					}
				}
				/* members search code ends here */

				
				/*
				 * Display job template preview
				 */
				function _showJobTemplatePreview(templateMod){
					$scope.isPreview = true;
					$scope.previewFinishDate = $scope.expectedFinishTime($scope.jobTemplateModel.endTimeType,$scope.jobTemplateModel.endTimeValue);
				}
				
				function _closeTemplatePreview(){
					$scope.isPreview = false;
				}
				
					initScope(template);
					$scope.formWizard();
			}
			
		}
		function ownedTemplatesList(params) {
			var deferred = $q.defer();
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			DataProvider.resource.JobTemplate.templateOwnedList({
				catId: params.catId,  
				catType: params.catType
			}, { bypassCache: true, autoClose: false }).then(function(result) {
				return deferred.resolve(result);
			}).catch(function() {
				deferred.reject();
			}).finally(function () {
				blockUI.stop();
			});
			
			return deferred.promise;
		}
		
		function deleteTemplateDialog(listObj, params) {
			
			var deferred = $q.defer();
			var options = options || {};

			var _deferred = $q.defer(), DeleteTemplateDialogOptions;

			DeleteTemplateDialogOptions = {
					controller: ['$scope', '$mdDialog',DeleteTemplateController],
					templateUrl: 'app/modules/jobtemplate/jobTemplateDelete.tpl.html',
					clickOutsideToClose:false,
					selectAllText: LANG.LABEL.SELECT_ALL,
					actionButtonText: "Delete",
					cancelButtonText: "Cancel" 
			};

			Dialog.show(DeleteTemplateDialogOptions)
			
			.then(function (res) {
				_deferred.resolve(res);
			})
			.catch(function (err) {
				_deferred.reject(err);
			})
			.finally(function () {
			});

			return _deferred.promise;

			function DeleteTemplateController($scope, $mdDialog) {
				var multiSelectList = AppCoreUtilityServices.multiSelectScopeControllerFactory(listObj);
				
				var isActionInProgress = false;
				angular.extend($scope, {
					listObj: listObj,
					config: DeleteTemplateDialogOptions,
					cancel: function () {
						$mdDialog.hide();
					},
					multiSelectList: multiSelectList,
					action: function () {
						
						if (isActionInProgress)
							return;
						
						if (multiSelectList.getItems(true).length == 0) {
							return;
						}
						
						isActionInProgress = true;
						
						blockUI.start("Deleting...");
						
						DataProvider.resource.JobTemplate.deleteTemplates(multiSelectList.getItems(true),params)
						.then(function (res) {
							$mdDialog.hide(res);
						})
						.catch(function (err) {
							$mdDialog.cancel(err)
						})
						.finally(function () {
							isActionInProgress = false;
							blockUI.stop();
						})
					}
				});

			}

		}
		
		function closedJobsListForOrg(orgId){
			var _deferred = $q.defer();
			
			blockUI.start("Loading...");
			
			var params = {
					userSessionId : Session.id,
					orgId : orgId
			}
			
			DataProvider.resource.JobTemplate.closedJobsListForOrg(params)
			.then(function (res) {
				_deferred.resolve(res);
			})
			.catch(function (err) {
				_deferred.reject(err);
			})
			.finally(function () {
				blockUI.stop();
			})
			return _deferred.promise;
		}
		
		return {
			createJobTemplateDialog: createJobTemplateDialog,
			ownedTemplatesList : ownedTemplatesList,
			deleteTemplateDialog : deleteTemplateDialog,
			closedJobsListForOrg : closedJobsListForOrg
		}

	}

})();