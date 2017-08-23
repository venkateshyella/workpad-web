/**
 * Created by sandeep on 03/07/17.
 */
;
(function() {
	"use strict";

	angular.module('app')
	.controller('AuditProductivityViewController', ['$scope', '$stateParams', 'blockUI', 'mDialog', 
	                                                '$timeout', 'Lang', 'Session','$rootScope','$http',
	                                                'WPAuditProductivityService',AuditProductivityViewController])


	function AuditProductivityViewController($scope, $stateParams, blockUI, Dialog, 
			$timeout, Lang, Session, $rootScope,$http,
			WPAuditProductivityService) {
		
		console.log("In AuditProductivityViewController..");
		
		$scope.LANG = Lang.data;

		$scope.searchModel = {};
		
		$scope.productivityTypes = [{ label: "Workspace", value: "workspace"},
		                            { label: "Room", value: "room"},
		                            { label: "People", value: "people"}
		];
		
		/*
		{label:"Job States", value: -740}, 
        {label:"Job State Time", value: -741},
        {label:"Time Spent on Jobs", value: -742}
        */
		$scope.chartFactorTypes = {
				workspace : [], 
				room : [],
				people : []
		};  
		
		$scope.jobTypes = [{
			label: "All",
			value: -730
		},{
			label: "Ad Hoc",
			value: -731
		},
		{
			label: "Template",
			value: -732
		},
		];
		
		$scope.orgTemplates = [];
		$scope.selProdType = null;
		
		$scope.selectProductivity = function(index, type) {
			$scope.selectedIndex = index;
			$scope.selProdType = type;
			//loadChartData(type, {});
		};
		
		$scope.clearChartView = function(){
			$scope.noChart = true;
			$scope.showTemplates = false;
			$scope.chartTitle = "";
			$scope.resetFilter();
		};
		
		$scope.selectFactorType = function(factorType){
			loadChartData($scope.selProdType, {factorType: factorType });
		};
		
		
		$scope.filterChartData = function(productivityType){
			loadChartData(productivityType);
		};
		
		$scope.loadOrgJobTemplates = function(jobType){
			if(jobType == -732){
				$scope.showTemplates = true;
				WPAuditProductivityService.loadOrgJobTemplates( $scope.orgTabCtrl.orgModel.id).then(
				function(res){
					if(res.results.length > 0){
						$scope.orgJobTemplates = res.results;	
						$scope.noTemplates = false;
					}else{
						$scope.noTemplates = true;
					}
					
				});
				
			}else{
				$scope.showTemplates = false;
				$scope.orgJobTemplates = [];
				$scope.searchModel.templateId = "";
				$scope.noTemplates = false;
			}
		};
		
		$scope.resetFilter = function(){
			$scope.searchModel.fromDate = null;
			$scope.searchModel.endDate = null;
			$scope.searchModel.userName = null;
			$scope.searchModel.templateId = "";
			$scope.searchModel.jobType = $scope.jobTypes[0].value;
		};
		
		function loadChartData(prodType, options){
			var selectedFactorType = $scope.searchModel.factorsType; 
			var selectedFactor = _.find($scope.chartFactorTypes['workspace'], {code: selectedFactorType});
			$scope.chartTitle = selectedFactor.name;
			var params = { orgId: $scope.orgTabCtrl.orgModel.id};
			
			
			if($scope.searchModel.fromDate){
				var fromDatee = new Date($scope.searchModel.fromDate);
				//fromDatee.setHours(0,0,0,0);
				params.fromDate = fromDatee.getTime();
			}
			
			if($scope.searchModel.endDate){
				var d = new Date($scope.searchModel.endDate);
				//d.setHours(23,59,59,999);
				d.setDate(d.getDate() + 1);
				d.setSeconds(d.getSeconds()-1);
				params.toDate = d.getTime();
			}
			
			if($scope.searchModel.userName){
				params.userName = encodeURI($scope.searchModel.userName);
			}
			
			if($scope.searchModel.templateId != "" && $scope.searchModel.templateId > -1){
				params.templateId = $scope.searchModel.templateId;
			}
			
			params.chartType = $scope.searchModel.factorsType; //-742;
			
			params.jobType = $scope.searchModel.jobType ? $scope.searchModel.jobType : $scope.jobTypes[0].value; //-730;
			var getChartData = WPAuditProductivityService.getProductivityChartData;
			getChartData(params).then(function(res){
				//console.log("chart Data: "+JSON.stringify(res));
				if(res && res != null){
					
					if($scope.searchModel.factorsType == -741){
						parseJobStateChartData(res);
					}else{
						parseChartData(res);
					}
					
					$scope.noChart = false;
				}else{
					$scope.labels = [];
					$scope.series = [];
					$scope.data = [];
					$scope.noChart = true;
				}
				
			}, function(err){
				
			});
			
			
			
			
		}
		
		function parseChartData(rawData){
			
			//$scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
			$scope.graphType = "line";
			  $scope.labels = rawData.xData.data;
			  $scope.series = [];//['Series A', 'Series B'];
			  $scope.data = [];
			  $scope.chartClass = "chart chart-line";
			  
			  for(var i = 0; i< rawData.yData.series.length; i++){
				  $scope.series.push(rawData.yData.series[i].seriesInfo.label);
				  $scope.data.push(rawData.yData.series[i].data);
			  }
			  /*$scope.data = [
			    [65, 59, 80, 81, 56, 55, 40],
			    [28, 48, 40, 19, 86, 27, 90]
			  ];*/
			  
			  $scope.type2Colors = ['#45b7cd', '#ff6384', '#5A44EB', 
			                        '#870026', '#042B62', '#13ED25',
			                        '#BA16F5', '#BD7C0B', '#F5D416'];
			  
			  var yAxis1Label = $scope.searchModel.factorsType == -742 ?'No. of Hours' : 'No. of Jobs';
			  
			  $scope.onClick = function (points, evt) {
			    console.log(points, evt);
			  };
			  $scope.datasetOverride = [{ yAxisID: 'y-axis-1', fill: false, type: 'line' }];//, { yAxisID: 'y-axis-2' }];
			  $scope.options = {
				legend: {display: true},	  
			    scales: {
			      yAxes: [
			        {
			          id: 'y-axis-1',
			          type: 'linear',
			          display: true,
			          position: 'left',
			          scaleLabel: {
		                 display: true,
		                 labelString: yAxis1Label
		              },
		              ticks : {min:0}
			        }/*,
			        {
			          id: 'y-axis-2',
			          type: 'linear',
			          display: true,
			          position: 'right'
			        }*/
			      ]
			    }
			  };
		}

		
		function parseJobStateChartData(rawData){
			
			//$scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
			
			  $scope.labels = rawData.xData.data;
			  $scope.series = [];//['Series A', 'Series B'];
			  $scope.data = [];
			  $scope.graphType = "mixed";
			  
			  for(var i = 0; i< rawData.yData.series.length; i++){
				  $scope.series.push(rawData.yData.series[i].seriesInfo.label);
				  $scope.data.push(rawData.yData.series[i].data);
			  }
			  
			  for(var i = 0; i< rawData.yData2.series.length; i++){
				  $scope.series.push(rawData.yData2.series[i].seriesInfo.label);
				  $scope.data.push(rawData.yData2.series[i].data);
			  }
			  /*$scope.data = [
			    [65, 59, 80, 81, 56, 55, 40],
			    [28, 48, 40, 19, 86, 27, 90]
			  ];*/
//			  $scope.onClick = function (points, evt) {
//			    console.log(points, evt);
//			  };
//			  
			  $scope.type1Colors = ['#45b7cd', '#ff6384', '#ff8e72'];
			  
			  $scope.datasetOverride = [{ yAxisID: 'y-axis-1',  type: 'bar' }, 
			                            { yAxisID: 'y-axis-2',  type: 'line', fill: false, borderWidth: 3,  }];
			  $scope.options = {
				legend: {display: true},	  
			    scales: {
			      yAxes: [
			        {
			          id: 'y-axis-1',
			          type: 'linear',
			          display: true,
			          position: 'left',
			          scaleLabel: {
		                 display: true,
		                 labelString: 'No. of Hours'
		              },
		              ticks : {min:0},
		              gridLines: {
	                        display: false
	                    }
			        },
			        {
			          id: 'y-axis-2',
			          type: 'linear',
			          display: true,
			          position: 'right',
			          scaleLabel: {
			                 display: true,
			                 labelString: 'No. of Jobs'
			              },
			          ticks : {min:0},
			          gridLines: {
	                        display: false
	                    }
			        }
			      ],
			      
			      xAxes: [{
			    	  ticks: {
			    	  autoSkip: false
			    	  },
			    	  gridLines: {
	                        display: false
	                   }
			    	  }]
			    }
			  };
		}
		
		function _init(){
			$scope.searchModel = {};
			$scope.searchModel.jobType = $scope.jobTypes[0].value;
			$scope.searchModel.templateId = "";
			$scope.dateFormat = "yyyy-MM-dd";
			$scope.maxDate = new Date().toString();
			
			 var startdate = new Date($scope.orgTabCtrl.orgModel.createTime);
			 startdate.setDate(startdate.getDate() - 1);
			 $scope.minDate = startdate.toString();
			
			WPAuditProductivityService.getProductivityChartTypes().then(function(res){
				$scope.chartFactorTypes.workspace = res;
				$scope.searchModel.factorsType = $scope.chartFactorTypes["workspace"][0].code;
				
				$scope.selectProductivity(0, $scope.productivityTypes[0].value);
			});
			
			
			$scope.noChart = false;
		}
		
		_init();
	};


})();