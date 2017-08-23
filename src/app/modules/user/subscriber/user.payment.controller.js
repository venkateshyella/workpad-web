;(function () {

  angular.module('app')
    .controller('UserPaymentViewController', [
      '$scope', '$timeout', 'Connect', 'URL','$q','blockUI','$state','$stateParams',
       'mDialog', 'Lang','$braintree',
      UserPaymentViewController]);

  function UserPaymentViewController($scope, $timeout, Connect, URL,$q,blockUI,
		  $state, $stateParams,Dialog, Lang,$braintree) {
	  
	  if($state.is('root.app.payment')){

		  /**
		   * BrainTree 
		   */

		  var client;

		  $scope.payButtonClicked = function() {
			  blockUI.start("Loading");
			  client.tokenizeCard({
				  number: $scope.creditCard.number,
				  expirationDate: $scope.creditCard.expirationDate
			  }, function (err, nonce) {

				  // - Send nonce to your server (e.g. to make a transaction)
				  console.log("got error==>"+JSON.stringify(err));
				  console.log("got nonce==>"+JSON.stringify(nonce));
				  $scope.paymentSubmission(nonce,blockUI,$stateParams.total);
			  });


		  };
		  $scope.btPaypalOptions = {
				  onPaymentMethodReceived: function (obj) {
					    // Do some logic in here.
					    // When you're ready to submit the form:
					    //myForm.submit();
					  $scope.paymentSubmission(obj.nonce,blockUI,$stateParams.total);
					  console.log(JSON.stringify(obj));
					  }
		  };



	  }  
	 
	 
	 $scope.newObject={
			 total:0,
			 usersCount:0,
			 grpCount:0,
			 chatLogs:0,
			 chatRate:0,dataEncryption:0,dataVolume:0,
			 dataAvailability:0,auditLogs:0,talkRooms:0,jobs:0,
			 chatEncryption:false,dataEncryption:false
	 }
	 $scope.chatRate = 0;
	 $scope.dataEncryptionrate =0;
	 $scope.cal = function(newObject){
		 $scope.newObject.total=0;
		 if($scope.newObject.chatEncryption){
			 $scope.chatRate = 50;
		 }else{
			 $scope.chatRate = 0;
		 }
		 if ($scope.newObject.dataEncryption){
			 $scope.dataEncryptionrate =50;
		 }else{
			 $scope.dataEncryptionrate =0;
		 }
		 // $scope.newObject.total = Number(newObject.usersCount || 0) + Number(newObject.grpCount || 0)+Number(newObject.chatRate || 0);
		 $scope.newObject.total = (newObject.usersCount * 10)  +  (newObject.grpCount *10) +  (newObject.chatLogs *10) +  
		 (newObject.jobs * 10) + Number($scope.chatRate || 0) + Number($scope.dataEncryptionrate || 0) ;
	 }

		    $scope.fetchClientToken = function (){

		    	$scope.transitionTo('root.app.payment', {
		    		total: parseInt($scope.newObject.total)

		    	}, {
		    		REPLACE_STATE: false
		    	});

		    }
	  
	  $scope.paymentSubmission = function (nonce,blockUI,total){
		  var deferred = $q.defer(),createJobTemplateDialogOptions1;

		  var _param_new={
				  nonce : nonce,
				  amount: total 
		  }
		  Connect.post(URL.PAYMENT_CONFIRM,_param_new).then(function (res) {
			  $scope.message = res.respMsg;
			  if($scope.message == 'success'){
				  $scope.trans = res.resp;
				  $scope.transitionTo('root.app.transaction', {
					  trans: $scope.trans
				  }, {
					  REPLACE_STATE: false
				  });
			  }
			  return deferred.resolve(res);
		  }).catch(function (error) {
			  Dialog.alert(error.respMsg);
			  deferred.reject();
		  }).finally(function () {
			  blockUI.stop();
		  });
		  return deferred.promise;	
	  }
	  
	  if($state.is('root.app.transaction')){
		 $scope.trans = $stateParams.trans;
	  }
	  
	  
	  
  }

})();