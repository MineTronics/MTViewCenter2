/*
 * Login form
 *
 * @param {type} MT
 * @param {type} angular
 * @returns {MT.Plugin}
 */
define(['angular', 'vc2_core', 'core/auth/auth_module', 'text!login_form.html'], function (angular, app, authModule, loginFormTmpl) {
    'use strict';

    function LoginCtrl(pluginService, authService) {

        var vm = this;

        //User credentials
        vm.user = {
            username: '',
            password: ''
        };

        //Feedback message about login status
        vm.message = {
            text: "",
            class: "",
            show: false
        };

        /*
         * Authenticates on Node server
         * @returns {undefined}
         */
        vm.login = function () {
            vm.message.show = false;
            authService
                .login(vm.user.username, vm.user.password)
                .then(function () {
                    vm.message.text = "AUTH.SUCCESS";
                    vm.message.class = "alert alert-success";
                    vm.message.show = true;
                    pluginService.loadPendingPlugins();
                }, function (data, status, headers, config) {
                    vm.message.text = "AUTH.FAIL";
                    vm.message.class = "alert alert-danger";
                    vm.message.show = true;
                });
        };

        /*
         * Logouts the user
         */
        vm.logout = function () {
            authService.logout();
        };
    }
    LoginCtrl.$inject = ['pluginService', 'authService'];

    function loginForm() {
        return {
            restrict: 'E',
            template: loginFormTmpl,
            controller: 'LoginCtrl',
            controllerAs: 'loginCtrl'
        };
    }

    app
        .directive('loginForm', loginForm)
        .controller('LoginCtrl', LoginCtrl);

    return {
        enable: angular.noop,
        disable: angular.noop
    };
});


