/**
 * Created by sudhir on 8/10/15.
 */

;
(function() {
    "use strict";

    angular.module('app')
        .controller('CheckBoxFieldViewController', ['$scope', '$stateParams',
            'DataProvider', 'mDialog',
            CheckBoxFieldViewController
        ]);

    function CheckBoxFieldViewController($scope, $stateParams, DataProvider, Dialog) {

        $scope.addCheckBoxField = addCheckBoxField;
        $scope.removeCheckBox = removeCheckBox;
        $scope.editCheckBox = editCheckBox;
        $scope.updateFormModel = updateFormModel;



        if (!$scope.fieldModel.checkBoxListData) {
            $scope.fieldModel.checkBoxListData = [];
        }

        $scope.isNotAllowedToAdd = false;

        var maxCount = $scope.fieldDef.fieldData.constraints.checkBoxListData.count.maximum;
        var minCount = $scope.fieldDef.fieldData.constraints.checkBoxListData.count.minimum;


        function removeCheckBox(index) {

            $scope.fieldModel.checkBoxListData.splice(index, 1);
            checkCountValidation();
            updateFormModel();
        }

        function addCheckBoxField() {


            addAndEditCheckBox().then(function(checkBoxItem) {
                var result = checkForDuplicates(checkBoxItem);
                if (result) {
                    $scope.fieldModel.checkBoxListData.push(checkBoxItem);
                    checkCountValidation();
                    updateFormModel();

                } else {

                    Dialog.alert({
                        content: "Item already exists.Please enter different text.",
                        ok: "Ok"
                    }).finally(function() {});

                }
            });

        }
        function updateFormModel(){

            $scope.formField.keyValue = angular.copy($scope.fieldModel.checkBoxListData);

        }

        function checkForDuplicates(checkBoxItem) {

            var tempCount = 0;
            for (var i = 0; i < $scope.fieldModel.checkBoxListData.length; i++) {
                if ($scope.fieldModel.checkBoxListData[i].name == checkBoxItem.name) {
                    tempCount = tempCount + 1;
                }
            }
            if (tempCount == 0) {
                return true; //No Duplicates
            } else {
                return false; // Duplicate exists
            }

        }

        function editCheckBox(index) {

            var itemToBeEdited = $scope.fieldModel.checkBoxListData[index];
            addAndEditCheckBox(itemToBeEdited).then(function(editedCheckBoxItem) {

                var result = checkForDuplicates(editedCheckBoxItem);
                if (result) {
                    $scope.fieldModel.checkBoxListData[index] = editedCheckBoxItem;
                    checkCountValidation();
                    updateFormModel();

                } else {
                    Dialog.alert({
                        content: "Item already exists.Please enter different text.",
                        ok: "Ok"
                    }).finally(function() {});
                }

            });


        }
        //For enabling and diabling Add Field of check box
        function checkCountValidation() {
            var currentcheckBoxListDataCount = $scope.fieldModel.checkBoxListData.length;
            if (currentcheckBoxListDataCount >= maxCount) {

                $scope.isNotAllowedToAdd = true;
                Dialog.alert({
                    content: "No more further additions please",
                    ok: "Ok"
                }).finally(function() {});
            } else {
                $scope.isNotAllowedToAdd = false;
            }
        }
        

        function addAndEditCheckBox(checkBoxItem) {

            var checkBoxModel = angular.copy(checkBoxItem);
            var  checkBoxHeading = "";

            if(checkBoxModel){
                checkBoxHeading = "Edit";
            }
            else{
                 checkBoxHeading = "Add";
            }
            return Dialog.show({
                controller: ['$scope', '$controller', '$mdDialog',
                    function addAndEditCheckBoxDialogController($scope, $controller, $mdDialog) {
                        var self = this;

                        $scope.form = {};
                        $scope.formModel = {};
                        $scope.formModel.addCheckBoxField = checkBoxModel;
                        $scope.cancel = $mdDialog.cancel;
                        $scope.checkBoxHeading = checkBoxHeading;
                        $scope.submit = function submit(data) {

                            var checkBoxName = $scope.formModel.addCheckBoxField.name;
                            var checkBoxSelection = $scope.formModel.addCheckBoxField.selection;

                            if(!checkBoxSelection){
                                checkBoxSelection = false;
                            }

                            $mdDialog.hide({
                                name: checkBoxName,
                                selected: checkBoxSelection
                            });
                        };
                    }
                ],
                templateUrl: 'app/modules/form/templates/checkbox-field/checkbox-field.dialog.tpl.html'
            });
        }

    }

})();
