/**
 * Created by sudhir on 5/6/15.
 */

;(function() {

  angular.module('mobos.utils')
    .provider('Securify', Securify)
  ;

  function Securify() {

    var presetBucket = {};
    var defaults = {
      iterationCount: 10000,
      keySize: 128,
      iv: '00000000000000000000000000000000'
    };
    //var iv = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Hex);

    return {
      $get: SecurifyService,
      addNewPreset: addNewPreset
    };

    function SecurifyService() {

      return {
        encrypt: encrypt,
        decrypt: decrypt,
        encryptWithKey : encryptWithKey,
        decryptWithKey : decryptWithKey
      };

      function encrypt(value, presetName) {
        if(angular.isDefined(presetBucket[presetName])) {
          var ts = presetBucket[presetName];
          return ts.aesUtil.encrypt(ts.salt, ts.iv, ts.passPhrase, value);
        } else {
          throw "could not find any preset by the name:"+presetName
        }
      }
      
      function encryptWithKey(value, presetName, passPhrase) {
          if(angular.isDefined(presetBucket[presetName])) {
            var ts = presetBucket[presetName];
            return ts.aesUtil.encrypt(ts.salt, ts.iv, passPhrase, value);
          } else {
            throw "could not find any preset by the name:"+presetName
          }
        }

      function decrypt(value, presetName) {
        if(angular.isDefined(presetBucket[presetName])) {
          var ts = presetBucket[presetName];
          return ts.aesUtil.decrypt(ts.salt, ts.iv, ts.passPhrase, value);
        } else {
          throw "could not find any preset by the name:"+presetName
        }
      }
      
      function decryptWithKey(value, presetName, passPhrase) {
          if(angular.isDefined(presetBucket[presetName])) {
            var ts = presetBucket[presetName];
            return ts.aesUtil.decrypt(ts.salt, ts.iv, passPhrase, value);
          } else {
            throw "could not find any preset by the name:"+presetName
          }
        }
    }

    function addNewPreset(name, salt, passPhrase, config) {
      config = config || {};
      var keySize = config.keySize || defaults.keySize;
      var iterationCount = config.iterationCount || defaults.iterationCount;

      presetBucket[name] = {
        salt: salt,
        passPhrase: passPhrase,
        iv: defaults.iv,
        aesUtil: new AesUtil(keySize, iterationCount)
      }
    }
  }

  var AesUtil = function(keySize, iterationCount) {
    this.keySize = keySize / 32;
    this.iterationCount = iterationCount;

    this.generateKey = generateKey;
    this.encrypt = encrypt;
    this.decrypt = decrypt;

    function generateKey(salt, passPhrase) {
      var key = CryptoJS.PBKDF2(
        passPhrase,
        CryptoJS.enc.Hex.parse(salt),
        { keySize: this.keySize, iterations: this.iterationCount });
      return key;
    }

    function encrypt(salt, iv, passPhrase, plainText) {
      var key = this.generateKey(salt, passPhrase);
      var encrypted = CryptoJS.AES.encrypt(
        plainText,
        key,
        { iv: CryptoJS.enc.Hex.parse(iv) });
      return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
    }

    function decrypt(salt, iv, passPhrase, cipherText) {
      var key = this.generateKey(salt, passPhrase);
      var cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(cipherText)
      });
      var decrypted = CryptoJS.AES.decrypt(
        cipherParams,
        key,
        { iv: CryptoJS.enc.Hex.parse(iv) });
      return decrypted.toString(CryptoJS.enc.Utf8);
    }
  };

})();