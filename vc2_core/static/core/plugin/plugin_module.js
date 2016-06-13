define(['angular', 'core/config/config_module', 'text!core/plugin/plugin_table.html'], function (angular, configModule, pluginTableTmpl) {
    'use strict';

    var pluginModuleName = 'mt.plugin';

    /**
     * Plugin API
     * @param {object} $rootScope Angular's $rootScope instance to trigger digest
     * cycle and emit events.
     * @param {object} $http Angular's $http service to check whether user has
     * access to restricted plugins.
     * @param {object[]} PLUGINS Array of available plugins defined in config
     * module
     * @param {object} $q Angular's $q service to propagate promises errors when
     * @returns {object} factory
     */
    function pluginService($rootScope, $http, PLUGINS, $q) {
        var self = {
            //Layout containers
            header: {},
            tabs: {},
            footer: {},

            //Angular $injector service
            $injector: undefined
        };

        /**
         * Adds (removes) plugin's UI components to layout containers.
         * @param {object} plugin Plugin
         * @returns {undefined}
         */
        function togglePluginComponents(plugin) {
            if (plugin.enabled) {
                if (plugin.header) {
                    self.header[plugin.title] = plugin.header;
                }
                if (plugin.footer) {
                    self.footer[plugin.title] = plugin.footer;
                }
                if (plugin.tab) {
                    self.tabs[plugin.title] = plugin.tab;
                }
            } else {
                delete self.header[plugin.title];
                delete self.tabs[plugin.title];
                delete self.footer[plugin.title];
            }
        }

        /**
         * Setter for the angular's $injector instance
         * @param {type} $injector
         * @returns {undefined}
         */
        self.setInjector = function ($injector) {
            self.$injector = $injector;
        };

        /**
         * Explicitly added plugins table tab
         */
        self.tabs.pluginsTableTab = {
            title: 'PLUGINS',
            active: true,
            content: '<mt-plugin-table></mt-plugin-table>'
        };

        /**
         * Returns true if the plugin might be restricted becuase of it's 
         * module location path or false otherwise.
         * @param {object} plugin Plugin
         * @returns {Boolean} 
         */
        function isPrivate(plugin) {
            return plugin.modulePath.indexOf('mtjs/') > -1;
        }

        /**
         * Returns true if the plugin might be public because of it's module
         * location path or false otherwise.
         * @param {type} plugin Plugin
         * @returns {Boolean}
         */
        function isPublic(plugin) {
            return !isPrivate(plugin);
        }

        /**
         * Returns true if plugin should be enabled automatically on aplication 
         * start.
         * @param {object} plugin Plugin
         * @returns {Boolean}
         */
        function isAutostart(plugin) {
            return !!plugin.autostart;
        }

        /**
         * Returns promise about user logged state
         * @returns {object} Promise
         */
        function isLoggedIn() {
            var promise = $http
                .get('/loggedin')
                .then(function (user) {
                    return user.data !== '0' ? user.data : $q.reject('user not authenticated');
                }, function (err) {
                    return $q.reject(err);
                });

            return promise;
        }

        /**
         * Handles requirejs error when plugin can't be enabled. Calls requirejs
         * undefine() method to allow re-try.
         * @param {object} plugin Plugin which enabling request failed
         * @param {type} err Reason of failed request
         * @returns {undefined}
         */
        function handlePluginEnableError(plugin, err) {
            var errMsg = 'Could not enable plugin: ' + plugin.modulePath + ' Error: ' + err;
            console.error(errMsg);
            $rootScope.$emit('mt.pluginLoadError', errMsg);
            require.undef(plugin.modulePath);
            plugin.enabled = false;
        }

        /**
         * Enables plugin by downloading it's source, calling it's enable
         * method and finally adding it's layout components to layout containers. 
         * Process of downloading and evaluating javascript file is delegated to 
         * requirejs. 
         * @param {object} plugin Plugin
         * @returns {undefined}
         */
        function enablePlugin(plugin) {
            require([plugin.modulePath], function (pluginApi) {
                pluginApi = pluginApi || {};
                plugin.pluginApi = pluginApi;
                if (angular.isFunction(pluginApi.enable)) {
                    pluginApi.enable(self.$injector);
                }
                plugin.enabled = true;
                $rootScope.$apply(function () {
                    togglePluginComponents(plugin);
                    $rootScope.$emit('mt.pluginLoaded', plugin.modulePath);
                });
                console.log('Enabled plugin ' + plugin.modulePath);
            }, function (err) {
                handlePluginEnableError(plugin, err);
            });
        }

        /**
         * Disables plugin by calling it's disable method and removing it's 
         * layout components from layout containers.
         * @param {object} plugin Plugin
         * @returns {undefined}
         */
        function disablePlugin(plugin) {
            if (plugin.pluginApi && angular.isFunction(plugin.pluginApi.disable)) {
                plugin.pluginApi.disable(self.$injector);
            }
            togglePluginComponents(plugin);
            delete plugin.pluginApi;
        }

        /**
         * Enables or disables plugin based on 'enabled' plugin's property.
         * @param {object} plugin
         * @returns {undefined}
         */
        self.togglePlugin = function (plugin) {
            if (plugin.enabled) {
                if (isPrivate(plugin)) {
                    isLoggedIn()
                        .then(function () {
                            enablePlugin(plugin);
                        }, function (err) {
                            handlePluginEnableError(plugin, err);
                        });
                } else {
                    enablePlugin(plugin);
                }
            } else {
                disablePlugin(plugin);
            }
        };

        /**
         * Disables plugin with given name.
         * @param {string} pluginName Name of the plugin to be disabled
         * @returns {undefined}
         */
        self.disablePluginByName = function (pluginName) {
            PLUGINS.forEach(function (plugin) {
                if (plugin.title === pluginName && plugin.enabled) {
                    disablePlugin(plugin);
                }
            });
        };

        /**
         * Loads plugins which are set to be autostarted, but they haven't been
         * enabled yet, like in case when user was not logged in and they have
         * restricted access.
         * @returns {undefined}
         */
        self.loadPendingPlugins = function () {
            PLUGINS
                .filter(function (plugin) {
                    return plugin.autostart && !plugin.enabled;
                })
                .forEach(enablePlugin);
        };

        /**
         * Automatically enables plugins on application start
         * 
         * @param {object[]} pluginList Array of plugins
         * @returns {undefined}
         */
        function autostartPlugins(pluginList) {
            var publicList;
            if (pluginList.some(isPrivate)) {
                isLoggedIn()
                    .then(function () {
                        var filteredPluginList = pluginList.filter(isAutostart);
                        $rootScope.$emit('mt.loadingPlugins', filteredPluginList.length);
                        filteredPluginList.forEach(enablePlugin);
                    }, function () {
                        var filteredPluginList = pluginList
                            .filter(isPublic)
                            .filter(isAutostart);
                        $rootScope.$emit('mt.loadingPlugins', filteredPluginList.length);
                        filteredPluginList.forEach(enablePlugin);
                    });
            } else {
                publicList = pluginList.filter(isAutostart);
                $rootScope.$emit('mt.loadingPlugins', publicList.length);
                publicList.forEach(enablePlugin);
            }
        }

        /**
         * Activates plugins API
         * @param {type} $injector
         * @returns {undefined}
         */
        self.activate = function ($injector) {
            self.setInjector($injector);
            autostartPlugins(PLUGINS);
        };

        return self;
    }
    pluginService.$inject = ['$rootScope', '$http', 'PLUGINS', '$q'];

    function mtTabCtrl(pluginService) {
        var vm = this,
            previous;
        vm.tabs = pluginService.tabs;
        vm.header = pluginService.header;
        vm.footer = pluginService.footer;

        vm.setFullscreen = false;
        vm.onTabSelect = function () {
            Object.keys(vm.tabs).some(function (tabKey) {
                var tab = vm.tabs[tabKey];
                if (tab.active && tab !== previous) {
                    previous = tab;
                    vm.setFullscreen = !!tab.fullscreen;
                    return true;
                }
            });
        };
    }
    mtTabCtrl.$inject = ['pluginService'];

    function mtPluginTabCtrl(pluginService, PLUGINS) {
        var vm = this;
        vm.plugins = PLUGINS;
        vm.toggle = function (plugin) {
            pluginService.togglePlugin(plugin);
        };
    }
    mtPluginTabCtrl.$inject = ['pluginService', 'PLUGINS'];

    function mtPluginTable() {
        return {
            restrict: 'E',
            template: pluginTableTmpl
        };
    }

    angular.module(pluginModuleName, [configModule])
        .factory('pluginService', pluginService)
        .controller('mtTabCtrl', mtTabCtrl)
        .controller('mtPluginTabCtrl', mtPluginTabCtrl)
        .directive('mtPluginTable', mtPluginTable);

    return pluginModuleName;
});