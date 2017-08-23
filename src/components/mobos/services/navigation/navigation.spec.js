'use strict';

describe('Navigator:', function () {
  var State,
    stateProvider;

  beforeEach(module('Navigator'));

  beforeEach(module(function ($stateProvider) {
    stateProvider = $stateProvider;

    stateProvider
      .state('new_first_state', {
        url: "1st_url"
      })
      .state('new_second_state', {
        url: "2nd_url"
      })
      .state('1', {url: "1st_url"})
      .state('2', {url: "2nd_url"})
      .state('3', {url: "3rd_url"})
      .state('4', {url: "4th_url"})
      .state('5', {url: "5th_url"})


  }));

  beforeEach(inject(function (_State_) {
    State = _State_;
  }));

  describe("State service", function () {

    it('should be defined.', function () {
      expect(State).toEqual(jasmine.any(Object));
    });

    it('should provide the navigation and state functions.', function () {
      ['getStack', 'transitionTo', 'resetTransitionTo', 'transitionBack', 'prev', 'curr']
        .forEach(function (methodName) {
          expect(State[methodName]).toEqual(jasmine.any(Function));
        });
    });

    describe("transitionTo:", function () {
      var state,
        rootScope,
        scope;

      beforeEach(inject(function (_$state_, _$rootScope_) {
        state = _$state_;
        rootScope = _$rootScope_;
        scope = _$rootScope_.$new();
      }));

      it('should navigate to the first new state', function () {
        expect(State.getStack().length).toBe(0);

        State.transitionTo('new_first_state', 'new state params');

        rootScope.$digest();

        expect(state.current.name).toBe("new_first_state");
        expect(State.getStack().length).toBe(1);
      });


      it('should navigate to subsequent the new states', inject(function ($location, $rootScope, $window) {
        expect(State.getStack().length).toBe(0);
        State.transitionTo('new_first_state', 'new state params');
        rootScope.$digest();

        State.transitionTo('new_second_state');
        rootScope.$digest();


        expect(State.curr().toState).toBe(state.current.name);
        expect(State.getStack().length).toBe(2);

        // Previous state
        expect(State.prev().toState).toBe('new_first_state');

      }));

      it('should correctly maintain navigation stack',
        inject(function ($location, $rootScope) {
          expect(State.getStack().length).toBe(0);

          State.transitionTo('1');$rootScope.$digest();
          expect(State.getStack().length).toBe(1);


          State.transitionTo('2');$rootScope.$digest();
          expect(State.getStack().length).toBe(2);

          State.transitionBack(); $rootScope.$digest();
          expect(State.getStack().length).toBe(1);

          State.transitionTo('3');$rootScope.$digest();
          expect(State.getStack().length).toBe(2);

          State.transitionBack(); $rootScope.$digest();
          expect(State.getStack().length).toBe(1);

          State.transitionBack(); $rootScope.$digest();
          expect(State.getStack().length).toBe(1);

        }));

      xit('should correctly maintain navigation stack with regular app navigation',
        inject(function ($location, $rootScope, $window) {
          expect(State.getStack().length).toBe(0);
          state.go('1');$rootScope.$digest();

          expect(State.getStack().length).toBe(1);


          state.go('2');$rootScope.$digest();
          expect(State.getStack().length).toBe(2);
          State.transitionBack(); $rootScope.$digest();
          expect(State.getStack().length).toBe(1);

        }));

      it('should navigate back to previous states', inject(function ($location, $rootScope, $window) {
        expect(State.getStack().length).toBe(0);
        State.transitionTo('1');
        rootScope.$digest();
        State.transitionTo('2');
        rootScope.$digest();
        State.transitionTo('3');
        rootScope.$digest();

        expect(State.getStack().length).toBe(3);

        State.transitionBack();
        rootScope.$digest();

        expect(State.getStack().length).toBe(2);

        State.transitionBack();
        //State.transitionTo('1', '', {transitionForward: false});
        rootScope.$digest();
        expect(State.getStack().length).toBe(1);

      }));

    })

  });

});
