/*
 * Creates means of authentication for user
 *
 * @param {type} MT
 * @param {type} angular
 * @returns {MT.Plugin}
 */
define(['angular'], function (angular) {
    'use strict';

    function authService($http, $q) {
        function isLoggedIn() {
            var promise = $http
                .get('/loggedin')
                .then(function (user) {
                    return user.data !== '0' ? user.data : $q.reject('User not authenticated');
                }, function (err) {
                    console.error('Could not check if user is logged in: ', err);
                    return $q.reject(err);
                });
            return promise;
        }

        function login(user, password) {
            return $http.post('/login', {
                username: user,
                password: password
            });
        }

        function logout() {
            return $http.post('/logout');
        }

        return {
            isLoggedIn: isLoggedIn,
            login: login,
            logout: logout
        };
    }
    authService.$inject = ['$http', '$q'];

    var authModuleName = 'mt.auth';
    angular
        .module(authModuleName, [])
        .factory('authService', authService);

    return authModuleName;
});


