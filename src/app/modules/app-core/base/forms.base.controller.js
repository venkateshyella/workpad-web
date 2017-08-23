/**
 * Created by sudhir on 27/5/15.
 */

;
(function () {
  "use strict";

  angular.module('app.base-controllers')
    .controller('FormBaseController', FormBaseController)
  ;

  function FormBaseController($scope, $q, blockUI, Lang) {
    var self = this;
    var LANG = Lang.en.data;

    self.initializeForm = initializeForm;
    self.initializeEditorToolbar = initializeEditorToolbar;

    $scope.form = $scope.form || {};
    $scope.formActivity = self.ACTIVITY_IDLE;
    $scope.formModel = $scope.formModel || {};

    function initializeEditorToolbar(toolbarName, formName) {
      $scope[toolbarName] = {
        isEnabled: false
      };
    }

    /**
     * @service for validating and submitting forms.
     *
     * @param {string} formName
     *
     * @param {object} options
     *  Options values:
     *    submitFn - for submitting form to server.
     *    validateFn - any additional validations apart for ngForm validations can be implemented here.
     *
     * @returns {FormBaseController}
     */
    function initializeForm(formName, options) {
      options = options || {};
      options.messages = options.messages || {};
      var prefill = options.prefill || {};

      self[formName] = {
        activity: self.ACTIVITY_IDLE,
        options: options,

        validate: function () {
          return validate($scope.form[formName], options);
        },
        submit: function submitFormRequest() {
          var deferred = $q.defer();
          if (options.submitFn &&
            self[formName].activity == self.ACTIVITY_IDLE) {

            if(!self[formName].validate()) {
              deferred.reject();
            }

            $scope.formActivity = self[formName].activity = self.ACTIVITY_SUBMITTING;

            blockUI.start(options.messages.inProgress || LANG.FORMS.DEFAULT.SUBMIT_IN_PROGRESS_MESSAGE);

            $q.when(options.submitFn($scope.formModel[formName]))
              .then(function (result) {

                $scope.formActivity
                  = self[formName].activity
                  = self.ACTIVITY_IDLE;
                blockUI.stop(options.messages.success || LANG.FORMS.DEFAULT.SUBMIT_SUCCESS_MESSAGE, {
                  status: 'isSuccess'
                });
                deferred.resolve(result);

              }).catch(function (error) {
                blockUI.stop(LANG.FORMS.DEFAULT.SUBMIT_ERROR_MESSAGE, {
                  subText: (error && error.respMsg) || "",
                  status: 'isError',
                  action: "Ok"
                });
                $scope.formActivity
                  = self[formName].activity
                  = self.ACTIVITY_IDLE;
                deferred.reject(error);

              }).finally(function() {
              });
          } else {
            deferred.reject();
          }
          return deferred.promise;
        }
      };

      $scope.formModel[formName] = angular.extend({}, prefill);

      return self;
    }

    function validate(formCtrl, options) {
      if (formCtrl.$valid) {
        if(options.validateFn && !options.validateFn()) {
          return false;
        } else {
          return true;
        }
      } else {
        return false;
      }
    }

    self.ACTIVITY_SUBMITTING = "_SUBMITTING";
    self.ACTIVITY_IDLE = "_IDLE";
  }

  FormBaseController.$inject = [
    '$scope', '$q', 'blockUI', 'Lang'
  ];

})
();