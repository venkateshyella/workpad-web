/**
 * Created by sudhir on 28/4/15.
 */

;
(function () {

  angular.module('Backdrop', [])
    .service('backdrop', BackdropService);

  function BackdropService($document, $rootElement, $animate) {
    var defaultOptions = {
      type: "dark"
    };
    function Backdrop(options) {
      var options = angular.extend({},defaultOptions, options);
      var el;
      var parent = getBackdropParent(options);
      var self;

      el = angular.element('<div class="backdrop"></div>');
      el.attr('type', options.type);
      return self = {
        element: el,
        parent: parent,
        show: show,
        hide: "",
        remove: function () {
          return $animate.removeClass(self.element, 'active').then(function() {
            self.element.remove();
          });
        }
      };

      function show() {
        self.element.addClass('visible');
        parent.append(self.element);
        $animate.addClass(self.element, 'active').then(function() {
        });
      }
    }

    function newBackdrop(options) {
      return new Backdrop(options);
    }

    function getBackdropParent(options) {
      var viewRoot = options.parent || $rootElement.find('body') || $rootElement;
      var parentEl = viewRoot.find('.backdrop-container');
      if(parentEl.length) {
      } else {
        parentEl = angular.element('<div class="backdrop-container"></div>');
        viewRoot.append(parentEl);
      }
      return parentEl
    }

    return {
      new: newBackdrop
    }

  }

  BackdropService.$inject = ['$document', '$rootElement', '$animate'];

})();
