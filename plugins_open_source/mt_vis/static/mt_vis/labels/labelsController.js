define(['angular'], function (angular) {
    'use strict';

    function labelsController(drawing, labels, $scope, $interval) {
        $scope.labels = labels.collection;

        /**
         * Letting angular update model and fire watchers for labels positions
         * is too expensive so an apply is run perodically via $interval.
         * The frequency depends on drawing quality.
         * Best quality = 1 will result in updates each 100ms.
         * Worst quality around 0 will result in updates each 2000ms.
         *
         * Other values will result in canceling of autoupdates.
         * @type @call;$interval
         */
        var updateHandler, topLabelIndex = 0;
        function startUpdate(frequency) {
            updateHandler = $interval(angular.noop, frequency);
        }
        startUpdate(2000 - $scope.quality * 1900);

        /**
         * Periodically increase z-index of each label. This allows each
         * label to have a chance to appear on top of the others.
         * @type Number|Number
         */
        $interval(function () {
            if ($scope.labels[topLabelIndex] && $scope.labels[topLabelIndex].$label) {
                $scope.labels[topLabelIndex].$label.removeClass('node-label-top');
            }
            if (topLabelIndex + 1 < $scope.labels.length) {
                topLabelIndex++;
            } else {
                topLabelIndex = 0;
            }
            if ($scope.labels[topLabelIndex] && $scope.labels[topLabelIndex].$label) {
                $scope.labels[topLabelIndex].$label.addClass('node-label-top');
            }
        }, 2000);

        /**
         * Each 100 ms will spread labels by 5px to eventually make them
         * separated (not overlapping) with additional 20px margin.
         * @returns {undefined}
         */
        $interval(function () {
            if (labels.options.automaticSpread) {
                labels.spread(5, 20);
            }
        }, 100);

        $scope.$watch($scope.quality, function (value) {
            if (value > 0 && value <= 1) {
                if (angular.isDefined(updateHandler)) {
                    $interval.cancel(updateHandler);
                }
                startUpdate(2000 - value * 1900);
            }
        });

        /*
         * Checks label position regarding the scene boundaries. Label will
         * be only displayed if its bounderies lies withing the scene bounderies.
         */
        $scope.calculateLabelPosition = function (label) {
            if (label.visible) {
                if (label.mouseover) {
                    return {
                        position: "absolute",
                        display: "block",
                        top: label.y + label.offY,
                        left: label.x + label.offX
                    };
                }
                var left = label.x + label.offX,
                    top = label.y + label.offY,
                    margin_left = 0 < left,
                    margin_right = left < (drawing.canvas.el.width - label.$label.width()),
                    margin_top = 0 < top,
                    margin_bottom = top < (drawing.canvas.el.height - label.$label.height());
                if (margin_left && margin_right && margin_top && margin_bottom) {
                    label.inMargin = true;
                    return {
                        position: "absolute",
                        display: "block",
                        top: top,
                        left: left
                    };
                }
            }
            label.inMargin = false;
            return {
                display: "none"
            };
        };
    }
    labelsController.$inject = ['drawingService', 'labelsService', '$scope', '$interval'];

    return labelsController;
});