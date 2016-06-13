define(['angular'], function (angular) {
    'use strict';

    /**
     * Calculates absolute top left position of element
     * @param {DOM Node} el HTML element
     * @returns {object} Object with top and left properties representing element
     * position in pixels.
     */
    function calculateElementOffset(el) {
        var tempX = 0, tempY = 0;
        while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
            tempX += el.offsetLeft - el.scrollLeft;
            tempY += el.offsetTop - el.scrollTop;
            el = el.offsetParent;
        }
        return {
            top: tempY,
            left: tempX
        };
    }

    /**
     * Directive responsible for resizing scene and delegating mouse events to 
     * camera.
     * @param {type} camera Camera service 
     * @param {type} drawing Drawing service
     * @param {type} $window window
     * @returns {object} directive object with link function
     */
    function canvasListener(camera, drawing, $window) {
        return {
            link: function (scope, element, attr) {

                /**
                 * Updates event position by scene position
                 * @param {type} event
                 * @returns {undefined}
                 */
                function fixXY(event) {
                    event.clientX -= drawing.canvas.left;
                    event.clientY -= drawing.canvas.top;
                }

                scope.quality = 1;
                var $ = angular.element,
                    $container = $('#canvas-container'),
                    $labelsContainer = $('#labels-container'),
                    //Mouse position
                    mouseX = 0.0,
                    mouseY = 0.0,
                    //Mouse buttons state
                    dragging = false,
                    dragged = false,
                    left = false,
                    right = false;

                /**
                 * Handler for mouse wheel event which is used to control the
                 * camera zoom.
                 * @param {type} event
                 * @returns {undefined}
                 */
                function mouseWheel(event) {
                    var delta = 0;
                    if (!event) {
                        event = window.event;
                    } else {
                        event = event.originalEvent;
                    }
                    if (event.wheelDelta) {
                        delta = event.wheelDelta / 120;
                        if (window.opera) {
                            delta = -delta;
                        }
                    } else if (event.detail) {
                        delta = -event.detail / 3;
                    }
                    if (delta) {
                        camera.zoom(delta);
                    }
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    event.returnValue = false;
                }

                /**
                 * Mouse events are parsed by camera service to move the camera.
                 */
                $labelsContainer.on({
                    contextmenu: function (event) {
                        return false;
                    },
                    mousedown: function (event) {
                        fixXY(event);
                        switch (event.which) {
                        case 1:
                            left = true;
                            break;
                        case 2:
                            break;
                        case 3:
                            right = true;
                            break;
                        default:
                            console.log('Unknown mouse button pressed: ' + event.which);
                        }
                        dragging = true;
                        dragged = false;
                        mouseX = event.clientX;
                        mouseY = event.clientY;
                    },
                    mouseup: function (event) {
                        fixXY(event);
                        switch (event.which) {
                        case 1:
                            left = false;
                            break;
                        case 2:
                            break;
                        case 3:
                            right = false;
                            break;
                        default:
                            console.log('Unknown mouse button released: ' + event.which);
                        }
                        mouseX = event.clientX;
                        mouseY = event.clientY;
                        if (!dragged) {
                            drawing.pick.at(event.clientX, event.clientY);
                        }
                        dragging = false;
                    },
                    mousewheel: function (event) {
                        mouseWheel(event);
                    },
                    DOMMouseScroll: function (event) {
                        mouseWheel(event);
                    },
                    mousemove: function (event) {
                        dragged = true;
                        fixXY(event);
                        if (dragging) {
                            if (left) {
                                if (right) {
                                    camera.move(event.clientX - mouseX, event.clientY - mouseY);
                                } else {
                                    camera.roll(event.clientX - mouseX);
                                }
                            } else {
                                camera.yaw(event.clientX - mouseX);
                                camera.pitch(event.clientY - mouseY);
                            }
                        }
                        mouseX = event.clientX;
                        mouseY = event.clientY;
                    }
                });

                /**
                 * Resizes canvas container to fill all available space.
                 *
                 * Because appearance of layout elements is dynamic the
                 * available space is computed by reducing window's inner
                 * height and width by:
                 *   - main bootstrap container's margin and border,
                 *   - navigation tab,
                 *   - vc header container elements (like gantt),
                 *   - vc footer container elements (like alert box),
                 *   - footer (copyright information).
                 *
                 * @returns {undefined}
                 */
                function resizeContainer() {
                    var $appContainer = $('#main-container'),
                        appWidthMarginAndBorder = $appContainer.outerWidth(true) - $appContainer.innerWidth(),
                        appHeightMarginAndBorder = $appContainer.outerHeight(true) - $appContainer.innerHeight(),
                        newWidth = $window.innerWidth - appWidthMarginAndBorder,
                        takenSpace = 0,
                        newHeight = $window.innerHeight,
                        tabHeight = $('.nav.nav-tabs').outerHeight(true),
                        footerHeight = $('footer').outerHeight(true);

                    $('[vcheader] > div, [vcfooter] > div:first').each(function () {
                        takenSpace += $(this).outerHeight(true);
                    });

                    newHeight -= appHeightMarginAndBorder + tabHeight + footerHeight + takenSpace + 1;
                    $container.width(newWidth);
                    $container.height(newHeight);

                    $labelsContainer.width(newWidth);
                    $labelsContainer.height(newHeight);
                }

                /**
                 * Resizes canvas element to match container size. Lower than
                 * maximum of 1 quality value further reduces dimensions for
                 * canvas element. Eventualy canvas element is stretched with
                 * .css width:100% and height:100% to fit all available space.
                 *
                 * We're calling calculateElementOffset() to re-calculate
                 * absolute position of canvas element.
                 * @returns {undefined}
                 */
                function resizeCanvas() {
                    var newWidth = $container.width() * scope.quality,
                        newHeight = $container.height() * scope.quality,
                        off = calculateElementOffset(drawing.canvas.el);
                    element.attr({
                        width: newWidth,
                        height: newHeight
                    });
                    drawing.canvas.top = off.top;
                    drawing.canvas.left = off.left;
                    camera.fixAspect(newWidth, newHeight);
                }

                /**
                 * Resize on tab switch
                 */
                scope.$watch(attr.active, function () {
                    //Wrapped in timeout to wait for other elements to
                    //be rendered. Otherwise it can't calculate available
                    //height to make canvas fullscreen without scroll bars
                    setTimeout(function () {
                        resizeContainer();
                        resizeCanvas();
                    }, 100);
                });

                /**
                 * Canvas are resized on every window.resize() event.
                 * @param {jQuery.event} event resize event object
                 */
                $($window).resize(function (event) {
                    resizeContainer();
                    resizeCanvas();
                });

                /**
                 * Resize canvas after change of quality.
                 * @param {object} value new value of watched variable
                 */
                scope.$watch(scope.quality, function (value) {
                    resizeCanvas();
                });
            }
        };
    }
    canvasListener.$inject = ['cameraService', 'drawingService', '$window'];

    return canvasListener;
});