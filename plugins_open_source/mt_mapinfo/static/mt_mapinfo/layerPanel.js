define(['angular', 'text!mt_mapinfo/layerPanel.html'], function (angular, layerPanelTmpl) {
    'use strict';

    /**
     * Displays and allows editing of the map layers data.
     * @param {type} mapModel
     * @returns {layerPanel_L1.layerPanel.layerPanelAnonym$1}
     */
    function layerPanel(mapModel) {
        return {
            scope: true,
            restrict: 'E',
            template: layerPanelTmpl,
            link: function ($scope) {
                $scope.mapModel = mapModel;
                /**
                 * Toggle layer visibility in the scene
                 * @param {object} layer
                 * @returns {undefined}
                 */
                $scope.changeVisibility = function (layer) {
                    layer.visibility = !layer.visibility;
                    if (layer.node) {
                        layer.node.setVisible(layer.visibility);
                    }
                };

                /**
                 * Updates layer color
                 * @param {object} layer
                 * @returns {undefined}
                 */
                $scope.changeColor = function (layer) {
                    if (layer.node) {
                        layer.node.setDefaultColor(layer.color, true);
                    }
                };

                /**
                 * Set visibility of all map layers
                 * @param {type} isVisible
                 * @returns {undefined}
                 */
                $scope.setLayersVisibility = function (isVisible) {
                    angular.forEach(mapModel.layers, function (layer) {
                        layer.visibility = isVisible;
                        if (layer.node) {
                            layer.node.setVisible(layer.visibility);
                        }
                    });
                };
            }
        };
    }
    layerPanel.$inject = ['mapModel'];

    return layerPanel;
});