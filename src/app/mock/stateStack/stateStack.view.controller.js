/**
 * Created by rihdus on 1/5/15.
 */

;(function () {

	angular.module('app')
		.controller('StateNavigationViewController', StateNavigationViewController);

	function StateNavigationViewController($scope, State) {

		$scope.newState = newState;
		$scope.replaceState = replaceState;
		$scope.newStateName = "";
		State.waitForTransitionComplete().then(run);

		function run() {
			$scope.navStack = State.getStack();
			var currState = angular.extend({}, State.curr());
			var currStateParams = currState.toParams || {};
			$scope.stateTitle = currStateParams.name ? "State" + currStateParams.name : "State Navigation";
		}

		function newState(name, newStateName) {
			State.transitionTo(name, {name: "-" + newStateName});
			$scope.newStateName = "";
		}

		function replaceState(name, newStateName) {
			State.transitionTo(name,
				{
					name: "-" + newStateName
				},
				{
					FLAGS: {
						REPLACE_STATE: true
					}
				});
			$scope.newStateName = "";
		}

	}

	StateNavigationViewController.$inject = ['$scope', 'State'];

})();
