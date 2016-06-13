define(['angular', 'bootstrap-ui-tpls', 'text!core/config/app-config.json',
    'angular-animate', 'core/core_module'], function (angular, ngUi, appConfig) {
    'use strict';
    var app = {},
        $injector;

    appConfig = angular.fromJson(appConfig);

    function configureLazyProviders($controllerProvider, $provide, $compileProvider, $filterProvider) {
        //Define new chainable functions, which can register providers after the
        //bootstrapping of application
        app.controller = function (name, constructor) {
            $controllerProvider.register(name, constructor);
            return this;
        };

        app.service = function (name, constructor) {
            $provide.service(name, constructor);
            return this;
        };

        app.constant = function (name, constructor) {
            $provide.constant(name, constructor);
            return this;
        };

        app.factory = function (name, factory) {
            $provide.factory(name, factory);
            return this;
        };

        app.value = function (name, value) {
            $provide.value(name, value);
            return this;
        };

        app.directive = function (name, factory) {
            $compileProvider.directive(name, factory);
            return this;
        };

        app.filter = function (name, factory) {
            $filterProvider.register(name, factory);
            return this;
        };
    }

    function moduleRun() {
        console.log('App is running. Initialized config service.');
    }
    moduleRun.$inject = ['config'];
    app = angular
        .module('editor',
            ['mt.core', 'ui.bootstrap', 'ngAnimate']
            .concat(appConfig.vendorNgModules))
        .config([
            '$controllerProvider',
            '$provide',
            '$compileProvider',
            '$filterProvider',
            configureLazyProviders])
        //The config service needs to be eagarly initialized because of possible
        //circular dependency error, caused by order of xhr calls. On the first run
        //config initialization is triggered by config tab directive. But on the second run
        //(like after refreshing a page) require call for any plugin will be done faster,
        //and they will trigger config inititalization by calling app.$injector to get
        //config.
        //
        //What happens is durring config initialization, the config tab request will
        //be done and creation of link function for config_tab directive will trigger
        //second config initialization while it hasn't finished thus calling circular
        //dependecy problem.
        //
        //To solve this I am injecting config service during run() method.
        //
        //I suspect this is result of splitting config into config service and
        //config_tab plugin, which made initialization less coupled.
        //-jk
        .run(moduleRun);

    //Start the application
    $injector = angular.bootstrap(document.getElementsByTagName('html')[0], ['editor']);

    //For convenience when plugin needs to access angular component out of
    //angular scope
    app.$injector = $injector;

    //activate method can't be called inside module.run, because on Chrome the
    //$injector instance is not available there. Works on Firefox.
    $injector.get('pluginService').activate(app.$injector);

    return app;
});