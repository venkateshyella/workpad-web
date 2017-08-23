/**
 * Created by sudhir on 8/10/15.
 */

;
(function() {
        "use strict";

        angular.module('app')
            .controller('DatePickerFieldViewController', ['$scope', '$stateParams',
                'DataProvider', 'mDialog',
                DatePickerFieldViewController
            ]);

        function DatePickerFieldViewController($scope, $stateParams, DataProvider, Dialog) {


            //  var mindate = new Date($scope.fieldDef.fieldData.constraints.dateValue.datetime.latest);
            // var maxdate = new Date($scope.fieldDef.fieldData.constraints.dateValue.range.maximum);

            //min="2013-10-01" max="2013-10-20"

            // $scope.fieldModel.minDate = new Date(mindate.getFullYear() + "-"+ (mindate.getMonth()+1)+ "-" + mindate.getDate());
            // $scope.fieldModel.maxDate = new Date(maxdate.getFullYear() + "-"+ (maxdate.getMonth()+1)+ "-" + maxdate.getDate());
            // $scope.fieldModel.maxDate = new Date(mindate.getFullYear() + "-"+ (mindate.getMonth()+1)+ "-" + mindate.getDate());
            //  $scope.fieldModel.dateValue = new Date();

            $scope.fieldModel.minDate = new Date("2015-10-01");
            $scope.fieldModel.maxDate = new Date("2015-10-25");



         }   

        })();
