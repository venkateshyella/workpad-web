/**
 * Created by sandeep on 22/08/16.
 */
(function () {
	"use strict";

	angular.module('app.services')
	.service('EventService', [
	                          '$q', 'Connect',
	                          'mDialog', '$mdToast',
	                          'blockUI', 'Lang','DataProvider','URL',
	                          'AppCoreUtilityServices','Session','CATEGORY_TYPE','$filter',
	                          EventService
	                          ]);

	function EventService($q, Connect, Dialog, $mdToast, blockUI, Lang, 
			               DataProvider, URL, AppCoreUtilityServices, Session,CATEGORY_TYPE, $filter) {

		var LANG = Lang.en.data;

		function createEventDialog(bundle, options) { 
			
			var _deferred = $q.defer(), CreateEventDialogOptions;

			CreateEventDialogOptions = {
					controller: ['$scope', '$mdDialog', '$timeout','JobAdvertisementFactory','DataProvider',
					             CreateEventController],
					             templateUrl: 'app/modules/event/eventCreate.dialog.tpl.html',
					             clickOutsideToClose:false,
			};
			
			Dialog.show(CreateEventDialogOptions)
			.then(function (res) {
				_deferred.resolve(res)
			})
			.catch(function (err) {
				_deferred.reject(err);
			})
			.finally(function () {
			});
			
			function CreateEventController($scope, $mdDialog, $timeout, JobAdvertisementFactory, DataProvider) {
				
				var newJobAdv = new JobAdvertisementFactory.GroupAdvertisement()
				, groupsMeta = {}
				;
			self.searchMode = 'group';
				
			
			
				if (bundle.catType == CATEGORY_TYPE.ORG) {
					$scope.eventCatType = "Organization";
				} else {
					$scope.eventCatType = "Group";
				}
				
				$scope.jobTypes = [{
					label: "Ad Hoc",
					value: 1
				},
				{
					label: "Template",
					value: 2
				}];
				
				$scope.eventResponse = {};
				
				$scope.submit = function (event) {

					$scope.cancel();
				}
				$scope.form = {};
				$scope.form.createEvent = {};
				$scope.eventDateFormat = "dd-MM-yyyy";
				$scope.showJobFrom = false;
				$scope.toggleOwnerFlag = toggleOwnerFlag;
				
				$scope.changeEventType  = function(type) {
					$scope.eventModel = {};
					$scope.eventModel.eventType = type;
					$scope.catType = bundle.catType;
					$scope.eventModel.scheduledJob = {};
			      	$scope.eventModel.scheduledJob.endtimeType = "-523";
	            	$scope.eventModel.scheduledJob.endTimeValue = 24;
	            	$scope.eventModel.scheduledJob.owner = false;
				    $scope.repeatFreqTypeCodes = DataProvider.resource.Event.getRepeatFreqTypes();
				    var d = new Date();
				    d.setDate(d.getDate() - 1);
				    $scope.minDate = d.toString();
				    $scope.minEndDate = d.toString();
				    var date = new Date();
				    $scope.eventModel.startDate = $filter('date')(date, "dd-MM-yyyy");
				    
				    $scope.eventModel.fromTime = setdefaultTime();
				    $scope.eventModel.toTime = setdefaultTime(30);
				    $scope.eventModel.repeatType = -411; //Forever
	            	$scope.eventModel.repeatFreqType = -402; //daily
	            	$scope.eventModel.durationType = 1;
	            	$scope.eventModel.duration = 30;
	            	$scope.eventModel.frequency = 10;
	            	$scope.eventModel.repeatInterval = 1;
	            	$scope.eventModel.repeatCount = 5;
	            	$scope.eventModel.durationFreqTypeModel = AppCoreUtilityServices.getReminderFreqTypes($scope.eventModel.durationType);
					if (type && type.toString() == "-603") {
						$scope.showJobFrom = true;
						$scope.eventModel.jobType = 1;
						$scope.showTemplates = false;
					} else {
						$scope.showJobFrom = false;
					}
					
				}
				
                function toggleOwnerFlag() {
                	$scope.eventModel.scheduledJob.owner = !$scope.eventModel.scheduledJob.owner;
                	
                	if ($scope.showTemplates) {
                		
                		newJobAdv.reset();
                		if ($scope.eventModel.scheduledJob.owner) {
                			$scope.placeHolder = 'Search WorkSpace or Room to invite Contributors';
                			$scope.inviteType = "DELEGATOR";
                			if ($scope.templateObj.contributorInvitations && $scope.templateObj.contributorInvitations.length>0) {
               				 var count = $scope.templateObj.contributorInvitations.length-1;
       						 for ( var i = 0; i < $scope.templateObj.contributorInvitations.length; i++) {
       							 toFillInviteesResult($scope.templateObj.contributorInvitations[i]);
       								 if (count == i) {
       									 $scope.eventModel.scheduledJob.invitations = $scope.templateObj.contributorInvitations;
       									 toggleOpenOnEdit($scope.eventModel);
       									}
       						}
							}
   					}
   					 
                		if (!$scope.eventModel.scheduledJob.owner) {

                			$scope.placeHolder = 'Search WorkSpace or Room to invite Owners';
                			$scope.inviteType = "OWNER";
                			if ($scope.templateObj.ownerInvitations && $scope.templateObj.ownerInvitations.length>0) {
                				var count = $scope.templateObj.ownerInvitations.length-1;
                				for ( var i = 0; i < $scope.templateObj.ownerInvitations.length; i++) {
                					toFillInviteesResult($scope.templateObj.ownerInvitations[i]);
                					if (count == i) {
                						$scope.eventModel.scheduledJob.invitations = $scope.templateObj.ownerInvitations;
                						toggleOpenOnEdit($scope.eventModel);
                					}
                				} 
                			}

                		}
					}
                	
                }
                
                
				function setdefaultTime(minutes) {
					var date = new Date();
					if (minutes) {
						date.setMinutes(date.getMinutes() + 30);
					}
					var hours = date.getHours();
					var minutes = date.getMinutes();
					if (minutes > 30) {
						return  hours+1;
					} else {
						return  hours+0.5;
					}
				}
				
				
				
				function initScope() {
					$scope.eventModel = {};
					$scope.orgInviteesSelected = [ ];
					$scope.orgTemplates = [];
					$scope.showTemplates = false;
					$scope.fromTimeList = AppCoreUtilityServices.timePickerService().getTimePickerList();
					$scope.toTimeList = AppCoreUtilityServices.timePickerService().getTimePickerList();
					$scope.repeatTypes = DataProvider.resource.Event.methods.getMeta().REPEAT_TYPES_LABEL_MAP;
					$scope.repeatFreqTypes = DataProvider.resource.Event.methods.getMeta().REPEAT_FREQ_TYPES_LABEL_MODEL_MAP;
					$scope.reminderDurationTypes = [ {label : "Minutes", value : 1},
					                                 {label : "Hours", value : 2},
					                                 {label : "Days", value : 3},
					                                 {label : "Weeks", value : 4}
					                                 ];
					$scope.jobendTimeValueTypes = [ {label :"Hours", value : "-523"},
					                                 {label : "Days", value : "-524"},
					                                 {label : "Weeks", value : "-525"},
					                                 {label : "Months", value : "-526"},
					                                 {label : "Select date", value : "-520"},
					                                 ];
					$scope.templateObj = {};
					$scope.repeatTypeCodes = DataProvider.resource.Event.getRepeatTypes();
					$scope.repeatFreqTypeCodes = DataProvider.resource.Event.getRepeatFreqTypes();
					$scope.minDate = new Date().toString();
					$scope.jobAdv = newJobAdv;
					
					$scope.freqRepeatLabels = { "-402" : "days", 
							  "-403" : "weeks",
							  "-404" : "months", 
							  "-405" : "years" 	  
							};
					
					$scope.endtimeTypeLabels = {
							"-523" : "Hours", 
							"-524" : "Days",
							"-525" : "Weeks", 
							"-526" : "Months",
							"-520" : "Date"
					};
					
					$scope.selectTemplate  = selectTemplate;
					$scope.catType = bundle.catType;
					$scope.eventModel.scheduledJob = {};
			      	$scope.eventModel.scheduledJob.endtimeType = "-523";
	            	$scope.eventModel.scheduledJob.endTimeValue = 24;
	            	$scope.eventModel.scheduledJob.owner = false;
				    $scope.repeatFreqTypeCodes = DataProvider.resource.Event.getRepeatFreqTypes();
				    var d = new Date();
				    d.setDate(d.getDate() - 1);
				    $scope.minDate = d.toString();
				    $scope.minEndDate = d.toString();
				    var date = new Date();
				    $scope.eventModel.startDate = $filter('date')(date, "dd-MM-yyyy");
				    
				    $scope.eventModel.fromTime = setdefaultTime();
				    $scope.eventModel.toTime = setdefaultTime(30);
				    $scope.eventModel.repeatType = -411; //Forever
	            	$scope.eventModel.repeatFreqType = -402; //daily
	            	$scope.eventModel.durationType = 1;
	            	$scope.eventModel.duration = 30;
	            	$scope.eventModel.frequency = 10;
	            	$scope.eventModel.repeatInterval = 1;
	            	$scope.eventModel.repeatCount = 5;
	            	$scope.eventModel.durationFreqTypeModel = AppCoreUtilityServices.getReminderFreqTypes($scope.eventModel.durationType);
	            	$scope.userID = Session.userId;
	            	$scope.viewTasks = viewTasks;
	            	$scope.taskSubmit = taskSubmit;
	            	$scope.removeTask = removeTask;
	            	$scope.eventTaskModel = {};
				   $scope.eventTypes = [];
				   DataProvider.resource.Event.getEventTypes().then(function(res){
					   $scope.eventTypes = res;
					   if(!bundle.isEdit){
						   $scope.eventModel.eventType = $scope.eventTypes[0].code;   
					   }
				   });
				   
				   if(bundle.isEdit){
					   $scope.isEventEdit = bundle.isEdit;
					   
					   if (bundle.eventEntity.eventType.code == -603) {
						   $scope.showJobFrom = true;
						   
						   if (bundle.eventEntity.scheduledJob.invitations && !bundle.eventEntity.scheduledJob.templateId) {
							   var promises = [];
								  angular.forEach(bundle.eventEntity.scheduledJob.invitations, function (invitee) {
									   var promise = toFillInviteesResult(invitee);
									   promises.push(promise);
								   });
								
								  $q.all(promises).then(function() {
									  initScopeEventModel(bundle.eventEntity);
								  });
						} else {
							$scope.showTemplates = true;
							$scope.eventModel.jobType = 2;
							 
							angular.forEach(bundle.eventEntity.scheduledJob.invitations, function (invitee) {
								   toFillInviteesResult(invitee);
							   });
							 
							getTemplateBYId({id:bundle.eventEntity.scheduledJob.templateId}).then(function(response){
								$scope.orgTemplates[0]=response.resp;
								$scope.templateObj = response.resp;
//								selectTemplate(response.resp);
								initScopeEventModel(bundle.eventEntity);
							});
						}
				
					   } else {
						   initScopeEventModel(bundle.eventEntity);
					   }
					
				   } else{
//						 $scope.eventModel.eventType = $scope.eventTypes[0].code;
					} 
				   
				   	$scope.taskForm = {};
				   	$scope.removeGroup = removeAdvGroup;
					$scope.removeOrg = removeOrg;
					$scope.toggleSelectAllOrgMembers = toggleSelectAllOrgMembers;
					$scope.toggleOrgMembersList = toggleOrgMembersList;
					$scope.toggleGroupMembersList = toggleGroupMembersList;
					$scope.toggleAdvOrgMember = toggleAdvOrgMember;
					$scope.removeMemberFromAdvertisement = removeMemberFromAdvertisement;
					$scope.toggleAdvGroupMembersList = toggleAdvGroupMembersList;
					$scope.toggleAdvGroupSelectAll = toggleAdvGroupSelectAll;
					$scope.toggleAdvGroupMember = toggleAdvGroupMember;
					$scope.placeHolder = 'Search WorkSpace or Room to invite Owners';
					$scope.inviteType = "OWNER";
					$scope.isTemplateView = false;
				}

				function taskSubmit(task,form) {
					$scope.eventModel.scheduledJob.tasks.push(task);
					$scope.eventTaskModel = {};
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
					$scope.eventModel.scheduledJob.tasks.splice(index, 1);

				}
				
				$scope.changeJobType  = function(type,form) {
					$scope.eventModel.scheduledJob = {};
					$scope.eventModel.name = '';
					$scope.eventModel.desc = '';
					$scope.eventModel.jobType = type;
					$scope.eventModel.scheduledJob.endtimeType = "-523";
	            	$scope.eventModel.scheduledJob.endTimeValue = 24;
					if (type == 1) {
						$scope.showTemplates = false;
					} else {
						getALlTemplates();
						$scope.showTemplates = true;
					}
				}
				
				function viewTasks(){
					$scope.isTemplateView = !$scope.isTemplateView;
				}
				
				function selectTemplate(template) {
					newJobAdv.reset();
					$scope.templateObj =  template;
					$scope.inviteType = "OWNER";
					$scope.eventModel.scheduledJob = {};
					$scope.eventModel.name = '';
					$scope.eventModel.desc = '';
					$scope.eventModel.scheduledJob.owner = false;
					$scope.eventModel.scheduledJob.templateId = template.id;
					$scope.isTemplateView = false;
					$scope.eventModel.scheduledJob.templateId=template.id;
					$scope.eventModel.name = template.templateName;
					$scope.eventModel.desc = template.desc;
					$scope.eventModel.scheduledJob.endtimeType = template.endTimeType.toString();
					$scope.eventTaskModel = {};
					
					if (template.expectedFinishDate)
						$scope.eventModel.scheduledJob.expectedFinishDate = template.expectedFinishDate;
					if (template.endTimeValue)
						$scope.eventModel.scheduledJob.endTimeValue = template.endTimeValue;
					
					if (template.jobOwner) {
						$scope.eventModel.scheduledJob.owner = template.jobOwner;
						$scope.eventModel.scheduledJob.tasks = template.tasks;
						$scope.placeHolder = 'Search WorkSpace or Room to invite Contributors';
						$scope.inviteType = "DELEGATOR";
					} else {
						$scope.eventModel.scheduledJob.owner = false;
					}
					
					 if (template.jobOwner && template.contributorInvitations.length>0) {
						 var count = template.contributorInvitations.length-1;
						 for ( var i = 0; i < template.contributorInvitations.length; i++) {
							 toFillInviteesResult(template.contributorInvitations[i]);
								 if (count == i) {
									 $scope.eventModel.scheduledJob.invitations = template.contributorInvitations;
									 toggleOpenOnEdit($scope.eventModel);
									}
						}
					}
					 
					 if (!template.jobOwner && template.ownerInvitations.length>0) {
						 var count = template.ownerInvitations.length-1;
							 for ( var i = 0; i < template.ownerInvitations.length; i++) {
								 toFillInviteesResult(template.ownerInvitations[i]);
								 if (count == i) {
									 $scope.eventModel.scheduledJob.invitations = template.ownerInvitations;
									 toggleOpenOnEdit($scope.eventModel);
									}
							} 
						 
					}
					 
					 if (template.tasks && template.tasks && template.tasks.length>0) {
						 $scope.eventModel.scheduledJob.tasks = template.tasks; 
					}
					 
				}
				
				function getALlTemplates(){
        			var deferred = $q.defer();
        			blockUI.start("Loading...", {
						status: 'isLoading'
					});
        			var params = {
        					orgId:parseInt(bundle.orgId),
        					pageNumber : 0
        			}
        			DataProvider.resource.Event.getAllTemplates(params)
        				.then(function (res) {
        					$scope.orgTemplates = res.resp.results;
        					deferred.resolve(res);
        				}).catch(function() {
							deferred.reject();
						}).finally(function () {
							blockUI.stop();
						});;
        			return deferred.promise;
				} 
				
				function getTemplateBYId(params){
        			var deferred = $q.defer();
        			blockUI.start("Loading...", {
						status: 'isLoading'
					});
        			DataProvider.resource.Event.getTemplateById(params)
        				.then(function (res) {
//        					$scope.orgTemplates = res.resp.results;
        					deferred.resolve(res);
        				}).catch(function() {
							deferred.reject();
						}).finally(function () {
							blockUI.stop();
						});;
        			return deferred.promise;
				} 
				
				/**
				 * members search code
				 */

				$scope.obj = bundle.obj;
				
				$scope.orgInviteesSelected = [];

				$scope.removeSelectedMember = removeSelectedMember;

				function removeSelectedMember(user) {
					_.remove($scope.orgInviteesSelected, {
						id: user.id
					});
					$scope.eventModel.sendToAll = false;
				}

				$scope.memberSearchCtrl = {
						selection: null,
						searchText: "",
						selectedItemChange: function(user) {
							if (user) {
								delete user.$$hashKey;
								var index = _.findIndex($scope.orgInviteesSelected, user);
								if (index == -1) {
									$scope.orgInviteesSelected.push(user);
								}
							}
							$timeout(function() {
								$scope.memberSearchCtrl.searchText = "";
							}, 200)
						},
						querySearch: function(queryStr) {
							if (queryStr && queryStr.length > 0) {

								var deferred = $q.defer();
								DataProvider.resource.Event.searchMembers({
									searchByName: queryStr,
									catId: bundle.catId,  
									catType: bundle.catType

								}, { bypassCache: true, autoClose: false }).then(function(result) {
									return deferred.resolve(result);
								}).catch(function() {
									deferred.reject();
								});
								return deferred.promise;

							} else {
								return [];
							}
						},

						getAllMemebers: function() {
							var deferred = $q.defer();
							blockUI.start("Loading...", {
								status: 'isLoading'
							});
							DataProvider.resource.Event.searchMembers({
								catId: bundle.catId,  
								catType: bundle.catType
							}, { bypassCache: true, autoClose: false }).then(function(result) {
								return deferred.resolve(result);
							}).catch(function() {
								deferred.reject();
							}).finally(function () {
								blockUI.stop();
							});
							return deferred.promise;

						}
				};

				/** members search code ends **/
                
                
                $scope.toggleSelectionAll = function (isAllSelected){
                	$scope.orgInviteesSelected =[];
                	if (!isAllSelected) {
                		$scope.allOrgMembers.isAllSelected = !isAllSelected;
                		angular.forEach($scope.allOrgMembers.members, function(value, key){
                			value.isSelected = true;
                			$scope.orgInviteesSelected.push(value);
                		});
                	} else{
                		$scope.allOrgMembers.isAllSelected = !isAllSelected;
                		_.each($scope.allOrgMembers.members, function (member) {
                			member.isSelected = false;
                		});
                	}
                }
                
                $scope.addInviteeToEvent = function(member) {
                	if (!member.isSelected) {
                		member.isSelected = !member.isSelected;
                		$scope.orgInviteesSelected.push(member);
					} else {
						member.isSelected = !member.isSelected;
						$scope.allOrgMembers.isAllSelected = false;
						_.remove($scope.orgInviteesSelected, {
							id: member.id
						});
					}
                }
                
                
                $scope.onRemDurationTypeChange = function(durationType){
                	$scope.eventModel.durationFreqTypeModel = AppCoreUtilityServices.getReminderFreqTypes(durationType);
                };
                
                $scope.submitCreateEvent = function(eventModel){

                	eventModel.catId = bundle.catId;
                	eventModel.catType = bundle.catType;
                	eventModel.attendees = [];
                	
                	if(eventModel.eventType == -603){
                		eventModel.toTime = eventModel.fromTime + 0.5;	
                	}
                	
                	if ($scope.orgInviteesSelected.length > 0) {
                		for(var i = 0; i < $scope.orgInviteesSelected.length; i++) {
                    		eventModel.attendees.push($scope.orgInviteesSelected[i].id);
                    	}
					}
                	
                	if (!eventModel.scheduledJob.templateId && !eventModel.scheduledJob.owner) {
                		eventModel.scheduledJob.invitations = prepareOwnerInvitations();
					} 
                	
                	if (eventModel.scheduledJob.templateId) {
                		eventModel.scheduledJob.invitations = prepareOwnerInvitations();
					}
                	
                	
                	var eventEntity = parseToEventEntity(eventModel);

                	blockUI.start("Creating event...");

                	if (eventEntity.message == null) {
                		delete eventEntity.message;
                		
                		createEvent(eventEntity).then(function(res) {
                			blockUI.stop("Event "+res.eventName+" created successfully.");
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
                		
                	} else {
                		blockUI.stop(eventEntity.message, {
                			status: 'isError',
                			action: 'Ok'
                		});
                	}
                };
                
                
        		$scope.submitUpdateEvent = function(eventModel){

        			var deferred = $q.defer();
        			eventModel.catId = bundle.catId;
        			eventModel.catType = bundle.catType;
        			
        			if(eventModel.eventType == -603){
                		eventModel.toTime = eventModel.fromTime + 0.5;	
                	}
        			
        			if ( bundle.eventEntity.reminders.length > 0) {
        				eventModel.reminderId = bundle.eventEntity.reminders[0].id;
					}
        			
                	if (!eventModel.scheduledJob.templateId && !eventModel.scheduledJob.owner) {
                		eventModel.scheduledJob.invitations = prepareOwnerInvitations();
					} 
                	
                	if (eventModel.scheduledJob.templateId) {
                		eventModel.scheduledJob.invitations = prepareOwnerInvitations();
					}
        			
        			eventModel.attendees = [];

        			for(var i = 0; i < $scope.orgInviteesSelected.length; i++) {
        				eventModel.attendees.push($scope.orgInviteesSelected[i].id);
        			}

        			var eventEntity = parseToEventEntity(eventModel);
        			
        			blockUI.start("Updating event...");
        			
        			if (eventEntity.message == null) {
        				delete eventEntity.message;
//        				eventEntity.id = bundle.eventEntity.id;

        				editEvent(eventEntity).then(function(res) {
        					blockUI.stop("Event "+res.resp.eventName+" updated successfully.");
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
					} else {
						blockUI.stop(eventEntity.message, {
    						status: 'isError',
    						action: 'Ok'
    					});
					}
        		};
				
				function editEvent(eventEntity) {

					var deferred = $q.defer();
					DataProvider.resource.Event.updateEvent(eventEntity)
						.then(function (res) {
							deferred.resolve(res);
						}, function (error) {
							deferred.reject(error);
						});
					return deferred.promise;
				}
        		function createEvent(eventEntity) {
        			var deferred = $q.defer();
        			DataProvider.resource.Event.create(eventEntity)
        				.then(function (res) {
        					deferred.resolve(res);
        				}, function (error) {
        					deferred.reject(error)
        				});
        			return deferred.promise;
        		};
                
				$scope.cancel = function(ev) {
					"use strict";
					initScope();
					Dialog.hide();
				};

				
				$scope.setMinEndDate = function(repeatType,startDate){
					if (repeatType == -412) {
					    var d = AppCoreUtilityServices.convertStringToDate(startDate,'dd-mm-yyyy','-'); 
					    d.setDate(d.getDate());
						$scope.minEndDate = d.toString();
					}
				}
				
				$scope.toResetRepeat = function() {
					$scope.eventModel.repeatFreqType = -402;
					$scope.eventModel.repeatInterval = 1;
					$scope.eventModel.repeatType = -411;
					$scope.eventModel.repeatCount = 5
					$scope.eventModel.endDate = '';
				};
				
				function initScopeEventModel(eventEntity){
					
				    var repeatTypes = DataProvider.resource.Event.getRepeatTypes();
					
				    $scope.eventModel.id = eventEntity.eventId;
					$scope.eventModel.catId = eventEntity.catId;
					$scope.eventModel.catType = eventEntity.catType;
					$scope.eventModel.name = eventEntity.eventName;
					$scope.eventModel.desc = eventEntity.desc;
					$scope.eventModel.eventType = eventEntity.eventType.code;
					
					$scope.eventModel.actualStartTime = eventEntity.startTime;
					$scope.eventModel.actualEndTime =  eventEntity.endTime;
					
					var d = new Date($scope.eventModel.startDate);
					 d.setDate(d.getDate());
					 $scope.minEndDate = d.toString();
					
					$scope.eventModel.isRepeat = (eventEntity.schedule.repeatFrequencyType  == DataProvider.resource.Event.getEventNoRepeatCode())
													? false : true;
					    
					    var startdate = new Date(eventEntity.startTime);
					    //$scope.eventModel.startDate = startdate.toString();
					    //$scope.eventModel.defaultStartDate = startdate.toString();
					    var formattedDateStr = startdate.getDate()+"-"+(startdate.getMonth()+1)+"-"+startdate.getFullYear();
					    $scope.eventModel.startDate = formattedDateStr;
					    startdate = AppCoreUtilityServices.convertStringToDate(formattedDateStr,'dd-mm-yyyy','-'); 
					    $scope.eventModel.fromTime = (eventEntity.startTime - startdate.getTime())/(3600*1000);
					    $scope.eventModel.toTime = (eventEntity.endTime - startdate.getTime())/(3600*1000);
					    
					    if($scope.eventModel.isRepeat){
					    	
					    	$scope.eventModel.repeatType = eventEntity.schedule.repeatType;
			            	$scope.eventModel.repeatFreqType = eventEntity.schedule.repeatFrequencyType;
			            	$scope.eventModel.repeatInterval = eventEntity.schedule.repeatInterval;
					    	
					    	switch ($scope.eventModel.repeatType) {
				            case repeatTypes.FOREVER:
				            	
				              break;
				            case repeatTypes.UNTIL_DATE:
				            		var enddate = new Date(eventEntity.schedule.repeatEndDate);
				            	    var formattedEndDateStr = enddate.getDate()+"-"+(enddate.getMonth()+1)+"-"+enddate.getFullYear();
				            	    $scope.eventModel.endDate = formattedEndDateStr;
				            	//var endDate = AppCoreUtilityServices.convertStringToDate(eventModel.endDate,'dd-mm-yyyy','-');
					            //var endDateSec = AppCoreUtilityServices.convertDateToTimeStamp(endDate);
				            	//eventEntity.schedule.repeatEndDate = endDateSec + endTimeSec;//1477202400000;
					              break;
				            case repeatTypes.COUNT:
				            	     $scope.eventModel.repeatCount = eventEntity.schedule.repeatCount;
					              break;
				            default:
				            	break;
				          }
					    }
					    
					    if (eventEntity.attendees) {
					    	$scope.eventModel.attendees = [];
						    
						    // Adding 1 to include owner count 
						    
						    if (eventEntity.attendees.length == ($scope.allOrgMembers.members.length+1)) {
						    	$scope.allOrgMembers.isAllSelected = true;
							}
						    
						    for(var i = 0; i < eventEntity.attendees.length; i++){
						    	delete eventEntity.attendees[i].$$hashKey;
						    	var index = _.findIndex($scope.allOrgMembers.members, {id: eventEntity.attendees[i].id});
						    	
						    	if(index > -1)
						    	$scope.allOrgMembers.members[index].isSelected = true;
						    	
						    	$scope.orgInviteesSelected.push(eventEntity.attendees[i]);
						    }
						}
					    
					    
					if (eventEntity.eventType.code != -603 && eventEntity.reminders.length > 0) {
						
						   var computedReminderDur =  AppCoreUtilityServices.computeReminderDurationType(eventEntity.reminders[0].duration);
						    var computedReminderFreq =  AppCoreUtilityServices.computeReminderDurationType(eventEntity.reminders[0].frequency);
						    
						    $scope.eventModel.duration = computedReminderDur.value;
						    $scope.eventModel.frequency = computedReminderFreq.value;
						    
						    $scope.eventModel.durationType = computedReminderDur.type;
			            	$scope.eventModel.durationFreqTypeModel = AppCoreUtilityServices.getReminderFreqTypes($scope.eventModel.durationType);
						    //eventEntity.reminders.push({ duration: $scope.eventModel.duration, frequency: $scope.eventModel.frequency });
			            	
					}

					if (eventEntity.scheduledJob) {
		            		$scope.eventModel.scheduledJob = {};
		            		$scope.eventModel.scheduledJob.endTimeValue = eventEntity.scheduledJob.endTimeValue;
		            		$scope.eventModel.scheduledJob.endtimeType = parseInt(eventEntity.scheduledJob.endtimeType).toString();

		            		if (eventEntity.scheduledJob.expectedFinishDate) {
		            			
		            			 var expectedFinishDate = new Date(eventEntity.scheduledJob.expectedFinishDate);
		            			 $scope.eventModel.scheduledJob.expectedFinishDate = expectedFinishDate.getDate()+"-"+(expectedFinishDate.getMonth()+1)+"-"+expectedFinishDate.getFullYear();
		            			
		            		}
		            		
		            		if (!eventEntity.scheduledJob.templateId) {
		            			if (!eventEntity.scheduledJob.owner) {
			            			toggleOpenOnEdit(eventEntity);
								} else {
									$scope.eventModel.scheduledJob.owner = true;
								}
							} else {
								$scope.eventModel.scheduledJob.templateId = eventEntity.scheduledJob.templateId; 
								$scope.eventModel.scheduledJob.owner = eventEntity.scheduledJob.owner;
								
								if ($scope.eventModel.scheduledJob.owner) {
									$scope.placeHolder = 'Search WorkSpace or Room to invite Contributors';
									$scope.inviteType = "DELEGATOR";
								} else {
									$scope.placeHolder = 'Search WorkSpace or Room to invite Owner';
		                			$scope.inviteType = "OWNER";
								}
								
								if (eventEntity.scheduledJob.tasks && eventEntity.scheduledJob.tasks.length > 0) {
									$scope.eventModel.scheduledJob.tasks = eventEntity.scheduledJob.tasks;
								}
								
								toggleOpenOnEdit(eventEntity);
							}
		            	}
				}
				
				function toggleOpenOnEdit(eventEntity) {
					var i = 0;
					angular.forEach(eventEntity.scheduledJob.invitations, function (invitee) {
						if (invitee.type=="GROUP") {
							toggleGroupMembersList(invitee.id).then(function(res){
								i++;
								if (eventEntity.scheduledJob.invitations.length == i) {
									removeAllMem(eventEntity);		
								}
							});
						} else {
							toggleOrgMembersList(invitee.id).then(function(res){
								i++;
								if (eventEntity.scheduledJob.invitations.length == i) {
									removeAllMem(eventEntity);
								}
							});
						}
					});
				} 
				
				function removeAllMem(eventEntity) {
					var i = 0;
					angular.forEach(eventEntity.scheduledJob.invitations, function (invitee) {
						i++;
						if (invitee.type=="GROUP" && !invitee.sendToAll) {
							toggleAdvGroupSelectAll(invitee.id);
							if (eventEntity.scheduledJob.invitations.length == i) {
								addInvitees(eventEntity);
							}
						} else {
							if (!invitee.sendToAll) {
								toggleSelectAllOrgMembers(invitee.id);	
							}
							if (eventEntity.scheduledJob.invitations.length == i) {
								addInvitees(eventEntity);
							}
						}
					});
				}
				
				function addInvitees(eventEntity) {
					angular.forEach(eventEntity.scheduledJob.invitations, function (invitee) {
						if (!invitee.sendToAll) {
							if (invitee.type=="GROUP") {
								for ( var i = 0; i < invitee.invitees.length; i++) {
									toggleAdvGroupMember(invitee.id,invitee.invitees[i].id);
								}
							} else {
								for ( var i = 0; i < invitee.invitees.length; i++) {
									toggleAdvOrgMember(invitee.id,invitee.invitees[i].id);
								}
							}
						}
					});
				}
				
		        $scope.addAllMembersToEvent = function(){
                	$scope.allOrgMembers = {
	            			isAllSelected:false,
	            			members:[]
	            		};

					var deferred = $q.defer();
					blockUI.start("Loading...", {
						status: 'isLoading'
					});
					DataProvider.resource.Event.searchMembers({
						catId: bundle.catId,  
						catType: bundle.catType
					}, { bypassCache: true, autoClose: false }).then(function(res) {
						 for(var i = 0; i < res.length; i++){
                			 delete res[i].$$hashKey;
                			 res[i].isSelected=false;
                			 $scope.allOrgMembers.members.push(res[i]);
         				}
						return deferred.resolve(res);
					}).catch(function() {
						deferred.reject();
					}).finally(function () {
						blockUI.stop();
					});
					return deferred.promise;
                };
				
                $scope.addAllMembersToEvent().then( function(res) {
                	initScope();
                });
                

				$scope.getModel = {
					User: DataProvider.resource.User.get,
					Group: DataProvider.resource.Group.get,	
					Org: DataProvider.resource.Organisation.get
				};

				function removeMemberFromAdvertisement(userId) {
					newJobAdv.removeMember(userId);
					console.log(newJobAdv.getSavedData());
				}

				$scope.groupSearchCtrl = {
					selection: null,
					searchText: "",
					selectedItemChange: function (item) {
						if (item) {
							addNewSearchResult(item);
						}
						$timeout(function () {
							$scope.groupSearchCtrl.searchText = "";
						}, 200)
					},
					querySearch: function (queryStr) {
						if (queryStr && queryStr.length > 0) {
							var params =  {
									searchByName: queryStr,
									inviteType: $scope.inviteType,
									orgId : bundle.orgId,
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

				function toFillInviteesResult(result) {
					switch (result.type) {
						case 'GROUP':
							newJobAdv.addGroup(result.id);
							newJobAdv.addSendToAllFlag(result.id);
							break;
						case 'ORG':
							newJobAdv.addOrg(result.id);
							newJobAdv.setOrgSendToAll(result.id, true);
							break;
					}
				
				}
				
				function addNewSearchResult(result) {
					switch (result.type) {
						case 'GRP':
							var group = result.val;
							newJobAdv.addGroup(group.groupId);
							newJobAdv.addSendToAllFlag(group.groupId);
							break;
						case 'ORG':
							var org = result.val;
							newJobAdv.addOrg(org.orgId);
							newJobAdv.setOrgSendToAll(org.orgId, true);
							break;
					}
				}

				function removeOrg(orgId) {
					$scope.jobAdv.removeOrg(orgId);
				}

				function toggleSelectAllOrgMembers(orgId) {
					var advOrgMembers = $scope.jobAdv.getOrgExtras(orgId);
					if ($scope.jobAdv.getOrgSendToAll(orgId)) {
						$scope.jobAdv.setOrgSendToAll(orgId, false);
						$scope.jobAdv.removeAllOrgMembers(orgId);
					} else {
						$scope.jobAdv.setOrgSendToAll(orgId, true);
						$scope.jobAdv.addAllOrgMembers(orgId, _.pluck(advOrgMembers.users, 'id'));
					}
				}

				function toggleOrgMembersList(orgId) {
					var _deferred = $q.defer();
					var orgExtras = $scope.jobAdv.getOrgExtras(orgId) || {};
					$scope.jobAdv.setOrgExtras(orgId, {
						flag_expanded: !orgExtras.flag_expanded
					});
					_loadOrgInvitees(orgId)
						.then(function (users) {
							$scope.jobAdv.setOrgExtras(orgId, {
								users: users
							});
							_deferred.resolve(users);
						});
						
						return _deferred.promise;
				}
				function toggleGroupMembersList(groupId) {
					var _deferred = $q.defer();
					var groupExtras = $scope.jobAdv.getGroupExtras(groupId) || {};
					$scope.jobAdv.setGroupExtras(groupId, {
						flag_expanded: !groupExtras.flag_expanded
					});
					_loadGroupInvitees(groupId)
						.then(function (users) {
							$scope.jobAdv.setGroupExtras(groupId, {
								users: users
							});
							_deferred.resolve(users);
						})
						return _deferred.promise;
				}

				function toggleAdvOrgMember(orgId, userId) {
					if ($scope.jobAdv.getOrgMember(orgId, userId)) {
						$scope.jobAdv.removeOrgMember(orgId, userId);
					}
					else {
						$scope.jobAdv.addOrgMember(orgId, userId);
					}
					_updateOrgSendToAllFlag(orgId);
				}

				function _updateOrgSendToAllFlag(orgId) {
					try {
						var orgInvitees = $scope.jobAdv.getOrgExtras(orgId).users;
						var selectedOrgInvitees = $scope.jobAdv.getOrg(orgId).invitee;
						if (orgInvitees.length == selectedOrgInvitees.length) {
							$scope.jobAdv.setOrgSendToAll(orgId, true);
						} else {
							$scope.jobAdv.setOrgSendToAll(orgId, false);
						}
					} catch (e) {

					}
				}

				function removeAdvGroup(groupId) {
					if (!groupId) return;
					newJobAdv.removeGroup(groupId);
				}

				function toggleAdvGroupMember(groupId, userId) {

					var advData = $scope.jobAdv.getSavedData();
					if (advData.groups[groupId].invitee.indexOf(userId) > -1) {
						newJobAdv.removeGroupMember(groupId, userId);
					}
					else {
						newJobAdv.addGroupMember(groupId, userId);
					}
					_updateGroupSendToAllFlag(groupId);
				}
				
				function _updateGroupSendToAllFlag(groupId) {
					try {
						var groupInvitees = $scope.jobAdv.getGroupExtras(groupId).users;
						var selectedGroupInvitees = $scope.jobAdv.getGroup(groupId).invitee;
						if (groupInvitees.length == selectedGroupInvitees.length) {
							$scope.jobAdv.setGroupSendToAll(groupId, true);
						} else {
							$scope.jobAdv.setGroupSendToAll(groupId, false);
						}
					} catch (e) {

					}
				}

				function toggleAdvGroupMembersList(groupId, isOpen) {

					var groupExtras = $scope.jobAdv.getGroupExtras(groupId) || {};
					$scope.jobAdv.setGroupExtras(groupId, {
						flag_expanded: !groupExtras.flag_expanded
					});

					var group = $scope.jobAdv.getGroupExtras(groupId);
					group._isMembersListExpanded = !group._isMembersListExpanded;
					if (group._isLoadingMembersList) return;
					group._isLoadingMembersList = true;
					group._isMemberListLoadError = false;
					return _loadGroupInvitees(groupId)
						.then(function (groupMembers) {
							for (var i = 0; i < group.users.length; i++) {
								group.users[i].isInvited = false;
								newJobAdv.addGroupMember(groupId, group.users[i].id);
							}
						})
						.catch(function () {
							group._isMemberListLoadError = true;
							group.users = [];
						})
						.finally(function () {
							group._isLoadingMembersList = false;
						})
						;
				}

				function toggleAdvGroupSelectAll(groupId) {
					var group = $scope.jobAdv.getGroupExtras(groupId);
					if (newJobAdv.getInvitationGroups()[groupId].sendToAll) {
						newJobAdv.removeSendToAllFlag(groupId);

						_.each(group.users, function (user) {
							newJobAdv.removeGroupMember(groupId, user.id);
						})
					} else {
						newJobAdv.addSendToAllFlag(groupId);
						_.each(group.users, function (user) {
							newJobAdv.addGroupMember(groupId, user.id);
						})
					}
				}

		
				function _loadOrgInvitees(orgId) {
					var deferred = $q.defer()
						, orgExtras = $scope.jobAdv.getOrgExtras(orgId);
					if (orgExtras.isLoaded) {
						deferred.resolve(orgExtras.users);
					}
					else {
						var options = {
								orgId:orgId,
								inviteType: $scope.inviteType,
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
								$scope.jobAdv.addOrgMember(orgId, user.id);
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

				function _loadGroupInvitees(groupId) {
//					$scope.jobAdv.setGroupExtras(groupId, {});
					var deferred = $q.defer()
						, groupExtras = $scope.jobAdv.getGroupExtras(groupId);
					if (groupExtras.isLoaded) {
						deferred.resolve(groupExtras.users);
					}
					else {
						var options = {
								orgId:bundle.orgId,
								inviteType: $scope.inviteType,
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
								$scope.jobAdv.addGroupMember(groupId, user.id);
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

				
				function prepareOwnerInvitations() {
					var ownerOrg = $scope.jobAdv.getInvitationOrgs();
					var ownerGroup = $scope.jobAdv.getInvitationGroups();
					$scope.templateModel = [];

					var ownerOrgKeys = Object.keys(ownerOrg);
					if (ownerOrgKeys.length > 0) {
						for (var i= 0; i < ownerOrgKeys.length; i++) {
							var user = {sendToAll : false,users:[]};
							if (ownerOrg[ownerOrgKeys[i]] != undefined && ownerOrg[ownerOrgKeys[i]].sendToAll) {
								user.sendToAll = true;

							} else if (ownerOrg[ownerOrgKeys[i]] != undefined && !ownerOrg[ownerOrgKeys[i]].sendToAll && ownerOrg[ownerOrgKeys[i]].invitee.length > 0) {
								angular.forEach(ownerOrg[ownerOrgKeys[i]].invitee, function (invitee) {
									user.users.push(invitee);
								});
							}
							$scope.templateModel.push(user);
						}
					}
					
					var ownerGroupKeys = Object.keys(ownerGroup);
					if (ownerGroupKeys.length > 0) {
						for (var i= 0; i < ownerGroupKeys.length; i++) {
							var user = {sendToAll : false,groupId : ownerGroupKeys[i],users:[]};	
							if (ownerGroup[ownerGroupKeys[i]] != undefined && ownerGroup[ownerGroupKeys[i]].sendToAll) {
								var user = {
										sendToAll : true,
										groupId : ownerGroupKeys[i]
								}
								
							} else if (ownerGroup[ownerGroupKeys[i]] != undefined && !ownerGroup[ownerGroupKeys[i]].sendToAll &&ownerGroup[ownerGroupKeys[i]].invitee.length > 0) {
								angular.forEach(ownerGroup[ownerGroupKeys[i]].invitee, function (invitee) {
									user.users.push(invitee);
								});
							}
							$scope.templateModel.push(user);
						}
						
					}
					
					console.log(angular.toJson($scope.templateModel));
					return $scope.templateModel;
				}
				
				$scope.isEmpty = function(obj) {
					var keys = Object.keys(obj);
					if (keys.length > 0) {
						var count = 1;
						for (var i= 0; i < keys.length; i++) {
							if ( obj[keys[i]] != undefined && (obj[keys[i]].sendToAll || (obj[keys[i]].invitee != undefined && obj[keys[i]].invitee.length > 0)) ) {
								return false;
							} else {
								if (keys.length == count) {
									return true;
								}
							}
							count++;
						}
					} else {
						return true;
					}
				}
				
			}
			
			return _deferred.promise;
		}

		
		function deleteEventDialog(listObj, params) {
			
			var deferred = $q.defer();
			var options = options || {};

			var _deferred = $q.defer(), DeleteEventDialogOptions;

			DeleteEventDialogOptions = {
					controller: ['$scope', '$mdDialog',DeleteEventController],
					templateUrl: 'app/modules/event/eventDelete.dialog.tpl.html',
					clickOutsideToClose:false,
					selectAllText: LANG.LABEL.SELECT_ALL,
					actionButtonText: "Delete",
					cancelButtonText: "Cancel" 
			};

			Dialog.show(DeleteEventDialogOptions)
			
			.then(function (res) {
				_deferred.resolve(res);
			})
			.catch(function (err) {
				_deferred.reject(err);
			})
			.finally(function () {
			});

			return _deferred.promise;

			function DeleteEventController($scope, $mdDialog) {
				var multiSelectList = AppCoreUtilityServices.multiSelectScopeControllerFactory(listObj);
				
				var isActionInProgress = false;
				angular.extend($scope, {
					listObj: listObj,
					config: DeleteEventDialogOptions,
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
						
						DataProvider.resource.Event.deleteEvents(multiSelectList.getItems(true),params)
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
		
		function ownedEventsList(params) {
			var deferred = $q.defer();
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			DataProvider.resource.Event.eventOwnedList({
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
		
		
		function editEventDialog() {

			var deferred = $q.defer(),EditEventDialogOptions;

			EditEventDialogOptions = {
					controller: ['$scope', '$mdDialog', '$timeout',
					             EditEventController],
					             templateUrl: 'app/modules/event/eventEdit.dialog.tpl.html',
					             clickOutsideToClose:false,
			};
			Dialog.show(EditEventDialogOptions)
			.then(function (res) {
				deferred.resolve(res)
			})
			.catch(function (err) {
				deferred.reject(err);
			})
			.finally(function () {
			})
			;
			return deferred.promise;

			function EditEventController($scope, $mdDialog, $timeout) {
				$scope.submit = function (event) {

					$scope.cancel();
				}

				function initScope() {
					$scope.form = {};	
				}

				$scope.cancel = function(ev) {
					"use strict";
					initScope();
					Dialog.hide();
				};

			}
		}
		
		function parseToEventEntity(eventModel){
			//console.log("EVENT MODEL:::"+ JSON.stringify(eventModel));	 
				var eventEntity = {}
				    , repeatTypes = DataProvider.resource.Event.getRepeatTypes()
				    , repeatFreqTypes = DataProvider.resource.Event.getRepeatFreqTypes()
				    ;
				
				eventEntity.message = null;
					
					if(eventModel.id){
						eventEntity.id = eventModel.id;
					}	
					
				    eventEntity.eventName = eventModel.name;
				    eventEntity.catId = eventModel.catId;
				    eventEntity.catType = eventModel.catType;
				    eventEntity.desc = eventModel.desc;
				    eventEntity.eventType = eventModel.eventType;
				    eventEntity.startTime = 1471930200000;//eventModel.fromTime;
				    eventEntity.endTime = 1471948200000; //eventModel.toTime;
				    
				    var startDate = AppCoreUtilityServices.convertStringToDate(eventModel.startDate,'dd-mm-yyyy','-');
	            	var startDateSec = AppCoreUtilityServices.convertDateToTimeStamp(startDate);
	            	var fromTimeSec = AppCoreUtilityServices.timePickerService().getTimeInMilliSeconds(eventModel.fromTime);
				    eventEntity.startTime = startDateSec + fromTimeSec;
				    
	            	var endTimeSec = AppCoreUtilityServices.timePickerService().getTimeInMilliSeconds(eventModel.toTime);
				    eventEntity.endTime = startDateSec + endTimeSec;

				    var currentTime =  new Date().getTime();
				    if(eventModel.durationType == 1 && eventModel.duration < eventModel.frequency){
				    	eventEntity.message = "Invalid reminder frequency";
				    	return eventEntity;
				    }
				    if(eventModel.id == null){
				    	if ( currentTime > eventEntity.startTime || currentTime > eventEntity.endTime ) {
				    		eventEntity.message = "Event start time or end time must be greater than current time";
				    		return eventEntity;
				    	}
				    } else {
				    	if ( currentTime > eventEntity.actualStartTime  && currentTime < eventEntity.endStartTime ) {
				    		eventEntity.message = "Event is already in progress, Can not be updated"
				    		return eventEntity;
				    	}
				    	if( currentTime > eventEntity.startTime || currentTime > eventEntity.endTime ){
				    		eventEntity.message = "Event start time or end time must be greater than current time";
				    		return eventEntity;
				    	}
				    }
				    
				    if(!eventModel.isRepeat && (eventModel.eventType != -603)) {
				    	var actualEventDate = new Date(eventEntity.startTime);
				    	var repeatTime = toCheckRepeatDuration(eventEntity.startTime, eventModel.durationType, eventModel.duration);
				    	
				    	if (new Date().getTime() > repeatTime) {
				    		eventEntity.message = "Event reminder time must be less than event start time";
				    		return eventEntity;
						}
				    }
				    
				    eventEntity.schedule = {};
				    if(!eventModel.isRepeat){
				    	eventEntity.schedule.repeatFrequencyType = DataProvider.resource.Event.getEventNoRepeatCode();
				    }else{
				    	switch (eventModel.repeatType) {
			            case repeatTypes.FOREVER:			            	
			            	eventEntity.schedule.repeatType = eventModel.repeatType;
			            	eventEntity.schedule.repeatFrequencyType = eventModel.repeatFreqType;
			            	eventEntity.schedule.repeatInterval = eventModel.repeatInterval;
			              break;
			            case repeatTypes.UNTIL_DATE:
			            	eventEntity.schedule.repeatType = eventModel.repeatType;
			            	eventEntity.schedule.repeatFrequencyType = eventModel.repeatFreqType;
			            	eventEntity.schedule.repeatInterval = eventModel.repeatInterval;
			            	
			            	var endDate = AppCoreUtilityServices.convertStringToDate(eventModel.endDate,'dd-mm-yyyy','-');
				            var endDateSec = AppCoreUtilityServices.convertDateToTimeStamp(endDate);
			            	eventEntity.schedule.repeatEndDate = endDateSec + endTimeSec;//1477202400000;
				              break;
			            case repeatTypes.COUNT:
			            	eventEntity.schedule.repeatType = eventModel.repeatType;
			            	eventEntity.schedule.repeatFrequencyType = eventModel.repeatFreqType;
			            	eventEntity.schedule.repeatInterval = eventModel.repeatInterval;
			            	eventEntity.schedule.repeatCount = eventModel.repeatCount;
				              break;
			            default:
			            	break;
			          }
				    }
				    
				    
				    
				    if (eventEntity.eventType != -603) {
				    	  eventEntity.attendees = [];
						   
						    for(var i = 0; i < eventModel.attendees.length; i++){
						    	eventEntity.attendees.push(eventModel.attendees[i]);
		    				}
						    
						    if (eventEntity.attendees.length == 0) {
							    eventEntity.attendees.push(Session.userId);
							}
						    
						    eventEntity.reminders = [];
						    //eventModel.duration = 1800;
						    //eventModel.frequency = 600;
						    var computedRemObj = AppCoreUtilityServices.computeEventReminderToSeconds(eventModel.durationType, eventModel.duration, null, eventModel.frequency);
					
						    if (eventModel.reminderId) {
								eventEntity.reminders.push({ id:eventModel.reminderId, duration: computedRemObj.duration, frequency: computedRemObj.freq });
							} else {
								eventEntity.reminders.push({ duration: computedRemObj.duration, frequency: computedRemObj.freq });
							} 
					}
				  

				    if (eventModel.scheduledJob) {
				    	eventEntity.scheduledJob = {};
				    	eventEntity.scheduledJob.owner = eventModel.scheduledJob.owner;
				    	eventEntity.scheduledJob.endTimeValue = eventModel.scheduledJob.endTimeValue;
				    	eventEntity.scheduledJob.endtimeType = parseInt(eventModel.scheduledJob.endtimeType);
				    	
				    	eventEntity.scheduledJob.templateId = eventModel.scheduledJob.templateId; 
				    	
				    	if (eventModel.scheduledJob.expectedFinishDate) {
    						var date = AppCoreUtilityServices.convertStringToDate(eventModel.scheduledJob.expectedFinishDate,'dd-mm-yyyy','-');
    						eventEntity.scheduledJob.expectedFinishDate = AppCoreUtilityServices.convertDateToTimeStamp(date);
    					}
				    	if (!eventModel.scheduledJob.owner && !eventModel.scheduledJob.templateId) {
				    		eventEntity.scheduledJob.invitations = eventModel.scheduledJob.invitations;
				    	} else {
				    		eventEntity.scheduledJob.owner = true;	
				    	}
				    	
				    	if (eventModel.scheduledJob.templateId) {
				    		eventEntity.scheduledJob.owner = eventModel.scheduledJob.owner;
						}
				    	
				    	if (eventModel.scheduledJob.invitations && eventModel.scheduledJob.templateId) {
				    		eventEntity.scheduledJob.invitations = eventModel.scheduledJob.invitations;	
						}
				    	
				    	if (eventModel.scheduledJob.templateId && eventModel.scheduledJob.tasks && eventModel.scheduledJob.tasks.length>0) {
				    		eventEntity.scheduledJob.tasks = eventModel.scheduledJob.tasks;
						}
				    	
					}
				    
			// console.log("EVENT ENTITY::::::::"+JSON.stringify(eventEntity));
			 
//				    eventEntity.startTime = new Date().getTime();
			return eventEntity;	    
		}

		function toCheckRepeatDuration(date, durationType, durationVal){
			var date = new Date(date);
			
			switch (durationType) {
			case 1:
				date = date.setMinutes(date.getMinutes() - durationVal);
				break;
			case 2:
				date = date.setHours(date.getHours() - durationVal);
				break;
			case 3:
				date = date.setDate(date.getDate() - durationVal);
				break;
			case 4:
				date = date.setDate(date.getDate() - (durationVal+6));
				break;	
			default:
				break;
			}
			return date;
		}

	
		return {
			createEventDialog: createEventDialog,
			editEventDialog: editEventDialog,
			deleteEventDialog: deleteEventDialog,
			ownedEventsList: ownedEventsList
		}

	}

})();