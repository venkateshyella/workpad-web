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
      FormServiceProvider.defineField('Checkbox', {
        type: 'checkbox',
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
           checkBoxListData:{
             count:{
               minimum:1, maximum:4,
               tooShort: "should be at-least than %{count} items.",
               tooLong: ": Please limit the field description to %{count} items."
             }

           }

          }
        },
        tpl: {
          editor: "app/modules/form/templates/checkbox-field/checkbox-editor.partial.html",
          form: "app/modules/form/templates/checkbox-field/checkbox-form.partial.html",
          preview: "app/modules/form/templates/checkbox-field/checkbox-preview.partial.html"
        },
        validators: {
          length: {
            minimum: null,
            maximum: null
          }
          
        }
      });


  }

})();