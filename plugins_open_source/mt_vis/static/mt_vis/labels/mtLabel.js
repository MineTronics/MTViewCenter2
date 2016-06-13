define(['text!mt_vis/labels/mtLabel.html'], function (mtLabelTmpl) {
    'use strict';

    var ICON_URL = '/static/img/device_icons/';

    /**
     * Directive to display a HTML label attached to a SceneJS node. Label can 
     * have a customized icon based on label's type. Label have two background 
     * colors to indicate active state (of attached node) or timeouted state.
     * Label is minimized (only icon and header are visible) by default and 
     * maximized (additional text displayed) on mouse hover. Label is draggable.
     * 
     * @param {object} labels labelsService
     * @returns {object} directive
     */
    function mtlabel(labels) {
        function getIcon(type) {
            switch (type) {
            case "WLAN":
            case "UGPS":
                return ICON_URL + "WLAN.bmp";
            case "MIC":
                return ICON_URL + "MIC.bmp";
            case "RFID":
                return ICON_URL + "RFID.bmp";
            default:
                return ICON_URL + "unindentified.bmp";
            }
        }

        return {
            restrict: "E",
            template: mtLabelTmpl,
            link: function (scope, element) {
                scope.label.inMargin = false;
                scope.label.$label = element.children(".node-label");
                scope.label.$img = scope.label.$label.children("img");
                scope.label.$img.attr("src", getIcon(scope.label.type));

                scope.label.setStyle = function (styleName) {
                    var style = labels.getStyle(styleName);
                    if (style) {
                        scope.label.$label.css({
                            backgroundColor: scope.label.active ? style.activeColour : style.colourOnTimeout,
                            fontSize: style.fontSize
                        });
                        if (style.alwaysMaximized) {
                            scope.label.$label.addClass('hovered');
                        } else {
                            if (!labels.options.maximizeAll) {
                                scope.label.$label.removeClass('hovered');
                            }
                        }
                    }
                };

                scope.$watch('label.type', scope.label.setStyle);

                scope.$watch('label.active', function (isActive) {
                    var style = labels.getStyle(scope.label.type);
                    scope.label.$label.css({backgroundColor: isActive ? style.activeColour : style.colourOnTimeout});
                });

                var startX = 0, startY = 0;

                element.on({
                    mousedown: function (event) {
                        if (event.which === 1) {
                            event.preventDefault();
                            event.stopPropagation();
                            scope.label.dragged = true;
                            startX = event.screenX - scope.label.offX;
                            startY = event.screenY - scope.label.offY;
                        }
                    },
                    mouseup: function (event) {
                        scope.label.dragged = false;
                    },
                    mousemove: function (event) {
                        if (scope.label.dragged) {
                            event.stopPropagation();
                            scope.$apply(function () {
                                scope.label.offX = event.screenX - startX;
                                scope.label.offY = event.screenY - startY;
                            });
                        }
                    },
                    mouseenter: function (event) {
                        scope.label.mouseover = true;
                    },
                    mouseleave: function (event) {
                        scope.label.mouseover = false;
                        scope.label.dragged = false;
                    }
                });
            }
        };
    }
    mtlabel.$inject = ['labelsService'];

    return mtlabel;
});