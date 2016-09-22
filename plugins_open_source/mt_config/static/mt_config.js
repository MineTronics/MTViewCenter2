define(['angular', 'text!config_tab.html'], function (angular, configTabTmpl) {
    'use strict';

    /**
     * Holds meta data about config entries:
     * - i18n message about config entry
     * - additional context group to which this entry belongs
     * 
     * @returns {object} factory
     */
    function configTable() {
        var rows = [
            'CONFIG.MAIN_GROUP',
            {key: 'mtcenter_url', i18n: 'CONFIG.MTCENTER_URL'}
        ];

        /**
         * Inserts key to the row table. 
         * @param {type} key
         * @param {type} i18n
         * @param {type} group
         * @returns {undefined}
         */
        function addKey(key, i18n, group) {
            var newRow = {key: key, i18n: i18n},
                i = rows.indexOf(group);

            if (i >= 0) {
                do {
                    i += 1;
                } while (i < rows.length && !angular.isString(rows[i]));
                if (rows[i]) {
                    rows.splice(i, 0, newRow);
                } else {
                    rows[i] = newRow;
                }
            } else {
                rows.push(group, newRow);
            }
        }

        return {
            rows: rows,
            addKey: addKey
        };
    }

    /**
     * Allows editing config values using a form
     * @param {object} config Config service with values
     * @param {object} configTable ConfigTable service
     * @returns {undefined}
     */
    function ConfigTabCtrl(config, configTable) {
        var vm = this;
        vm.config = config.data;
        vm.rows = configTable.rows;
        vm.isLocalStorageSupported = config.isLocalStorageSupported;
        vm.reset = function () {
            config.reset();
        };

        vm.resetKey = function (key) {
            config.resetKey(key);
        };

        vm.getRowType = function (row) {
            if (angular.isString(row)) {
                return 'group';
            }
            if (angular.isObject(row)) {
                return 'entry';
            }
        };

        vm.getInputType = function (key) {
            if (typeof vm.config[key] === 'boolean' || vm.config[key] === 'true' || vm.config[key] === 'false') {
                return 'checkbox';
            }
            if (angular.isNumber(vm.config[key])) {
                return 'number';
            }
            return 'text';
        };
    }
    ConfigTabCtrl.$inject = ['config', 'configTable'];

    /**
     * Config tab directive
     * @returns {object} directive
     */
    function ConfigTab() {
        return {
            restrict: 'E',
            template: configTabTmpl
        };
    }

    angular
        .module('editor')
        .factory('configTable', configTable)
        .controller('ConfigTabCtrl', ConfigTabCtrl)
        .directive('configTab', ConfigTab);

    return {
        enable: angular.noop,
        disable: angular.noop
    };
});