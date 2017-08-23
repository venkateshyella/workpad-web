/**
 * Created by sudhir on 6/1/16.
 */

angular.module('app')
	.service('UserLocationEditWorkflow', [
		'mDialog', '$q', 'DataProvider', 'Lang',
		function (Dialog, $q, DataProvider, Lang) {
			"use strict";

			var LANG = Lang.en.json
				;

			return {
				addNewLocationToProfileWorkflowRunner: function () {
					var _options = {};
					return {
						configure: function (options) {
							angular.extend(_options, options)
						},
						startWorkflow: function () {
							_startWorkflow.apply(this, arguments);
						}
					};

					function _startWorkflow(userId) {
						var deferred = $q.defer();
						var user = DataProvider.resource.User.get(userId);
						if (!user) {
							console.error('User not found');
							deferred.reject();
							return deferred.promise;
						}

						return showLocationAdderDialog();

						function showLocationAdderDialog(cityName) {
							return Dialog.show({
								templateUrl: 'app/modules/user/user-admin-workflow/template/add-user-location.dialog.tpl.html',
								 clickOutsideToClose:false,
								controller: [
									'$scope', '$timeout', '$mdDialog', 'blockUI', 'CITY', 'Lang',
									function ($scope, $timeout, $mdDialog, blockUI,
									          CITY, Lang) {
										var LANG = Lang.en.data
											;

										var autoCompleteCtrl = {
											results: null,
											filteredResults: null,
											searchText: "",
											searchStatusText: "",
											flag: {
												isTextAvailable: false,
												isSearching: false,
												didFindLocation: false
											},
											querySearch: function querySearch(searchText) {
												var deferred = $q.defer()
													;
												var query = searchText || "";

												$scope.autoCompleteCtrl.flag.isSearching = true;
												//console.info('autoCompleteCtrl.flag.isSearching:' + autoCompleteCtrl.flag.isSearching);
												CITY.fuzzyFind(query)
													.then(function (cities) {
														$scope.locations = cities;
														$scope.autoCompleteCtrl.flag.didFindLocation
															= (cities.length > 0);
														//console.log('autoCompleteCtrl.flag.didFindLocation: ',
														// autoCompleteCtrl.flag.didFindLocation);
														if (cities.length == 0) {
															$scope.autoCompleteCtrl.searchStatusText = "No matches found for " + query + ".";
														}
														deferred.resolve(cities);
													})
													.catch(function (error) {
														$scope.searchStatusText = LANG.ERROR.NETWORK_FAILURE;
														deferred.reject(error);
													})
													.finally(function () {
														$scope.autoCompleteCtrl.flag.isSearching = false;
														//console.log('autoCompleteCtrl.flag.isSearching: ', autoCompleteCtrl.flag.isSearching);
													})
												;
												return deferred.promise;
											},
											selectedItemChange: function selectedItemChange(item) {
												$scope.autoCompleteCtrl.selectedItem = item;
												$timeout(function () {
												}, 10);
											},
											searchTextChange: function searchTextChange(text) {
												$scope.userLocationObj.cityName = "" + text;
												$scope.autoCompleteCtrl.flag.isTextAvailable = (text.length > 0);
												//console.log('isTextAvailable: ', $scope.autoCompleteCtrl.flag.isTextAvailable);
											}
										};

										angular.extend($scope, {
											cancel: function () {
												$mdDialog.cancel()
											},
											hide: function () {
												$mdDialog.hide();
											},
											toggleCreateLocation: function () {
												$scope.FLAG.CREATE_NEW_LOCATION = !$scope.FLAG.CREATE_NEW_LOCATION;
											},
											FLAG: {
												CREATE_NEW_LOCATION: false
											},
											user: user,
											userLocationObj: {
												cityName: cityName || ""
											},
											form: {},
											autoCompleteCtrl: autoCompleteCtrl,
											updateUserLocation: function (locationObj) {
												if (!locationObj || !locationObj.countryEntity) {
													return $mdDialog.show($mdDialog.alert({
														content: "Please select a country and provide a name for the new city.",
														ok: LANG.BUTTON.OK
													}));
												}
												$timeout(function () {
													blockUI.start(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE);
													updateUserLocation(user, locationObj)
														.then(function (updatedUserModel) {
															blockUI.stop(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE_SUCCESS, {
																status: 'isSuccess'
															});
															$mdDialog.hide(updatedUserModel)
														})
														.catch(function (err) {
															blockUI.stop(err.respMsg, {
																status: 'isError'
															});
															console.log(err);
														})
												}, 500);
											},
											onCountrySelect: function (countryObj) {
												$scope.userLocationObj.countryEntity = countryObj;
											},
											LANG: LANG
										});

										$timeout(function () {
											$scope.focusTriggerElem = true;
										}, 500);

									}
								]
							});
						}

						function updateUserLocation(userModel, newLocation) {
							var userClone = angular.copy(userModel);
							var countryId = newLocation.countryEntity.id || newLocation.countryId;
							var cityId = newLocation.id;
							if (cityId) {
								userClone.addLocation(countryId, cityId);
							} else {
								userClone.addNewLocation(countryId, newLocation.cityName);
							}
							return DataProvider.resource.User.update(userClone.id, userClone)
						}
					}
				},
				deleteLocationsFromProfileWorkflowRunner: function () {
					var _options = {};
					return {
						configure: function (options) {
							angular.extend(_options, options)
						},
						startWorkflow: function () {
							_startWorkflow.apply(this, arguments);
						}
					};
					function _startWorkflow(userId) {
						var deferred = $q.defer();
						var LANG = Lang.en.data;
						var user = DataProvider.resource.User.get(userId);
						if (!user) {
							console.error('User not found');
							deferred.reject();
							return deferred.promise;
						}
						if (user.location == "" || user.location.length == 0) {
						
							return Dialog.alert({
								title: LANG.USER_EDIT.CONTACTS.REMOVE_LOCATIONS,
								content: LANG.USER_EDIT.MESSAGE.NO_LOCATION_AVAILABLE,
								ok: LANG.BUTTON.OK
							});
						}

						Dialog.show({
							templateUrl: 'app/modules/user/user-admin-workflow/template/remove-user-locations.dialog.tpl.html',
							 clickOutsideToClose:false,
							controller: [
								'$scope', '$timeout', '$mdDialog', 'blockUI', 'CITY', 'Lang',
								function ($scope, $timeout, $mdDialog, blockUI,
								          CITY, Lang) {
									var LANG = Lang.en.data
										, removedLocations = []
										;

									angular.extend($scope, {
										cancel: function () {
											$mdDialog.cancel()
										},
										hide: function () {
											$mdDialog.hide();
										},
										user: user,
										selectAllText: LANG.LABEL.SELECT_ALL,
										locations: angular.copy(user.location),
										form: {},
										selectedItemsCount: 0,
										selectLocationForDeletion: function (locationObj) {
											locationObj.isSelected = !locationObj.isSelected;
											updateSelection();
										},
										updateUserLocation: function (locationObj) {
											$timeout(function () {
												blockUI.start(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE);
												var newLocationList = angular.copy(
													_.filter($scope.locations, function (location) {
														return !location.isSelected
													}));
												_.each(newLocationList, function (location) {
													delete(location.isSelected);
												});
												_updateUserLocation(user, newLocationList)
													.then(function (updatedUserModel) {
														blockUI.stop(LANG.USER_EDIT.LOADING_MSGS.UPDATING_PROFILE_SUCCESS, {
															status: 'isSuccess'
														});
														$mdDialog.hide(updatedUserModel)
													})
													.catch(function (err) {
														blockUI.stop(err.respMsg, {
															status: 'isError'
														});
														console.log(err);
													})
											}, 500);
										},
										updateSelection: updateSelection,
										toggleSelectAll: toggleSelectAll,
										LANG: LANG
									});

									$timeout(function () {
										$scope.focusTriggerElem = true;
									}, 500);

									function updateSelection() {
										var selectedLocations = _.where($scope.locations, {isSelected: true});
										$scope.isAllSelected = selectedLocations.length == $scope.locations.length;
										if (selectedLocations.length > 1) {

										}
										$scope.selectedItemsCount = selectedLocations.length;
									}

									function toggleSelectAll(status) {
										var targetSelectStatus = false;
										if (!angular.isDefined(status)) {
											targetSelectStatus = !$scope.isAllSelected;
										} else {
											targetSelectStatus = !!status;
										}
										_.each($scope.locations, function (location) {
											location.isSelected = targetSelectStatus;
										});
										updateSelection();
									}

								}
							]
						});

						return deferred.promise;

						function _updateUserLocation(userModel, newLocationList) {
							var userClone = angular.copy(userModel);
							userClone.location = newLocationList;
							return DataProvider.resource.User.update(userClone.id, userClone)
						}
					}
				}
			}
		}
	]);