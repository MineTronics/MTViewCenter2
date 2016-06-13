define(['text!mt_vis/scene/visSideMenu.html'], function (visSideMenuTmpl) {
    'use strict';

    /**
     * Creates a side menu for visualisation tab to hold additional controls.
     * @param {object} drawing drawingService
     * @returns {object} directive
     */
    function visSideMenu(drawing) {
        /**
         * Toggles icon for the arrow button
         * @param {type} icon
         * @returns {String}
         */
        function toggleArrowIcon(icon) {
            return icon === 'glyphicon-chevron-right' ? 'glyphicon-chevron-left' : 'glyphicon-chevron-right';
        }

        /**
         * Animates element by sliding it horizontaly
         * @param {object} element element to animate
         * @param {boolean} expand if true then element will be visible when
         * animation ends
         * @param {boolean} isRight true if this is right menu
         * @param {number} distance slide distance
         * @param {string} background background color
         * @returns {undefined}
         */
        function animate(element, expand, isRight, distance, background) {
            var animation = {};
            if (isRight) {
                animation.left = (expand ? '+=' : '-=') + distance;
            } else {
                animation.left = (expand ? '-=' : '+=') + distance;
            }
            if (background) {
                animation.backgroundColor = background;
            }
            element.animate(animation, {queue: false});
        }

        return {
            scope: {
                side: '@visSideMenu'
            },
            restrict: 'A',
            template: visSideMenuTmpl,
            link: function (scope, element, args) {
                var rightSide = scope.side === 'right' ? true : false,
                    $div = element.children('div[accordion]'),
                    $button = element.children('button'),
                    distance = $div.outerWidth();

                scope.menu = drawing.menu[scope.side];
                if (!scope.menu) {
                    console.error('There is no drawing.menu.' + scope.side + 'defined.');
                    return;
                }

                element.addClass(rightSide ? 'right' : 'left');
                scope.arrowIcon = rightSide ? "glyphicon-chevron-right" : "glyphicon-chevron-left";

                //Initialize position
                if (scope.menu.expanded) {
                    $button.css({left: rightSide ? 0 : $div.outerWidth()});
                    $div.css({left: rightSide ? $button.outerWidth() : 0});
                } else {
                    scope.arrowIcon = toggleArrowIcon(scope.arrowIcon);
                    $button.css({left: rightSide ? $div.outerWidth() : 0});
                    $div.css({left: rightSide ? ($button.outerWidth() + $div.outerWidth()) : -$div.outerWidth()});
                }

                scope.toggleArrow = function () {
                    scope.arrowIcon = toggleArrowIcon(scope.arrowIcon);
                    animate($button, scope.menu.expanded, rightSide, distance);
                    animate($div, scope.menu.expanded, rightSide, distance, '#91daff');
                    scope.menu.expanded = !scope.menu.expanded;
                };
            }
        };
    }
    visSideMenu.$inject = ['drawingService'];

    return visSideMenu;
});