/*
 * This node creates a red boundary box, which indicates that some node is selected.
 *
 */
define(['scenejs'], function (SceneJS) {
    'use strict';
    SceneJS.Types.addType("mt_select_node", {
        construct: function (params) {
            var size = params.size || [2, 2, 2],
                margin = params.margin || 1,
                flags = this.addNode({
                    type: "flags",
                    flags: { enabled: params.enabled === true},
                    nodes: [{
                        type: "material",
                        color: {r: 1, g: 0, b: 0},
                        nodes: [{
                            type: "style",
                            lineWidth: 2,
                            nodes: [{
                                type: "geometry/boundary",
                                wire: true,
                                min: [
                                    -size[0] - margin,
                                    -size[1] - margin,
                                    -size[2] - margin
                                ],
                                max: [
                                    size[0] + margin,
                                    size[1] + margin,
                                    size[2] + margin
                                ]
                            }]
                        }]
                    }]
                });

            this.enable = function () {
                flags.setEnabled(true);
            };

            this.disable = function () {
                flags.setEnabled(false);
            };

            this.isSelected = function () {
                return flags.getEnabled();
            };

        }
    });
});
