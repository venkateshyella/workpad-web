// Connect-Mock.js

(function () {

  angular.module("DL_MOCK", ['ngMockE2E'])
    .service('FakeHttpbackend', FakeHttpbackend);

  angular.module("DL_MOCK")
    .run([
      'FakeHttpbackend',
      function (FakeHttpbackend) {
        FakeHttpbackend.passThroughLocal();
        FakeHttpbackend.allowAll();
        //FakeHttpbackend.runMock();
      }])

  function FakeHttpbackend($httpBackend) {

    var mockDataStore = {};

    function passThroughLocal() {
      $httpBackend.when('GET', /app/).passThrough();
      $httpBackend.when('GET', /assets/).passThrough();
      $httpBackend.when('GET', /app_components/).passThrough();
      $httpBackend.when('GET', /components/).passThrough();
    }

    function allowAll() {
      $httpBackend.when('GET', /.*/).passThrough();
      $httpBackend.when('POST', /.*/).passThrough();
      $httpBackend.when('UPDATE', /.*/).passThrough();
      $httpBackend.when('DELETE', /.*/).passThrough();
    }

    function runMock() {
      mockLogin();
      mockUser();
      mockOrganisationList();

    }

    function mockLogin() {
      $httpBackend.whenGET(/auth\/login.ws/).respond(function (method, url, data) {
        mockDataStore.login = {};
        var userEntity = {
          "userEmail": "reej.m@mobiquest.net",
          "userFirstName": "Reej",
          "userLastName": "M",
          "contactNumber1": "0987654321",
          "contactNumber2": null,
          "contactNumber3": null,
          "dateOfBirth": 0,
          "fullImgId": 1,
          "iconImgId": 0,
          "userSessionId": null,
          "id": 3
        }

        var resp = prepareSuccessResponse(
          {
            sessionId: "asdasds",
            userEntity: userEntity
          },
          {message: "User Logged In"});
        return resp;
      });

    }

    function mockUser() {
      mockDataStore.user =  {
        "skills": [
          {
            "expertise": "skill1",
            "rating": "5",
            "skillId": 0,
            "id": 18
          },
          {
            "expertise": "skill 2",
            "rating": "2",
            "skillId": 0,
            "id": 17
          },
          {
            "expertise": "skill 3",
            "rating": "4",
            "skillId": 0,
            "id": 18
          }
        ],
        "location": [
          {
            "countryCode": "US",
            "countryName": "United States",
            "id": 1
          }
        ],
        "userEntity": {
          "userEmail": "reej.m@mobiquest.net",
          "userFirstName": "Reej",
          "userLastName": "M",
          "contactNumber1": 0987654321,
          "contactNumber2": null,
          "contactNumber3": null,
          "dateOfBirth": 0,
          "fullImgId": 1,
          "iconImgId": 0,
          "userSessionId": null,
          "id": 3
        },
        "organizationEntity": null
      }

      $httpBackend.whenGET(/user\/view.ws/).respond(function (method, url, data) {
        mockDataStore.login = {};
        var respData = mockDataStore.user;

        var resp = prepareSuccessResponse(
          respData,
          {message: "User Logged In"});
        return resp;
      });

      $httpBackend.whenPOST(/user\/update.ws/).respond(function (method, url, data) {
        try {
          var updateData = JSON.parse(data);
          mockDataStore.user = angular.copy(updateData);
          var resp = prepareSuccessResponse(mockDataStore.user, "user updated.");
          return resp;
        } catch (e) {
          var resp = prepareErrorResponse(data, "Error updating user info");
          return resp;
        }
      });
    }

    function mockOrganisation() {
      "use strict";
    }

    function mockOrganisationList() {
      "use strict";
      mockDataStore.organisations = [
        {
          "id": 2,
          orgName: "Adidas",
          userId: 0,
          desc: "Aliquam assumenda, autem blanditiis commodi consequatur delectus",
          adminId: 3,
          memberCount: 79,
          groupCount: 10
        }
      ];

      $httpBackend.whenGET(/org\/list.ws/).respond(function (method, url, data) {
        var respData = [];

        angular.forEach(mockDataStore.organisations, function(org, index) {
          respData.push({
            orgInfo: org
          });
        });
        var resp = prepareSuccessResponse(
          respData,
          {message: "OK"});
        return resp;
      })
    }

    function prepareSuccessResponse(data, options) {
      var options = options || {};
      options.message = options.message || ""
      return [200, {
        responseCode: 0,
        responseMessage: options.message,
        data: data
      }]
    }

    function prepareErrorResponse(data, options) {
      var options = options || {};
      options.message = options.message || ""
      return [200, {
        responseCode: 1,
        responseMessage: options.message,
        data: data
      }]
    }

    return {
      passThroughLocal: passThroughLocal,
      allowAll: allowAll,
      runMock: runMock
    }

  }

  FakeHttpbackend.$inject = ['$httpBackend'];

})();
