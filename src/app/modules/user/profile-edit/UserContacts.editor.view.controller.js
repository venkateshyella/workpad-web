/**
 * Created by sudhir on 4/1/16.
 */

angular.module('app')
	.controller('UserContactsEditorViewController', [
		'$scope', '$q', '$timeout', '$stateParams', '$controller',
		'Session', '$http', 'blockUI',
		'$cordovaCamera', 'Connect',
		'DataProvider', 'State', 'mDialog', 'ImagePicker',
		'URL', 'Lang',
		function ($scope, $q, $timeout, $stateParams, $controller,
		          Session, $http, blockUI,
		          $cordovaCamera, Connect, DataProvider,
		          State, Dialog, ImagePicker) {
			"use strict";

			var userId = $stateParams.id
				, user = null
				;

			$scope.viewScope.editorViewTitle = $scope.LANG.USER_EDIT.TITLE.DELETE_CONTACTS;

			angular.extend($scope, {
				addNewPhoneNumber: addNewPhoneNumber,
				addNewEmail: addNewEmail,
				delNewEmail: delNewEmail,
				delPhoneNumber: delPhoneNumber
			});

			//angular.extend($scope.viewScope.optionsMenuItems, {
			//	addEmail: {
			//		text: $scope.LANG.USER_EDIT.CONTACTS.ADD_EMAIL,
			//		action: addNewEmail,
			//		isDisabled: false,
			//		isHidden: false
			//	},
			//	addPhoneNumber: {
			//		text: $scope.LANG.USER_EDIT.CONTACTS.ADD_TEL,
			//		action: addNewPhoneNumber,
			//		isDisabled: false,
			//		isHidden: false
			//	}
			//});

			function refresh() {
				$scope.refreshUserModel();
			}

			function triggerNewFocus() {
				$scope.viewScope.toggleEditToolbar = true;
				$timeout(function() {
					$scope.focusTriggerElem = true;
				}, 100);
				$timeout(function() {
					$scope.focusTriggerElem = false;
				}, 1000);
			}

			function addNewPhoneNumber() {
				"use strict";
				$scope.user.addNewPhoneNumber("");
				$scope.form.userForm.$setDirty();
				$scope.viewScope.toggleEditToolbar = true;
				triggerNewFocus();
			}

			function addNewEmail() {
				"use strict";
				$scope.user.addNewEmail("");
				$scope.form.userForm.$setDirty();
				triggerNewFocus();
			}

			function delNewEmail(index) {
				"use strict";
				$scope.user.delEmailByIndex(index);
				$scope.form.userForm.$setDirty();
				$scope.viewScope.toggleEditToolbar = true;
			}

			function delPhoneNumber(index) {
				"use strict";
				$scope.user.delPhoneNumberByIndex(index);
				$scope.form.userForm.$setDirty();
				$scope.viewScope.toggleEditToolbar = true;
			}

		}
	])
;