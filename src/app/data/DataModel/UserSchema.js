/**
 * Created by sudhir on 3/11/15.
 */

;
(function () {
	"use strict";

	var DL = angular.module("DL");

	DL.service('USER', [
		'Session', 'URL', '$q','$timeout','$rootScope','blockUI',
		function ( Session, URL, $q,$timeout, $rootScope,blockUI) {

			return {
				config: {
					name: "User",
					schema: {
						id: {
							type: 'string'
						},
						userName: {
							type: 'string',
							nullable: false,
							maxLength: 256
						},
						firstName: {
							type: 'string',
							nullable: false,
							maxLength: 256
						},
						lastName: {
							type: 'string',
							nullable: true,
							maxLength: 256
						}
					},
					computed: {
						_img_full_hash: ['id', function (id) {
							"use strict";
							return Math.random().toString(36).substring(7);
						}],
						_img_icon_hash: ['id', function (id) {
							"use strict";
							return Math.random().toString(36).substring(7);
						}],
						_img_full: ['id', function (id) {
							return URL.GET_PIC
								+ "?userSessionId=" + Session.id
								+ "&entityId=" + id
								+ "&imgEntityType=" + "USER"
								+ "&imgType=" + "FULL"
								+ "&hash=" + this._img_full_hash;
						}],
						_img_icon: ['id', function (id) {
							return URL.GET_PIC
								+ "?userSessionId=" + Session.id
								+ "&entityId=" + id
								+ "&imgEntityType=" + "USER"
								+ "&imgType=" + "ICON"
								+ "&hash=" + this._img_icon_hash;
						}],
						_local_createdAt: ['createTime', function (createTime) {
							return new Date(createTime);
						}],
						$_telephoneNumberList: {
							get: function () {
								return this.telNumbers;
							}
						},
						$_otherEmailList: {
							get: function () {
								return this.emails;
							}
						},
						$_canEdit: {
							get: function () {
								return Session.userId == this.id;
							}
						},
						$_fullName: {
							get: function () {
								return this.userFirstName + ' ' + this.userLastName;
							}
						}
					},
					methods: {
						refreshImageHash: function () {
							this._img_full_hash = Math.random().toString(36).substring(7);
							this._img_icon_hash = Math.random().toString(36).substring(7);

							this._img_icon = this.avatar = URL.GET_PIC
								+ "?userSessionId=" + Session.id
								+ "&entityId=" + this.id
								+ "&imgEntityType=" + "USER"
								+ "&imgType=" + "ICON"
								+ "&hash=" + this._img_icon_hash;

							this._img_full = URL.GET_PIC
								+ "?userSessionId=" + Session.id
								+ "&entityId=" + this.id
								+ "&imgEntityType=" + "USER"
								+ "&imgType=" + "FULL"
								+ "&hash=" + this._img_full_hash;
							
							if (this.id == Session.userId) {
								$rootScope.$emit('userProfilePicUpdated', this._img_icon);
							}
							
							$timeout(function () {
							blockUI.stop();
							}, 6000);
							
							return true;
						},
						/**
						 *
						 * @param {String} telNum
						 * @param {String=} telTypeString
						 */
						addNewPhoneNumber: function (telNum, telTypeString) {
							var telNumArray = this.telNumbers = this.telNumbers || [];
							telNumArray.push({
								telNum: telNum,
								telTypeString: telTypeString
							});
						},
						delPhoneNumberByIndex: function (index) {
							var telNumArray = this.telNumbers;
							if (telNumArray) {
								telNumArray.splice(index, 1);
							}
						},
						/**
						 *
						 * @param {String} emailId Email string.
						 * @param {String=} emailType Custom `type` string for the email.
						 */
						addNewEmail: function (emailId, emailType) {
							var userEmailsList = this.emails = this.emails || [];
							if (userEmailsList instanceof Array) {
								userEmailsList.push({
									emailId: emailId,
									emailTypeString: emailType
								})
							}
						},
						/**
						 * Remove a email id entry from the user model
						 * @param {Number} index Index of the email id object in the user email array.
						 */
						delEmailByIndex: function (index) {
							var userEmailsList = this.emails;
							if (userEmailsList && userEmailsList instanceof Array) {
								userEmailsList.splice(index, 1);
							}
						},
						uploadProfileImage: function (imageUri) {
							var deferred = $q.defer()
								, self = this;
							console.info("Checking user profile image");
							var uploadParams = {
								entityId: self.id,
								// email: UserService.profile().userEmail,
								imgEntityType: "USER",
								imgType: "ICON"
							};

							Connect.upload(
								URL.UPLOAD_FILE,
								imageUri,
								{
									params: uploadParams
								})
								.then(function onUploadSuccess(success) {
									$timeout(function() {
										  self.refreshImageHash();
								      }, 1000)
								      
								    deferred.resolve(success);
								}, function onUploadError(error) {
									deferred.reject(error);
								});
							return deferred.promise;
						},
						addLocation: function (countryId, cityId) {
							this.location.unshift({
								countryId: countryId,
								cityId: cityId
							})
						},
						addNewLocation: function (countryId, cityName) {
							this.location.unshift({
								countryId: countryId,
								city: cityName
							})
						}
					},
					endpoint: "/user",
					customEndpoint: {
						findAll: "/list.ws"
					},
					respAdapter: {
						find: function (resp, id, options) {
							resp.id = resp.userEntity.id;
							resp.skills = resp.skills || [];
							resp.location = resp.location || [];
							var userEntity = resp.userEntity;

							angular.forEach(resp.location, function (location, index) {
								"use strict";
								location.countryCode = (location.countryEntity.countryCode);
								location.countryName = (location.countryEntity.countryName);
							});

							angular.extend(resp, userEntity);
							return resp;
						},
						findAll: function (resp) {
							return resp.results || [];
						},
						update: function (resp) {
							resp.id = resp.userEntity.id;
							resp.skills = resp.skills || [];
							resp.location = resp.location || [];

							angular.forEach(resp.location, function (location, index) {
								"use strict";
								location.countryCode = (location.countryEntity.countryCode);
								location.countryName = (location.countryEntity.countryName);
							});

							return resp;
						},
						defaultAdapter: function (resp) {
							return resp;
						}
					},
					reqAdapter: {
						update: function (req) {
							var user = angular.copy(req);
							var userEntity = user.userEntity;
							var parsedLocation = [];
							var userPhoneNumberList = preparePhoneNumList();
							var userEmailList = prepareEmailList();
							userEntity.location = user.location;
							angular.forEach(userEntity.location, function (location, index) {
								"use strict";

								/* [Sudhir]
								 * Parse and add user location object.
								 * If city name is present, a new location is to be created.
								 */
								var updatedLocation = {
									countryId: location.countryId || location.countryEntity.id,
									cityId: location.cityId || location.id
								};
								if (location.city) {
									updatedLocation.city = location.city;
								}
								parsedLocation.push(updatedLocation);
							});
							userEntity.location = parsedLocation;
							userEntity.skills = req.skills;
							userEntity.emails = userEmailList;
							userEntity.telNumbers = userPhoneNumberList;

							return userEntity;

							function prepareEmailList() {
								var userEmailList = user.$_otherEmailList || []
									, list = []
									, emailObject
									;
								for (var i = 0; i < userEmailList.length; i++) {
									emailObject = userEmailList[i];
									if (emailObject.emailId && emailObject.emailId.length > 0) {
										list.push(emailObject);
									}
								}
								return list;
							}

							function preparePhoneNumList() {
								var userPhoneNumList = user.$_telephoneNumberList || []
									, list = []
									, phoneNumObject
									;
								for (var i = 0; i < userPhoneNumList.length; i++) {
									phoneNumObject = userPhoneNumList[i];
									if (phoneNumObject.telNum && phoneNumObject.telNum.length > 0) {
										list.push(phoneNumObject);
									}
								}
								return list;
							}
						},
						defaultAdapter: function (req) {
							return req;
						}
					}
				}
			}
		}]);

})();