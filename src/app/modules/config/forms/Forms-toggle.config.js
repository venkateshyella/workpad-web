/**
 * Created by sudhir on 9/10/15.
 */

;
(function () {
  "use strict";

  angular.module('app')
    .config(['FormServiceProvider',
      FormServiceConfig])
  ;

  function FormServiceConfig(FormServiceProvider) {

    var fieldTypeString =
      FormServiceProvider.defineField('Toggle', {
        type: 'toggle',
        fieldData: {
           //Field validations  will be here 
            constraints: {
            label: {
              length: {
                minimum: 5, maximum: 20,
                tooShort: "should longer than %{count} characters.",
                tooLong: "Please limit the label length to %{count} characters."
              }
            },
            desc: {
              length: {
                minimum: 5, maximum: 50,
                tooShort: "should be at-least than %{count} characters.",
                tooLong: ": Please limit the field description to %{count} characters."
              }
            },
            switchValue:{
            }

          }
        },
        tpl: {
          editor: "app/modules/form/templates/toggle-field/toggle-editor.partial.html",
          form: "app/modules/form/templates/toggle-field/toggle-form.partial.html",
          preview: "app/modules/form/templates/toggle-field/toggle-preview.partial.html"
        },
        editorConfig: {
                    controller: ['EditorCtrl', 'mDialog', '$scope', '$timeout', 'Lang',
                        function NumberEditorController(EditorCtrl, Dialog, $scope, $timeout, Lang) {
                            console.log("In Toggle ctrl"); 
                        }
                    ]
                },
        validators: { 
           presence: false
        }
      });


  }

})();