/**
 * Created by sudhir on 9/10/15.
 */

;
(function() {
    "use strict";

    angular.module('app')
        .config(['FormServiceProvider',
            FormServiceConfig
        ]);

    function FormServiceConfig(FormServiceProvider) {

        validate.extend(validate.validators.datetime, {
        // The value is guaranteed not to be null or undefined but otherwise it
        // could be anything.
        // parse: function(value, options) {
        //   return +moment.utc(value);
        // },
        // Input is a unix timestamp
        format: function(value, options) {
            var format = options.dateOnly ? "MM/DD/YYYY" : "YYYY-MM-DD hh:mm:ss";
            return moment.utc(value).format(format);
        }
    });

        var fieldTypeString =
            FormServiceProvider.defineField('Datepicker', {
                type: 'datepicker',
                fieldData: {
                    //Field validations  will be here 
                    constraints: {
                        label: {
                            length: {
                                minimum: 5,
                                maximum: 20,
                                tooShort: "should longer than %{count} characters.",
                                tooLong: "Please limit the label length to %{count} characters."
                            }
                        },
                        desc: {
                            length: {
                                minimum: 5,
                                maximum: 50,
                                tooShort: "should be at-least than %{count} characters.",
                                tooLong: ": Please limit the field description to %{count} characters."
                            }
                        }
                    }
                },
                tpl: {
                    editor: "app/modules/form/templates/datepicker-field/datepicker-editor.partial.html",
                    form: "app/modules/form/templates/datepicker-field/datepicker-form.partial.html",
                    preview: "app/modules/form/templates/datepicker-field/datepicker-preview.partial.html"
                },
                editorConfig: {
                    controller: ['EditorCtrl', 'mDialog', '$scope', '$timeout', 'Lang',
                        function DatePickerEditorController(EditorCtrl, Dialog, $scope, $timeout, Lang) {
                          console.log("In date picker controller");
                            $scope.selectAndAddValidations = selectAndAddValidations;
                            $scope.showValidationEditor = showValidationEditor; 


                            if($scope.formField.validation.datetime.earliest){
                               
                                $scope.formField.validation.datetime.earliest  = moment.utc(new Date($scope.formField.validation.datetime.earliest))
                                                                                       .format('MM/DD/YYYY');
                            }

                            if($scope.formField.validation.datetime.latest){
                                $scope.formField.validation.datetime.latest =  moment.utc(new Date($scope.formField.validation.datetime.latest))
                                                                                     .format('MM/DD/YYYY');
                            }

                            function selectAndAddValidations($event){

                                var validators = EditorCtrl.formField.getAvailableValidators(false);
                                var selectOptions = [];
                                if (validators.datetime) {
                                    selectOptions.push({
                                        text: "Date Range",
                                        value: 'datetime'
                                    });

                                    EditorCtrl.showValidationSelector(selectOptions, $event)
                                        .then(function(select) {
                                            EditorCtrl.showValidationEditor(select.value)
                                                .then(function(constraint) {
                                                    _addValidatorConstraint(constraint);
                                                });
                                        });
                                }

                            }
                            function  showValidationEditor(type){

                              return EditorCtrl.showValidationEditor(type)
                                    .then(function(constraint) {
                                        _addValidatorConstraint(constraint);
                                    });

                            } 

                              function _addValidatorConstraint(constraint) {

                                if (constraint) {
                                    if ((constraint.earliest > constraint.latest) ||
                                        (constraint.earliest == null && constraint.latest == null)) {
                                        Dialog.alert({
                                            title: "Invalid Validations",
                                            content: "Please Enter valid date for validation",
                                            ok: "Ok"
                                        });

                                    } else {
                                        constraint.dateOnly= true,

                                        constraint.earliest = moment.utc(new Date(constraint.earliest))
                                                                                       .format('MM/DD/YYYY');
                                        constraint.latest = moment.utc(new Date(constraint.latest))
                                                                                       .format('MM/DD/YYYY');
                                        EditorCtrl.addValidator('datetime', constraint);
                                    }

                                   // EditorCtrl.addValidator('datetime', constraint);
                                } else {
                                    console.log("constraint" + constraint);
                                }
                            }     
                        }
                    ]
                },
                validators: {
                    datetime: {
                        dateOnly: true,
                        latest: moment.utc(new Date()).format('MM/DD/YYYY'),
                        earliest: moment.utc(new Date()).format('MM/DD/YYYY')
                    },
                    presence: false
                }
            });


    }

})();
