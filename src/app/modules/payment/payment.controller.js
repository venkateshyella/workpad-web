/**
 * Created by sandeep on 23/01/2017.
 */
;(function () {
	angular.module('app')
	.controller('PaymentViewController', [
'$scope', '$timeout', 'Connect', 'URL','$q','blockUI','$state','$stateParams','DataProvider','$controller','Session',
'mDialog', 'Lang','$braintree','$rootScope',
PaymentViewController]);
	function PaymentViewController($scope, $timeout, Connect, URL,$q,blockUI,
			$state, $stateParams, DataProvider, $controller, Session, Dialog, Lang,$braintree,
			$rootScope) {
		var self = this,
		LANG = Lang.en.data;
		
		$scope.userInfo = {
				userName : Session.userInfo.userFirstName+" "+Session.userInfo.userLastName,
				emailID : Session.userInfo.userEmail
		}
		var options = {
				token: $stateParams.options.token,
				referenceId: $stateParams.options.referenceId,
				totalAmount: $stateParams.options.totalAmount,
				currency: $stateParams.options.currency,
				orgId: $stateParams.options.orgId
		}
		
		_init();
		function _init() {
			blockUI.start("Loading...", {
				status: 'isLoading'
			});
			$scope.isReady = false;
			$scope.subTitle = "Reference Id: "+options.referenceId;
			$scope.totalAmount = "Payable Amount: USD "+options.totalAmount;
			$scope.isTransactionSuccess;
			$scope.title = "Payment";
			$scope.isPaymentView = true;
			$scope.referenceId = options.referenceId;
			$scope.enablePaymentSubmit = false;
			$scope.disableSubmit  = false;
			
			$braintree.setClientToken(options.token);
			
			$scope.btPaypalOptions = {
					paypal: {
						singleUse: true,
						amount: options.totalAmount,
						currency: options.currency
					},
					onReady: function () {
						$scope.isReady = true;
						blockUI.stop();
				        },
					onPaymentMethodReceived: function (obj) {
						$scope.isReady = false;
						$scope.paymentSubmission(obj.nonce);
					}

			};
		}
		$scope.paymentSubmission = function (nonce){
			$scope.trans = {};
			blockUI.start("Payment Confirming...", {
				status: 'isLoading'
			});
			var _param_new = {
					nonce : nonce,
					totalAmount: options.totalAmount,
					referenceId:options.referenceId
			}
			DataProvider.resource.Payment.confirmOrder(_param_new).then(function (res) {
				if (res.isSuccess) {
					$scope.isTransactionSuccess = true;
					$scope.title = "Transaction Details";
					$scope.isPaymentView = false;
					$scope.trans = res.resp;
					$scope.trans.status = "Success";
				}
			}).catch(function (error) {
				$scope.isTransactionSuccess = false;
				$scope.isPaymentView = false;
				$scope.trans = error.resp;
				$scope.trans.status = "Failure";	
			}).finally(function () {
				blockUI.stop();
			});
		}
		$scope.cancel = function () {
			$state.transitionTo('root.app.subscription', {
					orgId:options.orgId
			}, {
				 REPLACE_STATE: false
				});
		}
		
		$scope.gotoOrgPage =  function(orgId) {
			
			$scope.sharedData.sideMenu.currItem = 'my_orgs';
			
			$state.transitionTo('root.app.org-dashboard.orgInfo', {
                orgId: parseInt(orgId)

            }, {
                REPLACE_STATE: false
            });
		}
		
		
		$scope.initFormEvents = function(){
			$("#submitButtonId").click(function(e){
				if(!$scope.notAllow){
					e.preventDefault();
				}
				
				 $timeout( function(){
       	        }, 500);
				
			});
		};
		
		$rootScope.$on("btDropinError",function(obj){
			$scope.notAllow = true;
		});
		
	}
})();