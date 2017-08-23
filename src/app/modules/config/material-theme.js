/**
 * Created by sudhir on 22/5/15.
 */

angular.module('app')
  .config(function($mdThemingProvider) {

    $mdThemingProvider.definePalette('themeDarkBlue', {
      '50': '29b6f6',
      '100': '03a9f4',
      '200': '039be5',
      '300': '0288d1',
      '400': '29b6f6',
      '500': '03a9f4',
      '600': '039be5',
      '700': '285EBB',
      '800': '2F59A1',
      '900': '163E81',
      'A100': '80d8ff',
      'A200': '7BADC3',
      'A400': '00b0ff',
      'A700': '0091ea',
      'contrastDefaultColor': 'light',    // whether, by default, text (contrast)
                                          // on this palette should be dark or light
      'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
        '200', '300', '400', 'A100'],
      'contrastLightColors': undefined    // could also specify this if default was 'dark'
    });


    $mdThemingProvider.theme('default')
      .primaryPalette('themeDarkBlue', {
        'default': '700', // by default use shade 400 from the pink palette for primary intentions
        'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
        'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
        'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
      })
      // If you specify less than all of the keys, it will inherit from the
      // default shades
      .accentPalette('deep-orange', {
        'default': '400' // use shade 200 for default, and keep all other shades the same
      });
  });