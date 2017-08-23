/**
 * Created by Vikas on 14/07/17.
 */
(function () {
	"use strict";

	angular.module('app.services')
	.service('WPAuditProductivityService', [
	                          '$q', 'Connect',
	                          'mDialog', '$mdToast',
	                          'blockUI', 'Lang','DataProvider','URL',
	                          'AppCoreUtilityServices','Session','$filter', '$timeout',
	                          WPAuditProductivityService
	                          ]);

	function WPAuditProductivityService($q, Connect, Dialog, $mdToast, blockUI, Lang, 
			               DataProvider, URL, AppCoreUtilityServices, Session, $filter, $timeout) {
		
		console.log("In WPAuditProductivityService..")
		
		var LANG = Lang.en.data;
		
		function getChartData(options) {
			var deferred = $q.defer();
			blockUI.start("Loading chart data...");
			var _params = {
					orgId : options.orgId,
					fromDate : options.fromDate ? options.fromDate : null,
					toDate : options.toDate ? options.toDate : null,
					userName : options.userName ? options.userName : null,		
					jobType : options.jobType,
					chartType : options.chartType,
					templateId : options.templateId
			};
			
			   DataProvider.resource.WPAudit.getProductivityChartData(_params)
			     .then(function(res) {
			    	 deferred.resolve(res);
			    	 blockUI.stop();
			    	
			     })
			     .catch(function(error) {
			    	 deferred.reject(error);
			     })
			     .finally(function(){
					blockUI.stop();
			     });
			   
			   return deferred.promise;
		}
		
		
		function loadOrgJobTemplates(orgId){

			var deferred = $q.defer();

			blockUI.start("Loading templates..", {
				status: 'isLoading'
			});
			
			var _params = {
					orgId: orgId
			};

			Connect.get(URL.TEMPLATE_LIST_ALL, _params)
			.then(function(data) {
				var res = data.resp;
				deferred.resolve(res);
				
			}).catch(function(err) {
				Dialog.alert({
					content: error.respMsg,
					ok: "Ok"
				});
			}).finally(function() {
				blockUI.stop();
			});
			
			return deferred.promise;
		}
		
		function getProductivityChartTypes(){
			var deferred = $q.defer();
			DataProvider.resource.WPAudit.lookUpTypes({type:"CHART_TYPE"})
		     .then(function(res) {
		    	 deferred.resolve(res);
		    	
		     })
		     .catch(function(error) {
		    	 deferred.reject(error);
		     })
		     .finally(function(){
		    	 deferred.resolve(res);
		     });
		   return deferred.promise;
		}

	
		return {
			getProductivityChartData : getChartData,
			loadOrgJobTemplates : loadOrgJobTemplates,
			getProductivityChartTypes : getProductivityChartTypes
		}

	}

})();