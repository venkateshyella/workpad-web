/**
 * Created by rihdus on 14/4/15.
 */

;
(function () {
  "use strict";

  angular.module('mobos.core')
    .provider('$$rhinterimElement', InterimElementProvider);

  function InterimElementProvider() {

    function createInterimElementProvider(interimFactoryName) {
      var EXPOSED_METHODS = ['onHide', 'onShow', 'onRemove'];
      var provider = {
        setDefaults: setDefauts,
        addPreset: addPreset,
        $get: ['$$interimElement', '$animate', '$sce', '$injector', factory]
      };

      var customMethods = {};
      var providerConfig = {
        presets: {}
      };

      return provider;

      function setDefauts(definition) {
        providerConfig.optionsFactory = definition.options;
        providerConfig.methods = (definition.methods || []).concat(EXPOSED_METHODS);
        return provider;
      }

      function addPreset(name, definition) {
        providerConfig.presets[name] = {
          methods: definition.methods,
          optionsFactory: definition.options,
          argOption: definition.argOption
        }
      }

      function factory($$interimElement, $animate, $sce, $injector) {
        var defaultOptions,
          defaultMethods;

        var interimElementService = new $$interimElement();

        var publicService = {
          hide: interimElementService.hide,
          cancel: interimElementService.cancel,
          show: showInterimElement
        };
        /*
         * Prepare default methods
         */
        defaultOptions = invokeFactory(providerConfig.optionsFactory);
        defaultMethods = providerConfig.methods || [];

        /*
         * Prepare preset
         */
        angular.forEach(providerConfig.presets, function (definition, name) {
          var presetDefaults = invokeFactory(definition.optionsFactory, {});
          var presetMethods = (definition.methods || []).concat(defaultMethods);

          // Every interimElement built with a preset has a field called `$type`,
          // which matches the name of the preset.
          // Eg in preset 'confirm', options.$type === 'confirm'
          angular.extend(presetDefaults, {$type: name});

          // This creates a preset class which has setter methods for every
          // method given in the `.addPreset()` function, as well as every
          // method given in the `.setDefaults()` function.
          //
          // @example
          // .setDefaults({
          //   methods: ['hasBackdrop', 'clickOutsideToClose', 'escapeToClose', 'targetEvent'],
          //   options: dialogDefaultOptions
          // })
          // .addPreset('alert', {
          //   methods: ['title', 'ok'],
          //   options: alertDialogOptions
          // })
          //
          // Set values will be passed to the options when interimElemnt.show() is called.
          function Preset(opts) {
            this._options = angular.extend({}, presetDefaults, opts);
          }

          angular.forEach(presetMethods, function (name) {
            Preset.prototype[name] = function (value) {
              this._options[name] = value;
              return this;
            };
          });

          // Create shortcut method for one-linear methods
          if (definition.argOption) {
            var methodName = 'show' + name.charAt(0).toUpperCase() + name.slice(1);
            publicService[methodName] = function (arg) {
              var config = publicService[name](arg);
              return publicService.show(config);
            };
          }

          publicService[name] = function (arg) {
            // If argOption is supplied, eg `argOption: 'content'`, then we assume
            // if the argument is not an options object then it is the `argOption` option.
            //
            // @example `$mdToast.simple('hello')` // s ets options.content to hello
            //                                     // because argOption === 'content'
            if (arguments.length && definition.argOption && !angular.isObject(arg) && !angular.isArray(arg)) {
              return (new Preset())[definition.argOption](arg);
            } else {
              return new Preset(arg);
            }
          };
        });

        function showInterimElement(opts) {
          if (opts && opts._options) opts = opts._options;
          return interimElementService.show(
            angular.extend({}, defaultOptions, opts));
        }

        function invokeFactory(factory, defaultVal) {
          var locals = {};
          locals[interimFactoryName] = publicService;
          return $injector.invoke(factory ||
            function() { return defaultVal; },
            {},
            locals);
        }

        return publicService;
      }
    }

    function InterimElementFactory($document, $rootElement, $q, $timeout, $sce, $rootScope, $animate, $mobosCompiler) {
      function InterimElementService() {
        var service;
        var stack = [];

        return service = {
          show: show,
          hide: hide,
          cancel: cancel
        };

        function show(opts) {

          /*
           * If contentHTML string is present, trust the content and overwrite opts.content
           * with the trusted content
           * */
          if(angular.isString(opts.contentHTML)) {
            opts.contentHTML = $sce.trustAsHtml(opts.contentHTML);
          }

          if (stack.length) {
            return service.cancel().then(function () {
              return show(opts);
            });
          } else {
            var interimElement = new InterimElement(opts);
            stack.push(interimElement);

            return interimElement.show().then(function() {
              return interimElement.deferred.promise;
            });
          }
        }

        function hide(response) {
          var interimElement = stack.shift();
          return interimElement && interimElement.remove().then(function () {
              interimElement.deferred.resolve(response);
            });
        }

        function cancel(response) {
          var interimElement = stack.shift();
          return interimElement && interimElement.remove().then(function () {
              interimElement.deferred.reject(response);
            });
        }

        function InterimElement(options) {
          var self;
          var hideTimeout, element, showDone, removeDone;


          options = options || {};
          options = angular.extend({
            preserveScope: false,
            scope: options.scope || $rootScope.$new(options.isolateScope),
            onShow: function (scope, element, options) {
              return $animate.enter(element, options.parent);
            },
            onRemove: function (scope, element, options) {
              // Element could be undefined if a new element is shown before
              // the old one finishes compiling.
              return element && $animate.leave(element) || $q.when();
            }
          }, options);

          return self = {
            options: options,
            deferred: $q.defer(),
            show: function () {
              var compilePromise;

              compilePromise = $mobosCompiler.compile(options);

              return showDone = compilePromise.then(function (compileData) {
                angular.extend(compileData.locals, self.options);

                element = compileData.link(options.scope);

                // Search for parent at insertion time, if not specified
                if (angular.isFunction(options.parent)) {
                  options.parent = options.parent(options.scope, element, options);
                } else if (angular.isString(options.parent)) {
                  options.parent = angular.element($document[0].querySelector(options.parent));
                }

                // If parent querySelector/getter function fails, or it's just null,
                // find a default.
                if (!(options.parent || {}).length) {
                  options.parent = $rootElement.find('body');
                  if (!options.parent.length) options.parent = $rootElement;
                }

                var ret = options.onShow(options.scope, element, options);
                return $q.when(ret)
                  .then(function () {
                    // Issue onComplete callback when the `show()` finishes
                    (options.onComplete || angular.noop)(options.scope, element, options);
                    startHideTimeout();
                  });

                function startHideTimeout() {
                  if (options.hideDelay) {
                    hideTimeout = $timeout(service.cancel, options.hideDelay);
                  }
                }

              }, function onCompileFail(reason) {
                showDone = true;
                self.deferred.reject(reason);
              });
            },

            cancelTimeout: function () {
              if (hideTimeout) {
                $timeout.cancel(hideTimeout);
                hideTimeout = undefined;
              }
            },

            remove: function () {
              self.cancelTimeout();
              return removeDone = $q.when(showDone).then(function () {
                var ret = element ? options.onRemove(options.scope, element, options) : true;
                return $q.when(ret).then(function () {
                  if (!options.preserveScope) {
                    if (options.scope) options.scope.$destroy();
                  }
                  removeDone = true;
                });
              });
            }
          }
        }

      }

      return InterimElementService;

    }

    createInterimElementProvider.$get = [
      '$document', '$rootElement', '$q', '$timeout', '$sce', '$rootScope', '$animate', '$mobosCompiler',
      InterimElementFactory];
    return createInterimElementProvider;
  }

})();
