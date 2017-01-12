define([
    'angular',
    'jquery',
    'jquery-ui',
    'core/common/mtdatatable',
    'core/common/mtColorPicker/mtColorHelper',
    'core/common/mtColorPicker/mtColorPicker',
    'core/common/mtFileRead',
    'core/common/localMoment',
    'core/common/convertToNumber',
    'core/common/exportToFile',
    'core/common/debounce'
], function (angular, $, $ui, mtDatatableModule, mtColorHelper, mtColorPicker, mtFileRead, localMoment, convertToNumber, exportToFile, debounce) {
    'use strict';

    function compile($compile) {
        return function (scope, element, attrs) {
            var content = scope.$eval(attrs.compile);
            element.html(content);
            $compile(element.contents())(scope);
        };
    }

    function vcheader() {
        return function (scope, element, attr) {
            $('.tab-content').before(element.detach());
        };
    }

    function vcfooter() {
        return function (scope, element, attr) {
            $('.tab-content').after(element.detach());
        };
    }

    function hideAfterBootstrap($rootScope) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                scope.loaded = 0;
                scope.expected = 0;
                scope.isError = '';
                var unlisten1, unlisten2, unlisten3;
                unlisten1 = $rootScope.$on('mt.loadingPlugins', function (event, pluginsCount) {
                    scope.expected = pluginsCount;
                    unlisten1();
                    scope.$watch('loaded', function (newVal) {
                        if (newVal === scope.expected) {
                            unlisten2();
                            setTimeout(function () {
                                element.slideUp('slow', function () {
                                    element.remove();
                                    angular.element(attr.thenShow).slideDown('slow');
                                });
                            }, 500);
                        }
                    });
                });

                unlisten2 = $rootScope.$on('mt.pluginLoaded', function (event, modulePath) {
                    scope.loaded += 1;
                });

                unlisten3 = $rootScope.$on('mt.pluginLoadError', function (event, error) {
                    scope.loaded += 1;
                    scope.isError = 'text-danger';
                });

                scope.$on('$destroy', function () {
                    unlisten1();
                    unlisten2();
                    unlisten3();
                });
            }
        };
    }
    hideAfterBootstrap.$inject = ['$rootScope'];

    function mtUtil() {
        /**
         * Stringifies data into json file.
         * @param {object} data Data to be exported as json file
         * @param {string} filename File name of the file to be exported
         * @returns {undefined}
         */
        function saveAsJson(data, filename) {
            if (!data) {
                console.error('mtUtil.saveAsJson: No data');
                return;
            }

            if (!filename) {
                filename = 'file.json';
            }

            if (typeof data === "object") {
                data = JSON.stringify(data, undefined, 4);
            }

            var blob = new Blob([data], {type: 'text/json'}),
                e    = document.createEvent('MouseEvents'),
                a    = document.createElement('a');

            a.download = filename;
            a.href = window.URL.createObjectURL(blob);
            a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':');
            e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
        }

        return {
            saveAsJson: saveAsJson
        };
    }

    angular
        .module('mt.common', [mtDatatableModule])
        .directive('compile', ['$compile', compile])
        .directive('vcheader', vcheader)
        .directive('vcfooter', vcfooter)
        .directive('hideAfterBootstrap', hideAfterBootstrap)
        .factory('mtColorHelper', mtColorHelper)
        .directive('mtColorPicker', mtColorPicker)
        .factory('mtUtil', mtUtil)
        .directive('mtFileRead', mtFileRead)
        .constant('localMoment', localMoment)
        .directive('convertToNumber', convertToNumber)
        .constant('exportToFile', exportToFile)
        .constant('debounce', debounce);

    return 'mt.common';
});