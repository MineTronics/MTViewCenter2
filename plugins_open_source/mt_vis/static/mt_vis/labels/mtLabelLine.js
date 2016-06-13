define([], function () {
    'use strict';

    /**
     * Creates path for drawing SVG d attribute representing a line connecting
     * label with a node.
     * @param {object} label
     * @returns {string} path description for d attribute
     */
    function drawLine(label) {
        var width = label.$label.width() / 2,
            height = label.$label.height() / 2;
        //M 0 0 L 500 500 move to 0,0, draw line to 500,500
        return "M " + label.x +
                " " + label.y +
                " L " + (label.x + label.offX + width) +
                " " + (label.y + label.offY + height);
    }

    /**
     * Creates a line to represent a connection between a node and label attached
     * to it.
     * @returns {object} directive
     */
    function mtLabelLine() {
        return {
            restrict: 'A',
            scope: {
                label: '=mtLabelLine'
            },
            link: function (scope, element, attr) {
                scope.$watchGroup([
                    'label.x',
                    'label.y',
                    'label.offX',
                    'label.offY',
                    'label.mouseover'
                ], function () {
                    if (scope.label.inMargin) {
                        element.attr('d', drawLine(scope.label));
                    } else {
                        element.removeAttr('d');
                    }
                });
            }
        };
    }

    return mtLabelLine;
});