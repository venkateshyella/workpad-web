describe('<md-tooltip> directive', function() {

  beforeEach(module('material.components.tooltip', 'ngAnimateMock'));

  function findTooltip() {
    return angular.element(document.body).find('md-tooltip');
  }

  it('should show and hide when visible is set', inject(function($compile, $rootScope, $animate) {
    var element = $compile('<md-button>' +
               'Hello' +
               '<md-tooltip md-visible="isVisible">Tooltip</md-tooltip>' +
             '</md-button>')($rootScope);

    $rootScope.$apply();
    $animate.triggerCallbacks();

    expect(findTooltip().length).toBe(0);

    $rootScope.$apply('isVisible = true');
    $animate.triggerCallbacks();

    expect(findTooltip().length).toBe(1);
    expect(findTooltip().hasClass('md-show')).toBe(true);

    $rootScope.$apply('isVisible = false');
    $animate.triggerCallbacks();

    expect(findTooltip().length).toBe(0);
  }));

  it('should preserve parent text', inject(function($compile, $rootScope, $animate) {
    var element = $compile('<md-button>' +
               'Hello' +
               '<md-tooltip md-visible="isVisible">Tooltip</md-tooltip>' +
             '</md-button>')($rootScope);

      $rootScope.$apply('isVisible = true');
      $animate.triggerCallbacks();

    expect(element.attr('aria-label')).toBeUndefined();
  }));

  it('should label parent', inject(function($compile, $rootScope, $animate) {
    var element = $compile('<md-button>' +
               '<md-tooltip md-visible="isVisible">Tooltip</md-tooltip>' +
             '</md-button>')($rootScope);

      $rootScope.$apply('isVisible = true');
      $animate.triggerCallbacks();

    expect(element.attr('aria-label')).toEqual('Tooltip');

      $rootScope.$apply('isVisible = false');
      $animate.triggerCallbacks();

    expect(element.attr('aria-label')).toEqual('Tooltip');
  }));

  it('should set visible on mouseenter and mouseleave', inject(function($compile, $rootScope, $timeout) {
    var element = $compile('<md-button>' +
               'Hello' +
               '<md-tooltip md-visible="isVisible">Tooltip</md-tooltip>' +
             '</md-button>')($rootScope);

    $rootScope.$apply();

      element.triggerHandler('mouseenter');
      $timeout.flush();

    expect($rootScope.isVisible).toBe(true);

      element.triggerHandler('mouseleave');
      $timeout.flush();

    expect($rootScope.isVisible).toBe(false);
  }));

  it('should not set parent to items with no pointer events', inject(function($window, $compile, $rootScope, $timeout) {
    spyOn($window, 'getComputedStyle').and.callFake(function(el) {
      if (el.nodeName == 'INNER') {
        return { 'pointer-events': 'none' };
      } else {
        return { 'pointer-events': '' };
      }
    });

    var element = $compile('<outer><inner><md-tooltip md-visible="isVisible">Hello world' +
                           '</md-tooltip></inner></outer>')($rootScope);
    $rootScope.$apply();

    element.triggerHandler('mouseenter');

    expect($rootScope.isVisible).toBeUndefined();
  }));

  it('should set visible on focus and blur', inject(function($compile, $rootScope, $timeout) {
    var element = $compile('<md-button>' +
               'Hello' +
               '<md-tooltip md-visible="isVisible">Tooltip</md-tooltip>' +
             '</md-button>')($rootScope);
    $rootScope.$apply();

    element.triggerHandler('focus');
    $timeout.flush();

    expect($rootScope.isVisible).toBe(true);

    element.triggerHandler('blur');
    $timeout.flush();

    expect($rootScope.isVisible).toBe(false);
  }));

  it('should set visible on touchstart and touchend', inject(function($compile, $rootScope, $timeout) {
    var element = $compile('<md-button>' +
               'Hello' +
               '<md-tooltip md-visible="isVisible">Tooltip</md-tooltip>' +
             '</md-button>')($rootScope);

    $rootScope.$apply();

    element.triggerHandler('touchstart');
    $timeout.flush();
    expect($rootScope.isVisible).toBe(true);

    element.triggerHandler('touchend');
    $timeout.flush();
    expect($rootScope.isVisible).toBe(false);
  }));

  it('should show after tooltipDelay ms', inject(function($compile, $rootScope, $timeout, $animate) {
    var element = $compile('<md-button>' +
               'Hello' +
               '<md-tooltip md-visible="isVisible" md-delay="99">' +
                 'Tooltip' +
               '</md-tooltip>' +
             '</md-button>')($rootScope);

    $rootScope.$apply();
    $animate.triggerCallbacks();

    element.triggerHandler('focus');

    expect($rootScope.isVisible).toBeFalsy();

    // Wait 1 below delay, nothing should happen
    $timeout.flush(98);
    expect($rootScope.isVisible).toBeFalsy();

    // Total 99 == tooltipDelay
    $timeout.flush(1);
    expect($rootScope.isVisible).toBe(true);

  }));

});
