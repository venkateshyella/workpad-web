/**
 * Created by sudhir on 17/4/15.
 */

'use strict'

describe('Lang: ', function() {

  var LangProvider,
    Lang;

  beforeEach(module('mobos.utils'));

  beforeEach(module(function (_LangProvider_) {
    LangProvider = _LangProvider_;
  }));

  beforeEach(inject(function(_Lang_) {
    Lang = _Lang_;
  }));

  describe('Provider', function() {
    it('should be defined', function() {
      expect(LangProvider).toBeDefined();
    });

    it('should define default config methods', function() {

      ['setDefaultLang', 'defineNewLanguage']
        .forEach(function (methodName) {
          expect(LangProvider[methodName]).toEqual(jasmine.any(Function));
        });
    });
  });


  describe('Service', function() {
    it('should be defined', function() {
      expect(Lang).toBeDefined();
    });

    it('should define default service methods', function() {

      ['loadLanguage']
        .forEach(function (methodName) {
          expect(Lang[methodName]).toBeDefined();
          expect(Lang[methodName]).toEqual(jasmine.any(Function));
        });
    });

    xit('should throw error if no languages are available', function() {
      expect(function() {
        Lang.loadLanguage('en');
      }).toThrow("NO_LANGUAGES_DEFINED");
    })

  });

});
