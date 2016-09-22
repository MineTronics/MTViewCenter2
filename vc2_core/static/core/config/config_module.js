define([
    'angular',
    'angular-local-storage',
    //app-config.json is created by config-loader Grunt task
    'text!core/config/app-config.json'
], function (angular, ngLocalStorage, appConfigJSON) {
    'use strict';
    var configModuleName = 'mt.config',
        appConfig = angular.fromJson(appConfigJSON),
        LANGUAGES = appConfig.languages,
        APP_DEFAULTS = appConfig.configDefaults,
        PLUGINS = appConfig.plugins,
        LOCAL_STORAGE_PREFIX = 'mt';

    PLUGINS.forEach(function (plugin) {
        plugin.enabled = false;
    });

    /**
     * Holds configuration data for application. Data is synchronized with local
     * storage.
     *
     * If browser doesn't support local storage then cookies are used instead.
     * Management of local storage is done by angular-local-storage library with
     * default type of storage set to 'localStorage' (optional sessionStorage) and
     * prefix of keys set to 'mt'.
     *
     * Brief example:
     *
     * Having injected config service as variable 'config'.
     *
     * $scope.mapinfo = config.data;
     * <input ng-model="mapinfo.defaultMap">,
     *
     *  where 'defaultMap' was created using
     *
     *  config.initEntry({
     *      defaultValue: 3123,
     *      i18n: "MAP.DEFAULT_MAP",
     *      groups: 'map'
     *  }, 'defaultMap);
     *
     *  Groups are defined using config.initGroup('map', 'MAP.GROUP');
     */
    function configFactory($rootScope, storage, APP_DEFAULTS) {
        //Private config scope used to synchronize all application data with local storage.
        var configScope = $rootScope.$new(true, $rootScope),

        //Map to store all config entries values
        //Don't set values to it directly because they will not be watched for
        //changes and kept in sync with the local storage - use the initEntry()
        //instead.
            data = {},

        //bind() deregister functions
            unsub = {};

        configScope.data = data;

        /**
         * Synchronize with browser local storage to retrieve user entry values.
         *
         * Having injected config service as variable 'config'.
         *
         * $scope.mapinfo = config.data;
         * <input ng-model="mapinfo.defaultMap">
         * @returns {undefined}
         */
        function syncWithStorage() {
            storage.keys().forEach(function (key) {
                var realKey = key.replace('data.', '');
                unsub[realKey] = storage.bind(configScope, key);
            });
        }

        /**
         * Loads default configuration for the application.
         * @returns {undefined}
         */
        function syncWithAppDefaultConfig(defaultConfig) {
            Object.keys(defaultConfig).forEach(function (key) {
                if (!unsub[key]) {
                    unsub[key] = storage.bind(configScope, 'data.' + key, defaultConfig[key]);
                }
            });
        }

        function resetKey(key) {
            if (APP_DEFAULTS.hasOwnProperty(key)) {
                data[key] = APP_DEFAULTS[key];
            } else {
                console.info('Missing default value for configuration key ' + key);
                data[key] = undefined;
            }
        }

        function reset() {
            Object.keys(data).forEach(resetKey);
        }

        function activate() {
            //Retrieve user's config from browser's local storage first
            syncWithStorage();
            //Then fill missing config values using the default provided by server
            syncWithAppDefaultConfig(APP_DEFAULTS);
        }

        activate();
        return {
            data: data,
            resetKey: resetKey,
            reset: reset,
            isLocalStorageSupported: storage.isSupported
        };
    }
    configFactory.$inject = ['$rootScope', 'localStorageService', 'APP_DEFAULTS'];

    function configureLocalStorage(localStorageServiceProvider) {
        localStorageServiceProvider
            .setPrefix(LOCAL_STORAGE_PREFIX)
            // can also be set to sessionStorage
            .setStorageType('localStorage')
            // do not send broadcast about setting or removing an item
            .setNotify(false, false);
    }
    configureLocalStorage.$inject = ['localStorageServiceProvider'];

    angular
        .module(configModuleName, ['LocalStorageModule'])
        .constant('LANGUAGES', LANGUAGES)
        .constant('APP_DEFAULTS', APP_DEFAULTS)
        .constant('PLUGINS', PLUGINS)
        .config(configureLocalStorage)
        .factory('config', configFactory);

    return configModuleName;
});
