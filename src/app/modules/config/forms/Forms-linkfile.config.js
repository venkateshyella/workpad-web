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
      FormServiceProvider.defineField('FileLink', {
        type: 'filelink',
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
          editor: "app/modules/form/templates/filelink-field/filelink-editor.partial.html",
          form: "app/modules/form/templates/filelink-field/filelink-form.partial.html",
          preview: "app/modules/form/templates/filelink-field/filelink-preview.partial.html"
        },
        validators: {
          presence : false
        }
      });


  }

})();