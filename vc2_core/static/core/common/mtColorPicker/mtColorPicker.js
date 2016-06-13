define([
    'angular',
    'jquery',
    'text!core/common/mtColorPicker/mtColorPicker.html',
    'jquery-ui'
], function (angular, $, mtColorPickerTmpl) {
    'use strict';

    function mtColorPicker($compile, colorHelper) {
        return {
            restrict: 'A',
            scope: {
                color: '=?mtColorPicker',
                rgb: '=?rgbColor',
                callback: '&?'
            },
            link: function (scope, element, attr) {
                var template = mtColorPickerTmpl,
                    $pickerDialog = angular.element(template),
                    $colorSet = $pickerDialog.find('.mt-color-set'),
                    $indicator = $pickerDialog.find('.mt-color-indicator');
                angular.forEach(colorHelper.HEX_COLOR_SET, function (hexColor) {
                    $colorSet.append('<span color-val="' + hexColor + '" style="background: ' + hexColor + '"></span>');
                });
                $compile($pickerDialog)(scope);

                function createDialog() {
                    $pickerDialog.dialog({
                        dialogClass: 'mt-color-picker-front',
                        autoOpen: true,
                        resizable: false,
                        width: 500,
                        buttons: {
                            Ok: function () {
                                $(this).dialog('close');
                            }
                        }
                    });
                }

                element.click(function ($event) {
                    if (angular.isDefined(scope.rgb)) {
                        scope.color = colorHelper.RGBtoHex(scope.rgb);
                    }
                    if (!/^#([A-Fa-f0-9]{6})$/.test(scope.color)) {
                        throw "Invalid color provided for color picker";
                    }
                    if (!$pickerDialog.dialog('instance')) {
                        createDialog();
                    } else {
                        $pickerDialog.dialog('open');
                    }
                });

                scope.$watch('color', function (newVal) {
                    $indicator.css('background-color', newVal);
                });

                scope.pickColor = function ($event) {
                    var newColor = $event.target.getAttribute('color-val'),
                        rgbColor;
                    if (newColor) {
                        scope.color = newColor;
                        if (scope.rgb) {
                            rgbColor = colorHelper.HexToRGB(scope.color);
                            scope.rgb.r = rgbColor.r;
                            scope.rgb.g = rgbColor.g;
                            scope.rgb.b = rgbColor.b;
                        }
                        if (angular.isFunction(scope.callback)) {
                            scope.callback();
                        }
                    }
                };
            }
        };
    }
    mtColorPicker.$inject = ['$compile', 'mtColorHelper'];

    return mtColorPicker;
});

