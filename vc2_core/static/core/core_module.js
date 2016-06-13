define([
    'angular',
    'core/config/config_module',
    'core/plugin/plugin_module',
    'core/auth/auth_module',
    'core/common/common_module',
    'core/i18n/i18n_module'
], function (angular, configModule, pluginModule, authModule, commonModule, i18nModule) {
    'use strict';
    var coreModuleName = 'mt.core';
    angular
        .module(coreModuleName, [
            configModule,
            pluginModule,
            authModule,
            commonModule,
            i18nModule
        ]);

    return coreModuleName;
});


