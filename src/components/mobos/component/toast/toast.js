/**
 * Created by sudhir on 27/4/15.
 */

;
(function () {

  angular.module('InterimComponent')
    .provider('Toast', ToastProvider);


  function ToastProvider($$interimElementProvider) {
    var activeToastContent;
    var toastProvider = $$interimElementProvider('toast');

    toastProvider.setDefaults({
      methods: ['position', 'hideDelay', 'capsule'],
      options: ['$animate', toastDefaultOptions]
    })
      .addPreset('simple', {
        argOption: 'content',
        methods: ['content', 'action', 'highlightAction', 'theme'],
        options: [function () {
          var opts = {
            template: [
              '<div class="toast" ng-class="">',
                '<span>{{ toast.content }}</span>',
              '</div>'
            ].join(''),
            controller: ['$scope', function ToastCtrl($scope) {
              var self = this;
              $scope.$watch(function () {
                return activeToastContent;
              }, function () {
                self.content = activeToastContent;
              });
              this.resolve = function () {
                //$mdToast.hide();
              };
            }],
            controllerAs: 'toast',
            bindToController: true
          };
          return opts;
        }]
      });

    return toastProvider;

    function toastDefaultOptions($animate) {
      return {
        onShow: onShow,
        onRemove: onRemove,
        tapAction: onTapAction,
        closeAction: onCloseAction,
        hideDelay: 3000,
        capsule: false
      };

      function onShow(scope, element, options) {
        activeToastContent = options.content;
        return $animate.enter(element, options.parent);
      }

      function onRemove(scope, element, options) {
        return $animate.leave(element);
      }

      function onTapAction(options) {
        
      }

      function onCloseAction(options) {
      }

    }
  }

  ToastProvider.$inject = ['$$interimElementProvider'];

})();
