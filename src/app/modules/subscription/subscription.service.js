/**
 * Created by sandeep on 17/01/2017.
 */
(function () {
	"use strict";

	angular.module('app.services')
	.service('SubscriptionService', [
	                          '$q', 'Connect',
	                          'mDialog', '$mdToast',
	                          'blockUI', 'Lang','DataProvider','URL',
	                          'AppCoreUtilityServices','Session','SUBSCRIPTION_UOM_TYPES','State','OrganisationService',
	                          SubscriptionService
	                          ]);

	function SubscriptionService($q, Connect, Dialog, $mdToast, blockUI, Lang, 
			               DataProvider, URL, AppCoreUtilityServices, Session, SUBSCRIPTION_UOM_TYPES, State, OrganisationService) {

		var LANG = Lang.en.data;
		
		function _getSubscritpionItems(orgId) {
			var deferred = $q.defer();
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			
			var params = !!orgId ? {orgId : orgId} : {};
			
			DataProvider.resource.Subscription.getSubscribedItems(params, 
				{ bypassCache: true, autoClose: false }).then(function(result) {
				deferred.resolve(result);
			}).catch(function(err) {
				deferred.reject(err);
			}).finally(function () {
				blockUI.stop();
			});
			return deferred.promise;
		}
		
		
		function _addSubsriptionItem(subscritpionInfo, item, isNewOrg){
			
			!subscritpionInfo.items && (subscritpionInfo.items = []);
			
			var index = _.findIndex(subscritpionInfo.items, {itemCode : item.itemCode});
			if(index > -1){
				subscritpionInfo.totalAmount = subscritpionInfo.totalAmount -  subscritpionInfo.items[index].amount;
			}
		    
		    _.remove(subscritpionInfo.items, {itemCode : item.itemCode});
			
			var subItem = {}
			, uomId = 0;
			
			if(item.itemAddons.length > 1){
				uomId = item.selectedAddon.uom.id;
			}else{
				uomId = item.itemAddons[0].uom.id;
			}
			
			switch (uomId) {
			case SUBSCRIPTION_UOM_TYPES.EACH:
				
				subItem.itemCode = item.itemCode;
				subItem.quantity = item.addonQty;
				subItem.amount = (item.itemAddons[0].price*item.addonQty*subscritpionInfo.monthsRemaining);
				subItem.priceId = item.itemAddons[0].priceId;
				subItem.currency = item.itemAddons[0].currency;
				
				break;
				
			case SUBSCRIPTION_UOM_TYPES.GB:
				
				if(item.itemCode == 'DATA_PROTECTION'){
					subItem = _computeDataAvailability(item, subscritpionInfo);
				}else if(item.itemCode == 'DATA_VOL'){
					
					subItem.itemCode = item.itemCode;
					subItem.quantity = item.addonQty;
					subItem.amount = (item.itemAddons[0].price*item.addonQty*subscritpionInfo.monthsRemaining);
					subItem.priceId = item.itemAddons[0].priceId;
					subItem.currency = item.itemAddons[0].currency;
					
				}
				else{
					subItem.itemCode = item.itemCode;
					subItem.quantity = item.addonQty;
					subItem.amount = (item.itemAddons[0].price*item.addonQty*subscritpionInfo.monthsRemaining);
					subItem.priceId = item.itemAddons[0].priceId;
					subItem.currency = item.itemAddons[0].currency;
				}
				
				break;
				
				
			case SUBSCRIPTION_UOM_TYPES.BOOL: 	

				if(item.itemCode == 'CHAT_ENC'){
					subItem.itemCode = item.itemCode;
					subItem.quantity = 1;
					subItem.amount = Math.round(item.itemAddons[0].price * subItem.quantity * subscritpionInfo.monthsRemaining * 100)/100;
					subItem.priceId = item.itemAddons[0].priceId;
					subItem.currency = item.itemAddons[0].currency;
					
				}else if(item.itemCode == 'DATA_ENC'){
					
					subItem.itemCode = item.itemCode;
					subItem.quantity = parseInt(item.dataVolume) > 0 ? parseInt(item.dataVolume) : item.subscribedItemInfo.quantity;
					var index = _.findIndex(subscritpionInfo.items, {itemCode : 'DATA_VOL'});
					if(index > -1){
						var dataVolQty = (parseInt(subItem.quantity) == parseInt(item.defaultDataVolume)) ? 0 :  parseInt(subItem.quantity);
						subItem.quantity = parseInt(subscritpionInfo.items[index].quantity) + dataVolQty;
					}
					subItem.amount = Math.round(item.itemAddons[0].price * subItem.quantity * subscritpionInfo.monthsRemaining * 100)/100;
					subItem.priceId = item.itemAddons[0].priceId;
					subItem.currency = item.itemAddons[0].currency;
				}
				
				
				
			default:
				
			}
			
			subscritpionInfo.items.push(subItem);
			subscritpionInfo.totalAmount = Math.round((subscritpionInfo.totalAmount +  subItem.amount) * 100) / 100;
			
             return subscritpionInfo;
		}
		
		function _computeDataAvailability(item, subscritpionInfo){
			var _item = {};
			
			// item.defaultDataVolume is 1 by default from server
			if (subscritpionInfo.items.length > 0 && subscritpionInfo.items[0].quantity > parseInt(item.defaultDataVolume) && parseInt(item.dataVolume) == parseInt(item.defaultDataVolume)) {
				var _totalVolume = 0 ;	
			} else {
				var _totalVolume = parseInt(item.dataVolume) ;
			}
			
			var index = _.findIndex(subscritpionInfo.items, {itemCode : 'DATA_VOL'});
			if(index > -1){
				_totalVolume = _totalVolume + subscritpionInfo.items[index].quantity; 
			}else{
				_totalVolume = _totalVolume > 0 ? _totalVolume :  item.subscribedItemInfo.quantity;
			}
			
			if(_totalVolume > 0){
				_item.amount = (_totalVolume*item.selectedAddon.price*subscritpionInfo.monthsRemaining);
			}else{
				_item.amount = item.selectedAddon.price*subscritpionInfo.monthsRemaining;
			}
			
			_item.amount = Math.round(_item.amount * 100) / 100;
			_item.itemCode = item.itemCode;
			_item.quantity = _totalVolume;
			_item.priceId = item.selectedAddon.priceId;
			_item.currency = item.selectedAddon.currency;
			
			return _item;
		}
		
		function _computeDataEncryption(item){
			var _item = item;
			
			return _item;	
		}
		
		function _removeAddonSubscription(upgradedSubscriptionInfo, item){
	    	_.remove(upgradedSubscriptionInfo.items, {itemCode : item.itemCode});
	    	upgradedSubscriptionInfo.totalAmount = upgradedSubscriptionInfo.totalAmount - item.selectedAddon.amount;
	    	return upgradedSubscriptionInfo;
	    }
		
		function _createAndSubscribeNewOrganisation(subscriptionInfo) {
			var deferred = $q.defer();

			blockUI.start("Creating Org", {
				status: 'isLoading'
			});

			DataProvider.resource.Payment.placeOrder(subscriptionInfo).then(function (res) {

				if (res.isSuccess) {
					var result = res.resp;
					blockUI.stop();
					State.transitionTo('root.app.payment', {options: {
						token: result.token,
						referenceId: result.referenceId,
						totalAmount: subscriptionInfo.totalAmount,
						currency: 'USD'
					}
					}, {
						FLAGS: {
							CLEAR_STACK: true
						}
					});

					deferred.resolve(result);
				}

			},
			function(err){
				blockUI.stop();
				deferred.reject(err);
				Dialog.alert(err.respMsg);

			}).catch(function (error) {
				blockUI.stop();
				$mdDialog.hide();
				deferred.reject(error);
				Dialog.alert(error);
			}).finally(function () {
			});

		}
		
		 function _createAndSubscribeOrganisation(subscriptionInfo, isBasePack) {

	            var deferred = $q.defer();
	             Dialog.show({
	                controller: ['$scope', '$controller', '$mdDialog', 'blockUI', 'mDialog', 'OrganisationService','State',
	                    function OrgCreateDialogController($scope, $controller, $mdDialog, blockUI, mDialog, OrganisationService, State) {
	                        var self = this;

	                        $scope.form = {};
	                        $scope.formModel = {};
	                        $scope.formModel.create_org = {};
	                        $scope.cancel = $mdDialog.cancel;
	                        
	                        

	                        $scope.submit = function submit(orgFormModel) {

	                        	blockUI.start("Creating Org", {
	                        		status: 'isLoading'
	                        	});

	                        	subscriptionInfo.organization = {};
	                        	subscriptionInfo.organization.orgName = $scope.formModel.create_org.name;
	                        	subscriptionInfo.organization.desc = $scope.formModel.create_org.desc;
	                        	subscriptionInfo.organization.adminId = Session.userId;


	                        	DataProvider.resource.Payment.placeOrder(subscriptionInfo).then(function (res) {
	                        		blockUI.stop();
	                        		if (res.isSuccess) {
	                        			var result = res.resp;

	                        			State.transitionTo('root.app.payment', {options: {
	                        				token: result.token,
	                        				referenceId: result.referenceId,
	                        				totalAmount: subscriptionInfo.totalAmount,
	                        				currency: 'USD'
	                        			}
	                        			}, {
	                            			FLAGS: {
	                        					CLEAR_STACK: true
	                        				}
	                                		});

	                        			
	                        			$mdDialog.hide();
	                        			deferred.resolve(result);
	                        		}

	                        	},
	                        	function(err){
	                        		blockUI.stop();
	                        		deferred.reject(err);
	                        		Dialog.alert(err.respMsg);

	                        	}).catch(function (error) {

	                        		blockUI.stop();
	                        		$mdDialog.hide();
	                        		deferred.reject(error);
	                        		Dialog.alert(error);

	                        	}).finally(function () {
	                        	});


	                        };

	                        function _getSubscriptionEndDate(){
	                        	return (new Date(new Date().setFullYear(new Date().getFullYear() + 1))).getTime();
	                        }
	                    }
	                ],
	                templateUrl: 'app/modules/org/templates/org-create.dialog.tpl.html',
	                clickOutsideToClose:false
	                
	            });

	          return deferred.promise;

	        }
		
		 
		    function _updateOrgSubscription(subscriptionInfo){

		    	var deferred = $q.defer();

                blockUI.start("Proceeding to payment..", {
                    status: 'isLoading'
                });
                

                DataProvider.resource.Payment.placeOrder(subscriptionInfo).then(function (res) {
                	blockUI.stop();
                	if (res.isSuccess) {
                		var result = res.resp;

                		State.transitionTo('root.app.payment', {options: {
                			token: result.token,
                			referenceId: result.referenceId,
                			totalAmount: subscriptionInfo.totalAmount,
                			currency: 'USD',
                			orgId: subscriptionInfo.orgId
                		}
                		}, {
                			FLAGS: {
        					CLEAR_STACK: true
        				}
                		});

                		deferred.resolve(result);
                	}
      			 
      		  },
      		  function(err){
      			blockUI.stop();
                deferred.reject(err);
                Dialog.alert(err.respMsg);
                
      		  }).catch(function (error) {
      			  
      			blockUI.stop();
                deferred.reject(error);
                Dialog.alert(error.respMsg);
                
      		  }).finally(function () {
      		  });

                return deferred.promise;
		    }
		    
	        function _createOrganisation(orgFormModel) {
	        	var deferred = $q.defer();
	        	
	            blockUI.start("Creating Org", {
	                status: 'isLoading'
	            });

	            OrganisationService.submitCreateOrgReq({
	                    orgName: orgFormModel.orgName,
	                    orgDesc: orgFormModel.desc
	                })
	                .then(function(result) {
	                    blockUI.stop();
	                    deferred.resolve(result);
	                }).catch(function(error) {
	                    blockUI.stop();
	                    Dialog.alert(error.respMsg);
	                    deferred.reject(error);
	                });
	            
	            return deferred.promise;
	        }
		 
		    

		return {
			getSubscritpionItems: _getSubscritpionItems,
			addSubsriptionItem: _addSubsriptionItem,
			createAndSubscribeOrganisation: _createAndSubscribeOrganisation,
			updateOrgSubscription: _updateOrgSubscription,
			removeAddonSubscription: _removeAddonSubscription,
			createAndSubscribeNewOrganisation: _createAndSubscribeNewOrganisation,
			CreateOrganisation:_createOrganisation
			
		}

	}

})();