;
(function () {

	angular.module('app')
		.controller('UserProfileEditViewController', UserProfileEditViewController)
		.controller('LocationFinderController',
			['$scope', '$rootScope', '$q', '$timeout', 'mDialog', 'Connect', 'Session', 'URL', 'Lang',
				LocationFinderController])
		.controller('CountryFinderController',
			['$scope', '$rootScope', '$q', '$timeout', 'mDialog', 'Connect', 'Session', 'URL', 'Lang',
				CountryFinderController])
		.controller('SkillFinderController',
			['$scope', '$q', '$timeout', 'mDialog', 'Connect', 'Session', 'URL', 'Lang',
				SkillFinderController])
	;

	function UserProfileEditViewController($scope, $q, $timeout, $stateParams,
	                                       Session, $http, blockUI,
	                                       $cordovaCamera, Connect, DataProvider,
	                                       State, Dialog, ImagePicker,
	                                       URL, Lang) {
		var TAG = "UserEditController";
		var LANG = Lang.en.data;
		var self = this;

		/*    $scope.$on('newSkillAdd', function (event, args) {
		 $scope.newSkillName = args.skill;
		 });*/


		function submitUserProfileData() {
			"use strict";

			var oldUserData = angular.copy(DataProvider.resource.User.get($scope.user.id));

			DataProvider.resource.User.inject($scope.user);

			if (!$scope.form.userForm.$valid) {
				//$scope.dialogAlert('Update profile', "There are some errors in the profile form.");
				//$scope.appProgressBlocker.stop();
				return;
			}
			//$scope.appProgressBlocker.start("Updating user profile");
			$scope.form.isDisabled = true;
			//var updateProgressDialog = Dialog.progress({content: "Updating.."});
			//Dialog.show(updateProgressDialog);
			//$timeout(function() {
			//  updateProgressDialog._options.content = "Updating Images..";
			//}, 1000);

			$scope.appProgressBlocker.start("Updating");

			updateCoverImage()
				.then(updateProfileImage)
				.then(updateUserProfile)
				.then(function onUpdateSuccess() {
					$scope.form.isDisabled = false;
					$scope.viewScope.toggleEditToolbar = false;
					$scope.appProgressBlocker.stop("Profile update successfully");
					refreshScope({clearCache: true});

					//user_firstName
					document.activeElement.blur();
				})
				.catch(function onUpdateError(error) {
					$scope.form.isDisabled = false;
					$scope.viewScope.toggleEditToolbar = true;
					$scope.appProgressBlocker.stop(error.respMsg);
				})
			;

			function updateUserProfile() {
				var deferred = $q.defer();
				if ($scope.form.userForm.$dirty) {

					if (!$scope.form.userForm.$valid) {
						deferred.reject();
						return deferred.promise;
					} else {
						submit();
					}

				} else {
					deferred.resolve();
				}

				return deferred.promise;

				function submit() {
					"use strict";
					DataProvider.resource.User.update($scope.user.id,
						$scope.user).then(function (result) {
						$scope.form.userForm.$setPristine();
						deferred.resolve(result);
					}, function onUpdateFail(error) {
						deferred.reject(error);
					});
				}
			}

			function updateProfileImage() {
				var deferred = $q.defer();
				console.info("Checking user profile image");
				if (angular.isUndefined($scope.user._img_icon)) {
					$scope.user._img_icon = oldUserData._img_icon;
				}
				if (oldUserData._img_icon != $scope.user._img_icon) {
					var uploadParams = {
						entityId: $stateParams.id,
						// email: UserService.profile().userEmail,
						imgEntityType: "USER",
						imgType: "ICON"
					};

					$timeout(function () {
						Connect.upload(
							URL.UPLOAD_FILE,
							$scope.user._img_icon,
							{
								params: uploadParams
							})
							.then(function onUploadSuccess(success) {
								deferred.resolve(success);
							}, function onUploadError(error) {
								deferred.reject(error);
							});
					}, 1000);
				} else {
					// No change in profile image, continue..
					deferred.resolve();
				}
				return deferred.promise;
			}

			function updateCoverImage() {
				var deferred = $q.defer();
				console.info("Checking user cover image");
				if (angular.isUndefined($scope.user._img_full)) {
					$scope.user._img_full = oldUserData._img_full;
				}
				if (oldUserData._img_full != $scope.user._img_full) {
					var uploadParams = {
						entityId: $stateParams.id,
						imgEntityType: "USER",
						imgType: "FULL"
					};
					$timeout(function () {
						Connect.upload(
							URL.UPLOAD_FILE,
							$scope.user._img_full,
							{
								params: uploadParams
							})
							.then(function onUploadSuccess(success) {
								deferred.resolve(success);
							}, function onUploadError(error) {
								deferred.reject(error);
							});
					}, 1000);
				}
				else {
					deferred.resolve();
				}
				return deferred.promise;
			}
		}

		function discardChanges() {
			"use strict";
			$scope.form.userForm.$setPristine();
			DataProvider.resource.User.get($scope.user.id);
			refreshScope();
			$scope.viewScope.toggleEditToolbar = false;
		}

		function addSkill(skillName, skillDesc, skillRating) {
			var userId = $stateParams.id;
			if (skillName && skillName.length > 0 && $scope.form.userForm.$valid) {
				$scope.user.skills.unshift({
					expertise: skillName,
					description: skillDesc,
					rating: skillRating
				});
				$scope.form.skillListEditStatus = 'allowEdit';
				$scope.form.userForm.$setDirty();

				$scope.viewScope.toggleEditToolbar = true;

			}
		};

		function confirmAndDeleteSkill(index) {
			var confirmPromise = Dialog.showConfirm({
				title: LANG.DIALOG.DELETE_SKILL.TITLE,
				content: LANG.DIALOG.DELETE_SKILL.CONTENT,
				ok: LANG.BUTTON.OK,
				cancel: LANG.BUTTON.CANCEL,
				clickOutsideToClose: true
			});

			function onConfirmOk(res) {
				var userId = $stateParams.id;
				if (index >= 0 && index < $scope.user.skills.length) {
					$scope.user.skills.splice(index, 1);
					$scope.form.userForm.$setDirty();
					$scope.viewScope.toggleEditToolbar = true;
				}
			}

			confirmPromise.then(onConfirmOk, angular.noop);

		};

		function addLocation(newLocation) {
			if (!newLocation) return;
			var userId = $stateParams.id
				, location = {
					countryName: newLocation.countryEntity.countryName,
					countryCode: newLocation.countryEntity.countryCode,
					countryId: newLocation.countryEntity.id,
					name: newLocation.name,
					city: newLocation.name
				}
				;
			if (newLocation.id) {
				location.cityId = newLocation.id;
			}
			$scope.user.location.unshift(location);
			//$scope.user.location = _.uniq($scope.user.location, function (location) {
			//  return location.cityId;
			//});
			$scope.form.locationListEditStatus = 'allowEdit';
			$scope.form.userForm.newLocation.$setPristine();
			//DataProvider.resource.User.get(userId).location = angular.copy($scope.user.location);
			$scope.form.userForm.$setDirty();
			$scope.viewScope.toggleEditToolbar = true;
		}

		function confirmAndDeleteLocation(index) {
			Dialog.showConfirm({
				title: LANG.DIALOG.DELETE_LOCATION.TITLE,
				content: LANG.DIALOG.DELETE_LOCATION.CONTENT,
				ok: LANG.BUTTON.OK,
				cancel: LANG.BUTTON.CANCEL

			}).then(function onConfirm() {
				var userId = $stateParams.id;
				if (index >= 0 && index < $scope.user.location.length) {
					$scope.user.location.splice(index, 1);
					//DataProvider.resource.User.get(userId).location = angular.copy($scope.user.location);
					$scope.form.userForm.$setDirty();
					$scope.viewScope.toggleEditToolbar = true;
				}
			});

		}

		function editProfileImage() {
			"use strict";

			ImagePicker.grabNewImage({
				targetWidth: 1024,
				targetHeight: 1024
			}).then(function (imageUri) {
				console.log(imageUri);
				$scope.user._img_icon = imageUri;
				$scope.viewScope.toggleEditToolbar = true;
			});
		}

		function editProfileCoverImage() {
			"use strict";

			ImagePicker.grabNewImage({
				targetWidth: 1536,
				targetHeight: 768
			}).then(function (imageUri) {
				console.log(imageUri);
				$scope.user._img_full = imageUri;
				$scope.viewScope.toggleEditToolbar = true;
			});
		}

		function loadLocations(cityName) {
			"use strict";
			var deferred = $q.defer();
			if ($scope.locations) {
				$timeout(function () {
					deferred.resolve();
				}, 10);
			} else {
				Connect.get(URL.CITY_LIST, {
					cityName: cityName
				}).then(function (resp) {
					var cities = resp.results;
					$scope.locations = cities;
					console.log(cities);

					deferred.resolve($scope.locations);
				});
			}
			return deferred.promise;
		}

		function refreshData() {
			var userId = $stateParams.id;
			if (userId) {
				return DataProvider.resource.User.find(userId)
			} else {
				return null;
			}
		}

		function refreshScope(options) {
			var options = options || {}
			var userId = $stateParams.id;
			if (!userId) {
				return;
			}
			if (options.clearCache || !DataProvider.resource.User.get(userId)) {
				blockUI.start(LANG.USER_EDIT.LOADING_MSGS.LOADING);
				refreshData().then(
					function onRefreshSuccess() {
						DataProvider.resource.User.get(userId).refreshImageHash();
						//console.log(DataProvider.resource.User.get(userId)._img_full);
						//console.log(DataProvider.resource.User.get(userId)._img_icon);
						//console.log("refresh scope..");
						$timeout(function () {
							"use strict";
							$scope.user = angular.copy(DataProvider.resource.User.get(userId));
						}, 0);
						blockUI.stop();
					})
					.catch(function (err) {
						"use strict";
						blockUI.stop(err.errMsg, {
							status: "isError",
							action: "Ok"
						})
					})
				;
			} else {
				console.log("refresh scope..")
				$scope.user = angular.copy(DataProvider.resource.User.get(userId));
			}
		}

		function addNewPhoneNumber() {
			"use strict";
			$scope.user.addNewPhoneNumber("");
			$scope.form.userForm.$setDirty();
			$scope.viewScope.toggleEditToolbar = true;
		}

		function addNewEmail() {
			"use strict";
			$scope.user.addNewEmail("");
			$scope.form.userForm.$setDirty();
			$scope.viewScope.toggleEditToolbar = true;
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

		function run() {
			var userId = $stateParams.id;
			if (!userId) {
				return;
			}
			$scope.viewScope = {
				toggleEditToolbar: false
			};
			$scope.title = "Edit Profile";
			refreshScope();

			$scope.form = {
				skillListEditStatus: 'allowEdit',
				locationListEditStatus: 'allowEdit',
				newLocation: "Alibaba",
				isDisabled: false
			};

			$scope.discardChanges = discardChanges;
			$scope.submitUserProfileData = submitUserProfileData;
			$scope.editProfileImage = editProfileImage;
			$scope.editProfileCoverImage = editProfileCoverImage;

			$scope.addSkill = addSkill;
			$scope.confirmAndDeleteSkill = confirmAndDeleteSkill;

			$scope.addNewPhoneNumber = addNewPhoneNumber;
			$scope.delPhoneNumber = delPhoneNumber;

			$scope.addNewEmail = addNewEmail;
			$scope.delNewEmail = delNewEmail;

			$scope.loadLocations = loadLocations;
			$scope.addLocation = addLocation;
			$scope.confirmAndDeleteLocation = confirmAndDeleteLocation;
			$scope.newSkillName = "";
			$scope.isDisabled = true;

			$scope.onUserModelFormChange = function (form) {
				if (form.$dirty) {
					$scope.viewScope.toggleEditToolbar = true;
				} else {
					$scope.viewScope.toggleEditToolbar = false;
				}
			}
		}

		$scope.userSessionId = Session.id;

		run();
	}

	UserProfileEditViewController.$inject = [
		'$scope', '$q', '$timeout', '$stateParams',
		'Session', '$http', 'blockUI',
		'$cordovaCamera', 'Connect',
		'DataProvider', 'State', 'mDialog', 'ImagePicker',
		'URL', 'Lang'];

	function LocationFinderController($scope, $rootScope, $q, $timeout, Dialog, Connect, Session, URL, Lang) {
		"use strict";
		var LANG = Lang.en.data;
		var self = this;
		self.results = null;
		self.filteredResults = null;
		self.simulateQuery = false;
		self.isDisabled = false;

		self.querySearch = querySearch;
		self.selectedItemChange = selectedItemChange;
		self.searchTextChange = searchTextChange;

		self.fuseOptions = {
			keys: ['countryName'],   // keys to search in
			threshold: 0.3,
			maxPatternLength: 20
		};
		self.fuseFinder = null;

		self.searchText = "";

		$scope.searchStatusText = "";

		$scope.LANG = LANG.USER_EDIT;

		$scope.createAndAddNewLocation = createAndAddNewLocation;
		$scope.createAddLocation = createAddLocation;

		function querySearch(searchText) {
			var deferred;
			var query = searchText || "";
			if (self.results) {
				return prepareQueryResults(query);
			} else {
				deferred = $q.defer();
				Connect.get(URL.CITY_LIST, {
						cityName: query
					})
					.then(function (resp) {
						if (resp.responseCode != 0) {
							// Connection Error
							$scope.locations = [];
							$scope.searchStatusText = resp.respMsg;
						} else {
							var cities = resp.resp.results;
							$scope.locations = cities;
							$scope.searchStatusText = "No matches found for " + query + ".";
						}
						if ($scope.searchStatusText.indexOf("No matches found") >= 0) {
							$scope.isDisabled = false;
						}
						deferred.resolve($scope.locations);
					})
					.catch(function (error) {
						$scope.searchStatusText = LANG.ERROR.NETWORK_FAILURE;
						deferred.reject(error);
					});
				return deferred.promise;
			}
		}

		function createAndAddNewLocation(intent) {
			"use strict";
			var cityName = intent.newCityName;
			$q.when(createNewLocation())
				.then(function (res) {
					console.log("New city " + cityName + " created.")
					self.searchText = "";
				})
				.catch(function (error) {
				})
			;
		}

		function createNewLocation(cityName, countryCode) {
			"use strict";
			return Dialog.showConfirm({
				title: "New Location",
				ok: "Create",
				cancel: "Cancel"
			})
		}

		function prepareQueryResults(queryStr) {
			if (queryStr && queryStr.length > 0) {
				try {
					self.filteredResults = self.fuseFinder.search(queryStr);
					return self.filteredResults;
				} catch (e) {
					return self.results;
				}
			} else {
				return self.results;
			}
		}

		function searchTextChange($model, text) {
			//console.info('Text changed to ' + text);
			if (text.length < 1) {
				$scope.isDisabled = true;
			}
		}

		function selectedItemChange(item) {
			self.selectedItem = item;

			//$model.$setValidity('required', angular.isDefined(item) ? true : false);
			$scope.form.newLocation = item;
			$timeout(function () {
				self.searchText = $scope.searchText = "";
			}, 200);
			//console.info('Item changed to ' + JSON.stringify(item));
		}

		function createAddLocation(locationName) {
			var deferred = $q.defer();
			var options = options || {};
			self.searchText = $scope.searchText = "";

			Dialog.show({
					templateUrl: 'app/modules/user/profile/templates/newlocation-create.dialog.tpl.html',
					controller: ['$scope', '$mdDialog', '$controller', 'Lang', function ($scope, $mdDialog, $controller) {
						var self = this, createLocationRequestObj;

						$scope.cancel = $mdDialog.cancel;
						$rootScope.isActionsEnabled = true;

						angular.extend(self, $controller('FormBaseController', {$scope: $scope}));
						$scope.formModel.create_newLocation = {cityname: locationName};
						$scope.submit = function submit() {
							var locationData = $scope.formModel.create_newLocation;
							createLocationRequestObj = {
								id: "",
								name: locationData.cityname,
								countryEntity: locationData.searchCountry
							}
							$mdDialog.hide(createLocationRequestObj);
						};
						$timeout(function () {
							$mdDialog.hide();
						}, 1740000);
					}],
					$event: options.$event
				})
				.then(function (newLocation) {
					if (newLocation) {
						$scope.addLocation(newLocation);
					}
					deferred.resolve();
				});
			return deferred.promise;
		}
	}

	function CountryFinderController($scope, $rootScope, $q, $timeout, Dialog, Connect, Session, URL, Lang) {
		"use strict";
		var LANG = Lang.en.data;
		var self = this;
		self.results = null;
		self.filteredResults = null;
		self.simulateQuery = false;
		self.isDisabled = false;

		self.querySearch = querySearch;
		self.selectedItemChange = selectedItemChange;
		self.searchTextChange = searchTextChange;

		self.fuseOptions = {
			keys: ['countryName'],   // keys to search in
			threshold: 0.3,
			maxPatternLength: 20
		};
		self.fuseFinder = null;

		self.searchText = "";

		$scope.searchStatusText = "";

		$scope.LANG = LANG.USER_EDIT;

		function querySearch(searchText) {
			var deferred;
			var query = searchText || "";
			if (self.results) {
				return prepareQueryResults(query);
			} else {
				deferred = $q.defer();
				Connect.get(URL.COUNTRY_LIST, {})
					.then(function (resp) {
						if (resp.responseCode != 0) {
							// Connection Error
							$scope.countries = [];
							$scope.searchStatusText = resp.respMsg;
						} else {
							var countries = resp.resp;
							$scope.countries = countries;
							$scope.searchStatusText = "No matches found for " + query + ".";
						}
						var results = createFilterFor(query);
						$rootScope.isActionsEnabled = false;
						deferred.resolve(results);
					})
					.catch(function (error) {
						$scope.searchStatusText = LANG.ERROR.NETWORK_FAILURE;
						deferred.reject(error);
					});

				return deferred.promise;
			}
		}

		function createFilterFor(query) {
			var data = [];
			for (var i = 0; i < $scope.countries.length; i++) {
				var countries = $scope.countries[i];
				if (countries.countryName.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
					data.push(countries);
				}
			}
			return data;
		}

		function prepareQueryResults(queryStr) {
			if (queryStr && queryStr.length > 0) {
				try {
					self.filteredResults = self.fuseFinder.search(queryStr);
					return self.filteredResults;
				} catch (e) {
					return self.results;
				}
			} else {
				return self.results;
			}
		}

		function searchTextChange($model, text) {
			//console.info('Text changed to ' + JSON.stringify($model));
			if (text.length < 1) {
				$rootScope.isActionsEnabled = true;
			}
		}

		function selectedItemChange(item) {
			self.selectedItem = item;
			$scope.form.create_newLocation = item;
		}
	}

	function SkillFinderController($scope, $q, $timeout, Dialog, Connect, Session, URL, Lang) {
		"use strict";
		var LANG = Lang.en.data;
		var self = this;
		self.results = null;
		$scope.isDisabled = true;

		self.querySearch = querySearch;
		self.selectedItemChange = selectedItemChange;
		self.searchTextChange = searchTextChange;

		self.fuseOptions = {
			keys: ['name'],   // keys to search in
			threshold: 0.3,
			maxPatternLength: 20
		};

		self.fuseFinder = null;
		self.searchText = "";
		$scope.searchStatusText = "";
		$scope.LANG = LANG.USER_EDIT;

		$scope.createAddSkill = createAddSkill;

		function querySearch(searchText) {
			var deferred;
			var query = searchText || "";
			if (query) {
				deferred = $q.defer();
				Connect.get(URL.ADDSKILL, {
						name: query
					})
					.then(function (resp) {
						if (resp.responseCode != 0) {
							// Connection Error
							$scope.addSkills = [];
							$scope.searchStatusText = resp.respMsg;
						} else {
							var skills = resp.resp;
							$scope.addSkills = skills;
							$scope.searchStatusText = "No matches found for " + query + ".";
						}
						if ($scope.searchStatusText.indexOf("No matches found") >= 0) {
							$scope.isDisabled = false;
						}
						//$scope.$emit('newSkillAdd', {skill :query});
						deferred.resolve($scope.addSkills);
					})
					.catch(function (error) {
						$scope.searchStatusText = LANG.ERROR.NETWORK_FAILURE;
						deferred.reject(error);
					});
				return deferred.promise;
			}
		}

		function searchTextChange($model, text) {
			//console.info('Text changed to ' + text);
			if (text.length < 1) {
				$scope.isDisabled = true;
			}
		}

		function selectedItemChange(item) {
			self.selectedItem = item;
			$scope.form.create_newskill = item;
			//console.info('Item changed to ' + JSON.stringify(item));
			// $scope.$emit('newSkillAdd', {skill :item.name});
		}

		function createAddSkill(skillName) {
			var deferred = $q.defer();
			var options = options || {};

			Dialog.show({
					templateUrl: 'app/modules/user/profile/templates/newskill-create.dialog.tpl.html',
					controller: ['$scope', '$mdDialog', '$controller', 'Lang', function ($scope, $mdDialog, $controller) {
						var self = this;
						$scope.cancel = $mdDialog.cancel;
						angular.extend(self, $controller('FormBaseController', {$scope: $scope}));

						$scope.formModel.create_newskill = {newSkillName: skillName};

						$scope.submit = function submit() {
							var skillData = $scope.formModel.create_newskill;
							$mdDialog.hide(skillData);
						};
						$timeout(function () {
							$mdDialog.hide();
						}, 1740000);
					}],
					$event: options.$event
				})
				.then(function (skillData) {
					if (skillData.newSkillName) {
						$scope.addSkill(skillData.newSkillName, skillData.newSkillDesc, skillData.newSkillRating);
					}
					deferred.resolve();
				});
			return deferred.promise;
		}
	}
})();
