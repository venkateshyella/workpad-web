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
      FormServiceProvider.defineField('Upload', {
        type: 'upload',
        fieldData: {
          constraints: {
            label: {
              length: {
                minimum: 5, maximum: 10,
                tooShort: "should longer than %{count} characters.",
                tooLong: "Please limit the label length to %{count} characters."
              }
            },
            desc: {
              length: {
                minimum: 5, maximum: 20,
                tooShort: "should be at-least than %{count} characters.",
                tooLong: ": Please limit the field description to %{count} characters."
              }
            }
          }
        },
        tpl: {
          editor: "app/modules/form/templates/upload-field/upload-editor.partial.html",
          form: "app/modules/form/templates/upload-field/upload-form.partial.html",
          preview: "app/modules/form/templates/upload-field/upload-preview.partial.html"
        },
        validators: {
          presence : false
        }
      });


  }

})();