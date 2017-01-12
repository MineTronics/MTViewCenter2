/**
 * When used with ng-model on select element will assure that the model
 * is always an integer. See Angular API for select directive.
 */
define([], function () {
    'use strict';

    function convertToNumber() {
        return {
            require: 'ngModel',
            link: function ($scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function (val) {
                    return parseInt(val, 10);
                });
                ngModel.$formatters.push(function (val) {
                    return String(val);
                });
            }
        };
    }

    return convertToNumber;
});