/**
 * Created by sudhir on 29/4/15.
 */

;
(function () {

  angular.module('InterimComponent')
    .provider('Popup', PopupProvider);

  function PopupProvider($$interimElementProvider) {

    var popup = $$interimElementProvider('popup');

    popup.setDefaults({
      methods: ['type', 'align', 'clickOutsideToClose'],
      options: ['popup', '$document', '$timeout', '$animate', 'backdrop', PopupDefaultOptionsFactory]
    });


    /**
     * menu
     * Show a simple options menu.
     *
     * `targetEl` is the element, with which the popup is aligned.
     */

    popup.addPreset('menu', {
      argOption: 'menuItems',
      methods: ['targetEl', 'align', 'title', 'menuItems'],
      options: ['popup', MenuFactory]
    });

    function PopupDefaultOptionsFactory(popup, $document, $timeout, $animate, backdrop) {
      var popupRoot;
      var menu_bottom_overflow_offset = 20;

      return {
        type: 'floating',
        clickOutsideToClose: true,
        align: 'right',
        onShow: onShow,
        onRemove: onRemove
      };

      function onShow(scope, element, options) {

        popupRoot = getPopupRoot(options);
        options.popupContainer = element;
        options.popup = options.popupContainer.find('.popup');

        if (!options.backdrop) options.backdrop = backdrop.new({type:'clear'});
        // Attach
        if (options.clickOutsideToClose && !options.menuOutsideClickCallback) {
          options.menuOutsideClickCallback = function (ev) {
            if (ev.target === element[0]) {
              $timeout(function() {
                ev.stopImmediatePropagation();
                popup.cancel();
              }, 100);
            }
          };
          options.popupContainer.on('touchstart', options.menuOutsideClickCallback)
        }

        options.backdrop.show();
        $document.find('body').addClass("blockScrolling");

        switch (options.type) {
          case 'floating':
            options.align = options.align || 'right';
            if (options.targetEl) {
              $timeout(function() {

                // Display the popup element after the element is rendered.
                positionPopup(options.popup, options.targetEl, options.popupContainer, options.align);
              }, 10).then(function() {
                // `state-rendering` is added in the template to prevent element form being displayed after being rendered.
                element.find('.popup').removeClass('state-rendering');
              });
            }
            break;

          default:
        }

        return $animate.enter(element, popupRoot);

        // <div class="popup-container popup-showing active">
        // </div>

        function positionPopup(element, targetElement, viewport, alignCorner) {
          //  Position popup relative to the target element.
          var targetElPosition = targetElement.getBoundingClientRect();
          var elementBounds, elementRelativePosition, viewportBounds;
          var overflowOffset = {};
          var popupPositionCss;

          var clonedViewport = angular.element($(viewport[0]).clone()[0]);
          var clonedElement = angular.element($(clonedViewport[0]).find('.popup'));

          var elemStyleString = clonedViewport.attr('style') || "";
          elemStyleString += "opacity:0;visibility:hidden;";
          clonedViewport.attr('style', elemStyleString);
          $($document[0]).find('body').append(clonedViewport);

          elementBounds = mobos.DomUtil.getTextBounds(clonedElement);
          viewportBounds = clonedViewport.getBoundingClientRect();
          elementRelativePosition = mobos.DomUtil.getElemPositionInParent(clonedElement, clonedViewport);

          $timeout(function() {
            try{
              angular.element(clonedViewport).remove();
            } catch(e) {
              if($($document[0]).find('body>.popup-container')) {
                $($document[0]).find('body>.popup-container').remove();
              }
            }
          }, 100);

          switch (alignCorner) {
            case 'right-auto':
            case 'right':
              popupPositionCss = {
                position: 'absolute',
                top: targetElPosition.top,
                right: viewportBounds.width - targetElPosition.left - targetElPosition.width
              };
              overflowOffset.right = (elementRelativePosition.left + elementBounds.width) - viewportBounds.width;
              overflowOffset.right = overflowOffset.right>0 ? overflowOffset.right : 0;
              break;

            case 'left-auto':
            case 'left':
              popupPositionCss = {
                position: 'absolute',
                top: targetElPosition.top,
                left: targetElPosition.left
              };
              break;

            default:
          }
          adjustPopupOverflowY();
          element.css(popupPositionCss);

          function adjustPopupOverflowY() {
            overflowOffset.bottom = (targetElPosition.top + elementBounds.height) - viewportBounds.height;
            overflowOffset.bottom = overflowOffset.bottom>0 ? overflowOffset.bottom : 0;

            if(overflowOffset.bottom > 0) {
              popupPositionCss.top = popupPositionCss.top - overflowOffset.bottom - menu_bottom_overflow_offset;
            }
          }
        }

        function getPopupRoot(options) {
          var viewRoot = options.parent || $($rootElement[0]).find('body') || $rootElement;
          var parentEl = $(viewRoot[0]).find('.popup-root');
          if (parentEl.length) {
          } else {
            parentEl = angular.element('<div class="popup-root"></div>');
            viewRoot.append(parentEl);
          }
          return parentEl
        }

      }

      function onRemove(scope, element, options) {
        if (options.clickOutsideToClose) options.popupContainer.off('touchstart', options.menuOutsideClickCallback);
        options.backdrop.remove();
        $($document[0]).find('body').removeClass("blockScrolling");
        return element.remove();
        //return $animate.leave(element);
      }
    }

    function MenuFactory(popup) {
      var opts = {
        templateUrl: 'components/mobos/component/menu/simpleMenu.template.html',
        controller: ['$scope', SimpleMenuController],
        controllerAs: 'optionPopup',
        bindToController: true,
        align: 'right',
        menuItems: []
      };
      return opts;

      function SimpleMenuController($scope) {

        $scope.dismiss = function () {
          popup.cancel();
        };

        $scope.$onOptionItemSelect = function (name) {
          popup.hide(name);
        };
      }
    }

    return popup;
  }

  PopupProvider.$inject = ['$$interimElementProvider']


})();
