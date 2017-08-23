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

        var fieldTypeString =
            FormServiceProvider.defineField('Number', {
                type: 'number',
                fieldData: {
                    constraints: {
                        label: {
                            length: {
                                minimum: 5,
                                maximum: 10,
                                tooShort: "should longer than %{count} characters.",
                                tooLong: "Please limit the label length to %{count} characters."
                            }
                        },
                        desc: {
                            length: {
                                minimum: 5,
                                maximum: 20,
                                tooShort: "should be at-least than %{count} characters.",
                                tooLong: ": Please limit the field description to %{count} characters."
                            }
                        }
                    }
                },
                tpl: {
                    editor: "app/modules/form/templates/number-field/number-editor.partial.html",
                    form: "app/modules/form/templates/number-field/number-form.partial.html",
                    preview:"app/modules/form/templates/number-field/number-preview.partial.html"
                },
                editorConfig: {
                    controller: ['EditorCtrl', 'mDialog', '$scope', '$timeout', 'Lang',
                        function NumberEditorController(EditorCtrl, Dialog, $scope, $timeout, Lang) {
                            $scope.selectAndAddValidations = selectAndAddValidations;
                            $scope.showValidationEditor = showValidationEditor;

                            $scope.$watch('editorCtrl.formField.validation.presence', function(newValue, oldValue) {
                                /**
                                 * Get available validation object if available
                                 * Otherwise copy default validation constraint form field definition.
                                 * @type {Object} Validation constraint object
                                 */
                                var numericalityConstraint = EditorCtrl.formField.validation.numericality || angular.copy(EditorCtrl.fieldDef.validators.numericality);
                                if (newValue === true) {
                                    if (!numericalityConstraint.greaterThan || numericalityConstraint.greaterThan <= 0) {
                                        lengthConstraint.greaterThan = 1
                                    }
                                    if (!numericalityConstraint.lessThanOrEqualTo || numericalityConstraint.lessThanOrEqualTo <= 0) {
                                        lengthConstraint.lessThanOrEqualTo = 200
                                    }
                                    EditorCtrl.addValidator('numericality', numericalityConstraint);
                                }
                            });

                            function showValidationEditor(type) {
                                return EditorCtrl.showValidationEditor(type)
                                    .then(function(constraint) {
                                        _addValidatorConstraint(constraint);
                                    });
                            }

                           

                            function selectAndAddValidations($event) {
                                var validators = EditorCtrl.formField.getAvailableValidators(false);
                                var selectOptions = [];
                                if (validators.numericality) {
                                    selectOptions.push({
                                        text: "Range",
                                        value: 'numericality'
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

                             function _addValidatorConstraint(constraint) {

                                if (constraint) {
                                    if ((constraint.greaterThan > constraint.lessThanOrEqualTo) ||
                                        (constraint.greaterThan == 0 && constraint.lessThanOrEqualTo == 0) ||
                                        (constraint.greaterThan == null && constraint.lessThanOrEqualTo == null) ||
                                        (constraint.greaterThan == constraint.lessThanOrEqualTo)) {
                                        Dialog.alert({
                                            title: "Invalid Validations",
                                            content: "Please Enter valid values for validation",
                                            ok: "Ok"
                                        });

                                    } else {
                                        EditorCtrl.addValidator('numericality', constraint);
                                    }
                                } else {
                                    Dialog.alert({
                                        title: "Invalid Validations",
                                        content: "Please Enter valid values for validation",
                                        ok: "Ok"
                                    });
                                }
                            }
                        }
                    ]
                },

                validators: {
                    numericality: {
                        onlyInteger: true,
                        greaterThan: 0,
                        lessThanOrEqualTo: 5
                    },
                    presence: false
                }
            });


    }

})();
