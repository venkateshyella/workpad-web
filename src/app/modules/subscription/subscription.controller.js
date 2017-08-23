/**
 * Created by sandeep on 17/01/2017.
 */
;(function () {

  angular.module('app')
    .controller('SubscriptionViewController', [
      '$scope', '$timeout', 'Connect', 'URL','$q','blockUI','$state','$stateParams',
       'mDialog', 'Lang','$braintree','SUBSCRIPTION_UOM_TYPES','SubscriptionService',
       'Session','OrgAdminService','SUBSCRIPTION_PACK_TYPES',
       SubscriptionViewController]);

  function SubscriptionViewController($scope, $timeout, Connect, URL,$q,blockUI,
		  $state, $stateParams,Dialog, Lang,$braintree, SUBSCRIPTION_UOM_TYPES, SubscriptionService,
		  Session, OrgAdminService, SUBSCRIPTION_PACK_TYPES) {
	  
	  var orgId = 0;
	  
	  function _init(){
		  orgId = $stateParams.orgId;
		  $scope.subscriptionInfoViewModel = {};
		  $scope.orgInfo = {};
		  $scope.uomTypes = SUBSCRIPTION_UOM_TYPES;
		  $scope.upgradedSubscriptionInfo = {};
		  $scope.upgradedSubscriptionInfo.totalAmount = 0;
		  $scope.upgradedSubscriptionInfo.organization = {};
		  $scope.upgradedSubscriptionInfo.items = [];
		  $scope.isAddonsAdded = false;
		  $scope.isNewOrg = $stateParams.orgId > 0 ? false: true;
		  $scope.packTypes = SUBSCRIPTION_PACK_TYPES;
		  $scope.sharedData.sideMenu.currItem = 'account';
		  $scope.subscriptionInfoViewModel.defaultSubscribedItems = {};
		  $scope.upgradeDataVolume = 1;
		  $scope.currentEncryptVolume = 0;
		  
		  $scope.isOrganizationExpired = false;
		  
		  fetchSubscriptionItemsList();
	  }
	 
	
	  
	  
	  function fetchSubscriptionItemsList(){
		  
		  SubscriptionService.getSubscritpionItems(orgId).then(function(res){
			  
			  $scope.subscriptionInfoViewModel = res;
			  
			  $scope.upgradedSubscriptionInfo.monthsRemaining = $scope.subscriptionInfoViewModel.orgSubscriptionInfo.monthsRemaining;
			  
			  if ($scope.upgradedSubscriptionInfo.monthsRemaining <= 0) {
				  if ($scope.subscriptionInfoViewModel.orgSubscriptionInfo.orgSubscriptionEndDate < new Date()) {
					  $scope.isOrganizationExpired = true;
					  $scope.orgExpireMsg = "Your Organization has Expired."; 
				  } else {
					  $scope.isOrganizationExpired = true;
					  $scope.orgExpireMsg = "Your Organization is going to Expire, upgrade is disabled for temporarily.";
				  }
			  }
			  
			  
			  if($scope.subscriptionInfoViewModel.packageInfo.id == SUBSCRIPTION_PACK_TYPES.CHARGED && $scope.isNewOrg){
				  $scope.upgradedSubscriptionInfo.totalAmount = $scope.subscriptionInfoViewModel.packageInfo.price * $scope.upgradedSubscriptionInfo.monthsRemaining;
				  calculateTotalSubscriptionAmount();
			  }
			  
			  
			  angular.forEach($scope.subscriptionInfoViewModel.items, function(item, key) {
				  $scope.subscriptionInfoViewModel.items[key].addonQty = 0; //$scope.subscriptionInfoViewModel.items[key].incrementCount;
				  if($scope.subscriptionInfoViewModel.items[key].itemAddons.length > 1){
					  $scope.subscriptionInfoViewModel.items[key].selectedAddon = {};//$scope.subscriptionInfoViewModel.items[key].itemAddons[0];
				  }else{
					  $scope.subscriptionInfoViewModel.items[key].selectedAddon = { qty : 0, 
							  amount : 0, 
							  isShown : false,
							  isEnabled : false,
							  oldDataVol : 0};
					  $scope.subscriptionInfoViewModel.items[key].selectedAddon.isEnabled = $scope.subscriptionInfoViewModel.items[key].subscribedItemInfo.value == "1" ? true : false;
				  }
				  
				  computeDefaultSubscribedItems(item);
				});
			  
		  }).finally(function(){
			  
		  });
	  }
	  
	  _init();
	  
	  
	  $scope.decrementAddonQty =  function(item){
		  item.addonQty = ((item.addonQty-item.incrementCount) >= 0) ? item.addonQty-item.incrementCount : 0;
		  var index = _.findIndex($scope.subscriptionInfoViewModel.items, {id: item.id});
		  $scope.subscriptionInfoViewModel.items[index].addonQty = item.addonQty;
		  
		  return true; //item.addonQty < 0 ? false : true;
	  };
	  
	  $scope.incrementAddonQty = function(item){
		  item.addonQty=item.addonQty+item.incrementCount;
	  };
	  
	  $scope.upgradeSubscription = function(item){
		  if(item.addonQty < 1){
			  $scope.removeAddon(item);
			  return;
		  }
		  
		  $scope.upgradedSubscriptionInfo =  SubscriptionService.addSubsriptionItem($scope.upgradedSubscriptionInfo, item, $scope.isNewOrg);
		  
		  var subItemIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode: item.itemCode});
		  var index = _.findIndex($scope.subscriptionInfoViewModel.items, {id: item.id});
		  $scope.subscriptionInfoViewModel.items[index].selectedAddon = { qty : $scope.upgradedSubscriptionInfo.items[subItemIndex].quantity, 
				  												 amount : $scope.upgradedSubscriptionInfo.items[subItemIndex].amount, 
				  												 isShown : true};
		  //$scope.subscriptionInfoViewModel.items[index].addonQty = $scope.subscriptionInfoViewModel.items[index].incrementCount;
		  
		  $scope.isAddonsAdded = ($scope.upgradedSubscriptionInfo.items.length > 0) ? true : false;
		  
		  if(item.itemCode == 'DATA_VOL'){
			  var dataVolItem = $scope.upgradedSubscriptionInfo.items[subItemIndex];
			  $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume.qty = dataVolItem.quantity;
			  $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume.isUpdated = true;
			  $scope.upgradeDataVolume = dataVolItem.quantity;
			//  $scope.currentEncryptVolume = $scope.isNewOrg ? parseInt($scope.currentEncryptVolume)-1 : $scope.currentEncryptVolume;
			  
			  var subProtectionIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_PROTECTION'});
			  var subEncIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_ENC'});
			  var subDataEnc,
			      subDataProtection;
			       
			  
			  if(subProtectionIndex > -1){
				  subDataProtection = $scope.upgradedSubscriptionInfo.items[subProtectionIndex];
			  }
			//  removeDataProtectionForDataVol(item, subDataProtection);
			  upgradeDataProtectionForDataVol(dataVolItem, subDataProtection);
			  
			  if(subEncIndex > -1){
				  subDataEnc = $scope.upgradedSubscriptionInfo.items[subEncIndex];
			  }
			  //removeDataEncryptionForDataVol(item, subDataEnc);
			  upgradeDataEncryptionForDataVol(dataVolItem, subDataEnc);
		  }
		  
		  calculateTotalSubscriptionAmount();
	  };
	  
	  function upgradeDataProtectionForDataVol(dataVolItem, subDataProtection){
		  
		  $scope.subscriptionInfoViewModel.dataProtection = $scope.subscriptionInfoViewModel.dataProtection ? $scope.subscriptionInfoViewModel.dataProtection : {};
		  var subscribedProtectionAddon = {};
		  var index = _.findIndex($scope.subscriptionInfoViewModel.items, {itemCode : 'DATA_PROTECTION'});
		  
		  var subItemIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_PROTECTION'});
		  
		  if((subItemIndex > -1) && $scope.subscriptionInfoViewModel.isProtectionUpgrade){
			  
			  
			  
			  var upgradedItem = $scope.upgradedSubscriptionInfo.items[subItemIndex];
			  var subItemAddonIndex = _.findIndex($scope.subscriptionInfoViewModel.items[index].itemAddons, {priceId : upgradedItem.priceId});
			  var subItemAddon = $scope.subscriptionInfoViewModel.items[index].itemAddons[subItemAddonIndex];
			  
			  _.remove($scope.upgradedSubscriptionInfo.items, {itemCode : upgradedItem.itemCode});
			  $scope.subscriptionInfoViewModel.isProtectionUpgrade && $scope.upgradeDataProtection($scope.subscriptionInfoViewModel.items[index], subItemAddon, true);
			  
			  
			  /*var _item = {};
			  _item.amount = Math.round(subItemAddon.price * dataVolItem.quantity * $scope.subscriptionInfoViewModel.orgSubscriptionInfo.monthsRemaining * 100) / 100;
			  _item.itemCode = $scope.subscriptionInfoViewModel.items[index].itemCode;
			  _item.quantity = dataVolItem.quantity;
			  _item.priceId = subscribedProtectionAddon.priceId;
			  _item.currency = subscribedProtectionAddon.currency;


			  $scope.upgradedSubscriptionInfo.items.push(_item);
        
			  $scope.upgradedSubscriptionInfo.totalAmount = $scope.subscriptionInfoViewModel.dataProtection.isEnabled 
			  ? ($scope.upgradedSubscriptionInfo.totalAmount - $scope.subscriptionInfoViewModel.dataProtection.amount + _item.amount)
					  : $scope.upgradedSubscriptionInfo.totalAmount + _item.amount;	
			  
			  $scope.upgradedSubscriptionInfo.totalAmount = Math.round($scope.upgradedSubscriptionInfo.totalAmount*100)/100;
              */
			  
			  subItemIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_PROTECTION'});
			  $scope.subscriptionInfoViewModel.dataProtection.isEnabled = true;
			  $scope.subscriptionInfoViewModel.dataProtection.amount = $scope.upgradedSubscriptionInfo.items[subItemIndex].amount;
			  $scope.subscriptionInfoViewModel.dataProtection.quantity = $scope.upgradedSubscriptionInfo.items[subItemIndex].quantity;
			  $scope.subscriptionInfoViewModel.dataProtection.currency = $scope.upgradedSubscriptionInfo.items[subItemIndex].currency;
			  $scope.subscriptionInfoViewModel.dataProtection.itemCode = $scope.upgradedSubscriptionInfo.items[subItemIndex].itemCode;
		  }
		  else if(index > -1 && !$scope.subscriptionInfoViewModel.isProtectionUpgrade){



			  var subscribedProtectionVal = $scope.subscriptionInfoViewModel.items[index].subscribedItemInfo.value;


			  var protectionAddonIndex = _.findIndex($scope.subscriptionInfoViewModel.items[index].itemAddons, {displayValue : subscribedProtectionVal});
			  subscribedProtectionAddon = $scope.subscriptionInfoViewModel.items[index].itemAddons[protectionAddonIndex];

			  if(protectionAddonIndex > -1){
				  
				  _.remove($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_PROTECTION'});
				  
				  
				  var _item = {};
				  _item.amount = Math.round(subscribedProtectionAddon.price * dataVolItem.quantity * $scope.subscriptionInfoViewModel.orgSubscriptionInfo.monthsRemaining * 100) / 100;
				  _item.itemCode = $scope.subscriptionInfoViewModel.items[index].itemCode;
				  _item.quantity = dataVolItem.quantity;
				  _item.priceId = subscribedProtectionAddon.priceId;
				  _item.currency = subscribedProtectionAddon.currency;

				  $scope.upgradedSubscriptionInfo.items.push(_item);

				  $scope.upgradedSubscriptionInfo.totalAmount = $scope.subscriptionInfoViewModel.dataProtection.isEnabled
				  ? ($scope.upgradedSubscriptionInfo.totalAmount - $scope.subscriptionInfoViewModel.dataProtection.amount + _item.amount)
						  : $scope.upgradedSubscriptionInfo.totalAmount + _item.amount;
				  
				  
				  $scope.upgradedSubscriptionInfo.totalAmount = Math.round($scope.upgradedSubscriptionInfo.totalAmount*100)/100;

				  $scope.subscriptionInfoViewModel.dataProtection.isEnabled = true;
				  $scope.subscriptionInfoViewModel.dataProtection.amount = _item.amount;
				  $scope.subscriptionInfoViewModel.dataProtection.quantity = _item.quantity;
				  $scope.subscriptionInfoViewModel.dataProtection.currency = _item.currency;
				  $scope.subscriptionInfoViewModel.dataProtection.itemCode = $scope.subscriptionInfoViewModel.items[index].itemCode;
				  
			  }else{
				  
				  $scope.subscriptionInfoViewModel.dataProtection.isEnabled = false;
				  $scope.subscriptionInfoViewModel.dataProtection.amount = 0;
				  $scope.subscriptionInfoViewModel.dataProtection.quantity = 0;
				  $scope.subscriptionInfoViewModel.dataProtection.currency = "";
				  $scope.subscriptionInfoViewModel.dataProtection.itemCode = "";
			  }

		  }
		  
		  calculateTotalSubscriptionAmount();
	  }
	  
	  
    function upgradeDataEncryptionForDataVol(dataVolItem, subDataEnc){
		  
		  $scope.subscriptionInfoViewModel.dataEncryption = {};
		  
		  var index = _.findIndex($scope.subscriptionInfoViewModel.items, {itemCode : 'DATA_ENC'});
		  
		  var subscribedEncryptionVal = $scope.subscriptionInfoViewModel.items[index].subscribedItemInfo.value;
		  var subscribedEncryptionAddon = $scope.subscriptionInfoViewModel.items[index].itemAddons[0];
		  
		  var volIndex = _.findIndex($scope.subscriptionInfoViewModel.items, {itemCode : 'DATA_VOL'});
		  var volItem = $scope.subscriptionInfoViewModel.items[volIndex];
		  
		  if(subscribedEncryptionVal == 1  || subscribedEncryptionVal == '1' || $scope.subscriptionInfoViewModel.isEncryptionEnabled){
			  var _item = {};
			  
			  var dataVolInEncrypt = 0;
			  
			  if ($scope.currentEncryptVolume > $scope.defaultDataVolume) {
				  dataVolInEncrypt = $scope.subscriptionInfoViewModel.isEncryptionEnabled ? parseInt(dataVolItem.quantity) + parseInt(volItem.subscribedItemInfo.quantity) : parseInt(dataVolItem.quantity);
			  } else {
				  dataVolInEncrypt = parseInt(dataVolItem.quantity);
			  }
			  
			  
//			  if(!$scope.isNewOrg && parseInt(dataVolItem.quantity) != 1 ){
//				  dataVolInEncrypt = $scope.subscriptionInfoViewModel.isEncryptionEnabled ? parseInt(dataVolItem.quantity) + parseInt(volItem.subscribedItemInfo.quantity) : parseInt(dataVolItem.quantity);
//			  }else{
//				  dataVolInEncrypt = parseInt(dataVolItem.quantity);
//			  }
			   
			   _item.amount = Math.round(subscribedEncryptionAddon.price * dataVolInEncrypt * $scope.subscriptionInfoViewModel.orgSubscriptionInfo.monthsRemaining * 100) / 100;
				_item.itemCode = $scope.subscriptionInfoViewModel.items[index].itemCode;
				_item.quantity =  dataVolInEncrypt;
				_item.priceId = subscribedEncryptionAddon.priceId;
				_item.currency = subscribedEncryptionAddon.currency;
				
				 var upgradedIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_ENC'});
				 if(upgradedIndex > -1) _.remove($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_ENC'});
				
				$scope.upgradedSubscriptionInfo.items.push(_item);
				//$scope.upgradedSubscriptionInfo.totalAmount = $scope.upgradedSubscriptionInfo.totalAmount + _item.amount;
				
				$scope.upgradedSubscriptionInfo.totalAmount = $scope.subscriptionInfoViewModel.dataEncryption.isEnabled 
				  ? ($scope.upgradedSubscriptionInfo.totalAmount - $scope.subscriptionInfoViewModel.dataEncryption.amount + _item.amount)
			      : $scope.upgradedSubscriptionInfo.totalAmount + _item.amount;	
				
				$scope.subscriptionInfoViewModel.dataEncryption.isEnabled = true;
				$scope.subscriptionInfoViewModel.dataEncryption.amount = _item.amount;
				$scope.subscriptionInfoViewModel.dataEncryption.quantity = _item.quantity;
				$scope.subscriptionInfoViewModel.dataEncryption.currency = _item.currency;
				$scope.subscriptionInfoViewModel.dataEncryption.itemCode = $scope.subscriptionInfoViewModel.items[index].itemCode;
		  }else{
			  calculateDataVolEncryption();
		  }
		  
		  calculateTotalSubscriptionAmount();
	  }
	  
	  
	  $scope.removeAddon = function(item){
		  
		  var upgradedItemIndex = _.findIndex($scope.subscriptionInfoViewModel.items, {id: item.itemCode});
		  var upgradedItem = $scope.upgradedSubscriptionInfo.items[upgradedItemIndex];
		  
		  $scope.upgradedSubscriptionInfo = SubscriptionService.removeAddonSubscription($scope.upgradedSubscriptionInfo, item);
		  var index = _.findIndex($scope.subscriptionInfoViewModel.items, {id: item.id});
		  
		  if($scope.subscriptionInfoViewModel.items[index].itemAddons.length > 1){
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon = {};//$scope.subscriptionInfoViewModel.items[index].itemAddons[0];
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon.isShown = false;
		  }else{
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon = { qty : 0, 
						 amount : 0, 
						 isShown : false};
		  }
		  
		  $scope.subscriptionInfoViewModel.items[index].selectedAddon = { qty : 0, 
					 amount : 0, 
					 isShown : false};
		  
		  $scope.subscriptionInfoViewModel.items[index].addonQty = 0;
		  $scope.isAddonsAdded = ($scope.upgradedSubscriptionInfo.items.length > 0) ? true : false;
		  
		  if(item.itemCode == 'DATA_PROTECTION'){
			  $scope.subscriptionInfoViewModel.isProtectionUpgrade = false;
			  var dataVolItemIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode: "DATA_VOL"});
			  if(dataVolItemIndex > -1){
			   upgradeDataProtectionForDataVol($scope.upgradedSubscriptionInfo.items[dataVolItemIndex]);
			  }
		  }
		  
		  if(item.itemCode == 'DATA_VOL'){
			  $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume.qty = parseInt(item.subscribedItemInfo.quantity);
			  $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume.isUpdated = false;
			  $scope.upgradeDataVolume = 1;
			  removeDataProtectionForDataVol(upgradedItem);
			  removeDataEncryptionForDataVol(upgradedItem);
		  }
		
		  calculateTotalSubscriptionAmount();
	  };
	  
	  
	  function removeDataProtectionForDataVol(item, subDataProtection ){
		  
		
		 if($scope.subscriptionInfoViewModel.dataProtection && $scope.subscriptionInfoViewModel.dataProtection.isEnabled 
				 || $scope.subscriptionInfoViewModel.isProtectionUpgrade) {
			 var subItemIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_PROTECTION'});
				 //_.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : $scope.subscriptionInfoViewModel.dataProtection.itemCode});
			 var viewItemIndex = _.findIndex($scope.subscriptionInfoViewModel.items, {itemCode : $scope.subscriptionInfoViewModel.dataProtection.itemCode});
			 var subProtectionItem = null;
			 
			 if(subItemIndex > -1){
				 subProtectionItem = $scope.upgradedSubscriptionInfo.items[subItemIndex];
				  var subItemAddonIndex = _.findIndex($scope.subscriptionInfoViewModel.items[viewItemIndex].itemAddons, {priceId : subProtectionItem.priceId});
				  var subItemAddon = $scope.subscriptionInfoViewModel.items[viewItemIndex].itemAddons[subItemAddonIndex];
				   
				  _.remove($scope.upgradedSubscriptionInfo.items, {itemCode : $scope.subscriptionInfoViewModel.dataProtection.itemCode});
				  
				  $scope.subscriptionInfoViewModel.isProtectionUpgrade && $scope.upgradeDataProtection($scope.subscriptionInfoViewModel.items[viewItemIndex], subItemAddon, true);
			 }
			 
			  $scope.upgradedSubscriptionInfo.totalAmount = Math.round(($scope.upgradedSubscriptionInfo.totalAmount - $scope.subscriptionInfoViewModel.dataProtection.amount) * 100)/100;
			  $scope.subscriptionInfoViewModel.dataProtection = {};
			  $scope.subscriptionInfoViewModel.dataProtection.amount = 0;
			  $scope.subscriptionInfoViewModel.dataProtection.isEnabled = false;
		  }
	    	
		 calculateTotalSubscriptionAmount();
	  }
	  
	  function removeDataEncryptionForDataVol(item, subDataEnc){
		  if($scope.subscriptionInfoViewModel.dataEncryption && $scope.subscriptionInfoViewModel.dataEncryption.isEnabled) {
			  
			  if(!$scope.subscriptionInfoViewModel.isEncryptionEnabled){
				  _.remove($scope.upgradedSubscriptionInfo.items, {itemCode : $scope.subscriptionInfoViewModel.dataEncryption.itemCode});
			  }else{
				  var dataEncIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_ENC'});
				 var subItemIndex =  _.findIndex($scope.subscriptionInfoViewModel.items, {itemCode : 'DATA_ENC'});
				 var subscribedEncryptionAddon = $scope.subscriptionInfoViewModel.items[subItemIndex].itemAddons[0];
				 
				 var prevDataVolIndex =  _.findIndex($scope.subscriptionInfoViewModel.items, {itemCode : 'DATA_VOL'});
				 var prevDataVol = $scope.subscriptionInfoViewModel.items[prevDataVolIndex];
				 var appliedQty = parseInt(prevDataVol.subscribedItemInfo.quantity); //$scope.subscriptionInfoViewModel.items[subItemIndex].subscribedItemInfo.quantity
				 
				 $scope.upgradedSubscriptionInfo.items[dataEncIndex].amount = Math.round(subscribedEncryptionAddon.price * appliedQty * $scope.subscriptionInfoViewModel.orgSubscriptionInfo.monthsRemaining * 100) / 100;
				  
			  } 
			   
			  $scope.upgradedSubscriptionInfo.totalAmount = Math.round(($scope.upgradedSubscriptionInfo.totalAmount - $scope.subscriptionInfoViewModel.dataEncryption.amount) * 100)/100;
			  $scope.subscriptionInfoViewModel.dataEncryption = {};
			  $scope.subscriptionInfoViewModel.dataEncryption.amount = 0;
			  $scope.subscriptionInfoViewModel.dataEncryption.isEnabled = false;
		  }
		  
		  calculateTotalSubscriptionAmount();
	  }
	  
	  
	  $scope.upgradeDataProtection = function(item, addon, isUpgrade){
		  
//		  if ($scope.currentEncryptVolume == 1 && item.selectedAddon.qty && addon.qty) {
//			  item.selectedAddon.qty = item.selectedAddon.qty - 1;
//			  addon.qty = addon.qty - 1; 
//		  }
		  
		  $scope.upgradedSubscriptionInfo =  SubscriptionService.addSubsriptionItem($scope.upgradedSubscriptionInfo, item);
		  var subItemIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode: item.itemCode});
		  var index = _.findIndex($scope.subscriptionInfoViewModel.items, {id: item.id});
		  $scope.subscriptionInfoViewModel.items[index].selectedAddon = addon;
		  $scope.subscriptionInfoViewModel.items[index].selectedAddon.amount = $scope.upgradedSubscriptionInfo.items[subItemIndex].amount;
		  $scope.subscriptionInfoViewModel.items[index].selectedAddon.qty = $scope.upgradedSubscriptionInfo.items[subItemIndex].quantity;
		  $scope.subscriptionInfoViewModel.items[index].selectedAddon.isShown = true;
		
		  
		  $scope.subscriptionInfoViewModel.isProtectionUpgrade = isUpgrade;
		  
		  calculateDataVolProtection();
		  
		  $scope.isAddonsAdded = ($scope.upgradedSubscriptionInfo.items.length > 0) ? true : false;

		  calculateTotalSubscriptionAmount();
	  };
	  
	  
	  
	  function calculateDataVolProtection(){
		  var dataVolIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_VOL'});
		  if(dataVolIndex > -1){
			  var dataVolItem = $scope.upgradedSubscriptionInfo.items[dataVolIndex];
			  
			  $scope.subscriptionInfoViewModel.dataProtection = $scope.subscriptionInfoViewModel.dataProtection ? $scope.subscriptionInfoViewModel.dataProtection : {};
			  
			  var subItemIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_PROTECTION'});
			  
			  $scope.subscriptionInfoViewModel.dataProtection.isEnabled = true;
			  $scope.subscriptionInfoViewModel.dataProtection.amount = $scope.upgradedSubscriptionInfo.items[subItemIndex].amount;
			  $scope.subscriptionInfoViewModel.dataProtection.quantity = $scope.upgradedSubscriptionInfo.items[subItemIndex].quantity;
			  $scope.subscriptionInfoViewModel.dataProtection.currency = $scope.upgradedSubscriptionInfo.items[subItemIndex].currency;
			  $scope.subscriptionInfoViewModel.dataProtection.itemCode = $scope.upgradedSubscriptionInfo.items[subItemIndex].itemCode;
			  
		  }
		 
		  calculateTotalSubscriptionAmount();
	  }
	  
	  
	  function calculateDataVolEncryption(){
		  var dataVolIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_ENC'});
		  if(dataVolIndex > -1){
			  var dataVolItem = $scope.upgradedSubscriptionInfo.items[dataVolIndex];
			  
			  $scope.subscriptionInfoViewModel.dataEncryption = $scope.subscriptionInfoViewModel.dataEncryption ? $scope.subscriptionInfoViewModel.dataEncryption : {};
			  
			  var subItemIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_ENC'});
			  
			  var dataVolItemIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode : 'DATA_VOL'});
			  if(dataVolItemIndex > -1){
				  $scope.subscriptionInfoViewModel.dataEncryption.isEnabled = true;
				  $scope.subscriptionInfoViewModel.dataEncryption.amount = $scope.upgradedSubscriptionInfo.items[subItemIndex].amount;
				  $scope.subscriptionInfoViewModel.dataEncryption.quantity = $scope.upgradedSubscriptionInfo.items[subItemIndex].quantity;
				  $scope.subscriptionInfoViewModel.dataEncryption.currency = $scope.upgradedSubscriptionInfo.items[subItemIndex].currency;
				  $scope.subscriptionInfoViewModel.dataEncryption.itemCode = $scope.upgradedSubscriptionInfo.items[subItemIndex].itemCode;
			  }
			  
			  
		  }else{
			  $scope.subscriptionInfoViewModel.dataEncryption = {};
		  }
		 
		  calculateTotalSubscriptionAmount();
	  }
	  
	  
	  
	  $scope.upgradeDataEncryption = function(item, isEnabled){
		  
		  if(isEnabled){
			  $scope.upgradedSubscriptionInfo =  SubscriptionService.addSubsriptionItem($scope.upgradedSubscriptionInfo, item, $scope.isNewOrg);
			  var subItemIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode: item.itemCode});
			  var index = _.findIndex($scope.subscriptionInfoViewModel.items, {id: item.id});
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon = {};
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon.amount = $scope.upgradedSubscriptionInfo.items[subItemIndex].amount;
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon.qty = $scope.upgradedSubscriptionInfo.items[subItemIndex].quantity;
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon.isShown = true;
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon.isEnabled = true;
			  $scope.subscriptionInfoViewModel.isEncryptionEnabled = true;
		  }else{
			  $scope.removeAddon(item);
			  $scope.subscriptionInfoViewModel.isEncryptionEnabled = false;
		  }
		  
		  calculateDataVolEncryption();
		  
		  $scope.isAddonsAdded = ($scope.upgradedSubscriptionInfo.items.length > 0) ? true : false;

	  };
	  
	  
	  $scope.upgradeChatEncryption = function(item, isEnabled){
		  var index = _.findIndex($scope.subscriptionInfoViewModel.items, {id: item.id});
		  
		  if(isEnabled){
			  $scope.upgradedSubscriptionInfo =  SubscriptionService.addSubsriptionItem($scope.upgradedSubscriptionInfo, item);
			  var subItemIndex = _.findIndex($scope.upgradedSubscriptionInfo.items, {itemCode: item.itemCode});
			  
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon = {};
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon.amount = $scope.upgradedSubscriptionInfo.items[subItemIndex].amount;
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon.qty = $scope.upgradedSubscriptionInfo.items[subItemIndex].quantity;
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon.isShown = true;
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon.isEnabled = true;
			  $scope.subscriptionInfoViewModel.isChatEncryptionEnabled = true;
		  }else{
			  $scope.removeAddon(item);
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon = {};
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon.isShown = false;
			  $scope.subscriptionInfoViewModel.items[index].selectedAddon.isEnabled = false;
			  $scope.subscriptionInfoViewModel.isChatEncryptionEnabled = false;
		  }
		  
		  calculateTotalSubscriptionAmount();
		  
		  $scope.isAddonsAdded = ($scope.upgradedSubscriptionInfo.items.length > 0) ? true : false;

	  };
	  
	  
	  
	  function calculateTotalSubscriptionAmount(){
		  var totalAmt = 0;
		  angular.forEach($scope.upgradedSubscriptionInfo.items, function(value, key) {
			  totalAmt = totalAmt + value.amount;
			});
		  
		  
		  if($scope.subscriptionInfoViewModel.packageInfo.id == SUBSCRIPTION_PACK_TYPES.CHARGED && $scope.isNewOrg){
			  totalAmt = totalAmt + ($scope.subscriptionInfoViewModel.packageInfo.price * $scope.subscriptionInfoViewModel.orgSubscriptionInfo.monthsRemaining);
		  }
		  $scope.upgradedSubscriptionInfo.totalAmount = Math.round(totalAmt*100)/100;
		  
		  return Math.round(totalAmt*100)/100;
	  }
	  
	  
	  $scope.proceedSubscribeToOrg = function(){
		  
		  /**
		   * Check if new organization
		   * case1 : check if addons are added (for basepack) or its charge pack
		   *         and proceed to create organization followed by payment. 
		   * case2 : if addons not added create only organization without payment. 
		   */
		  if($scope.isNewOrg){
			  
			  if($scope.upgradedSubscriptionInfo.items.length > 0 || $scope.subscriptionInfoViewModel.packageInfo.id == SUBSCRIPTION_PACK_TYPES.CHARGED){
				  $scope.upgradedSubscriptionInfo.orgId = null;
				  $scope.upgradedSubscriptionInfo.packageId = $scope.subscriptionInfoViewModel.packageInfo.id;
				  
				  SubscriptionService.createAndSubscribeNewOrganisation($scope.upgradedSubscriptionInfo);
				  
			  }else{
				  
				  SubscriptionService.CreateOrganisation($scope.upgradedSubscriptionInfo.organization).then(function(newOrgData) {
					  if (newOrgData.id) {
						  $scope.sharedData.sideMenu.currItem = 'my_orgs';
						  $scope.transitionTo('root.app.org-dashboard.orgInfo', {
							  orgId: parseInt(newOrgData.id)
						  }, {
							  REPLACE_STATE: false
						  });
					  }

					  }).catch(function(error){
						  console.log(error);
					  });
					
			  }
			  
		  }else{
			  /**
			   * If existing organization check for addons and proceed to payment
			   */
			  if($scope.upgradedSubscriptionInfo.items.length > 0){
				  $scope.upgradedSubscriptionInfo.orgId = $scope.subscriptionInfoViewModel.orgSubscriptionInfo.orgId;
				 // $scope.upgradedSubscriptionInfo.orgSubscriptionEndDate = $scope.subscriptionInfoViewModel.orgSubscriptionInfo.orgSubscriptionEndDate;
				  $scope.upgradedSubscriptionInfo.monthsRemaining = $scope.subscriptionInfoViewModel.orgSubscriptionInfo.monthsRemaining;
				  $scope.upgradedSubscriptionInfo.packageId = $scope.subscriptionInfoViewModel.packageInfo.id;

				  SubscriptionService.updateOrgSubscription($scope.upgradedSubscriptionInfo);
			  }
			  
		  }
	  };
	  
	  $scope.roundAmount = function(amt){
		  return Math.round(amt*100)/100;
	  };
	  
	  $scope.addOnFilter = function(id){
		  
		  var result ;
			switch (id) {
			case 1:
				result = "Users";
				break;
				
			case 2:
				result = "Groups";
				break;
			case 3:
				result = "GB";
				break;
			case 9:
				result = "GB";
				break;
				
			default:
			}
		  
		  return result
	  }
	  
	  
	  function computeDefaultSubscribedItems(item){
		  
		  $scope.subscriptionInfoViewModel.defaultSubscribedItems = $scope.subscriptionInfoViewModel.defaultSubscribedItems 
		  															? $scope.subscriptionInfoViewModel.defaultSubscribedItems : {};
		  
			switch (item.itemCode) {
			case 'DATA_VOL':
				
				$scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume = {};
				$scope.currentSubDataVolume = parseInt(item.subscribedItemInfo.quantity);
				$scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume.qty = parseInt(item.subscribedItemInfo.quantity);
				$scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume.price = parseInt(item.subscribedItemInfo.quantity)* item.itemAddons[0].price * $scope.subscriptionInfoViewModel.orgSubscriptionInfo.monthsRemaining;
				$scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume.price = Math.round($scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume.price * 100)/100;
				$scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume.show = true;
				$scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume.isUpdated = false;
				$scope.currentEncryptVolume = parseInt(item.subscribedItemInfo.quantity);
				$scope.defaultDataVolume = parseInt(item.defaultDataVolume);
				$scope.subscribedDataVolume = parseInt(item.subscribedItemInfo.quantity);
				
				break;
				
			case 'CHAT_ENC':
				
				break;
			case 'DATA_PROTECTION':
				
				$scope.subscriptionInfoViewModel.defaultSubscribedItems.dataProtection = {};
					var subscribedProtectionVal = item.subscribedItemInfo.value;
					var protectionAddonIndex = _.findIndex(item.itemAddons, {displayValue : subscribedProtectionVal});
				    var subscribedProtectionAddon = item.itemAddons[protectionAddonIndex];
				    
				    if(protectionAddonIndex > -1){
				    	var dataVolume = item.dataVolume == 0 || item.dataVolume == "0" ? item.dataVolume : 1;
					    dataVolume = parseInt(dataVolume);
					    
					    if(subscribedProtectionAddon)
					    $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataProtection.price = subscribedProtectionAddon.price;
					    
					    $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataProtection.qty = dataVolume;
					    $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataProtection.show = true;
					    	
				    }
				    	
				break;
			case 'DATA_ENC':
				  
				$scope.subscriptionInfoViewModel.defaultSubscribedItems.dataEncryption = {};
				var dataVolume = item.dataVolume > 0 ? item.dataVolume : 1;
			    $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataEncryption.qty = dataVolume;
			    $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataEncryption.price = Math.round(item.itemAddons[0].price * parseInt($scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume.qty) * $scope.subscriptionInfoViewModel.orgSubscriptionInfo.monthsRemaining * 100) / 100;
			    $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataEncryption.show = true;
				break;
				
			default:
			}
		  
	  }
	  
	  function toggleDefaultSubscribedItem(isShown){
		  $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataEncryption.show = isShown;
		  $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataProtection.show = isShown;
		  $scope.subscriptionInfoViewModel.defaultSubscribedItems.dataVolume.show = isShown;
	  }
	  
  }

})();