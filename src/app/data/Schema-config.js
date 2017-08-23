// Schema.config.js

(function () {

  var DL = angular.module("DL");

  DL.constant('NOTIFICATION', (function () {

    return {
      config: {
        name: "Notification",
        schema: {
          id: {
            type: 'string'
          },
          title: {
            type: 'string',
            nullable: false,
            maxLength: 80
          },
          desc: {
            type: 'string',
            nullable: false,
            maxLength: 256
          }
        },
        endpoint: "/noti"
      }
    }
  })());

  DL.constant('PREFERENCE', (function () {

    return {
      config: {
        name: "Preference",
        schema: {
          basePath: "Pref",
          id: {
            type: 'string'
          },
          name: {
            type: 'string',
            nullable: false,
            maxLength: 256
          },
          value_type: {
            type: 'string',
            nullable: true,
            maxLength: 256
          },
          value: {
            type: 'string',
            nullable: true,
            maxLength: 256
          }
        }
      }
    }
  })());

})();
