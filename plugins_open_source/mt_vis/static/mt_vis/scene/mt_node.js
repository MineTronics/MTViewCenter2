/*
 * Map node
 *
 * Node has a collection of edges ids. MT_Node can not be removed if it used by
 * some edge. You need to destroy edge before destroying nodes.
 */

define(['scenejs'], function (SceneJS) {
    'use strict';
    SceneJS.Types.addType("mt_node", {
        construct: function (params) {
            var thisNode = this, translate, transparent, material, selected;
            thisNode.modelNodeId = params.modelNodeId;

            translate = thisNode.addNode({
                type: "name",
                name: "mt_node_" + params.id
            })
                .addNode({
                    type: "translate",
                    x: params.x,
                    y: params.y,
                    z: params.z
                });
            transparent = translate.addNode({
                type: "flags",
                flags: {
                    transparent: params.transparent || false
                }
            });

            material = transparent.addNode({
                type: "material",
                color: params.color || params.layer.getDefaultColor() || {r: 1, g: 1, b: 1},
                alpha: params.transparent ? 0 : 1,
                nodes: [
                    params.primitive ? {
                        type: 'geometry',
                        primitive: 'points',
                        positions: new Float32Array([
                            0, 0, 0  // params.x, params.y, params.z
                        ]),
                        indices: new Uint16Array([
                            0
                        ])
                    } : {
                        type: "geometry/box",
                        size: params.size || [1, 1, 1]
                    }
                ]
            });

            selected = material.addNode({
                type: "mt_select_node",
                size: params.size || [1, 1, 1],
                margin: 1
            });

            /*
             * Setter and getter for this node x,y,z coordinates
             */
            this.xyz = {
                set: function (xyz) {
                    translate.setXYZ(xyz);
                },
                get: function () {
                    return translate.getXYZ();
                }
            };

            this.setTransparent = function (transparency) {
                transparent.setTransparent(transparency);
                material.setAlpha(transparency ? 0 : 1);
            };

            this.isTransparent = function () {
                return transparent.getTransparent();
            };

            this.setColor = function (color) {
                material.setColor(color || params.layer.getDefaultColor() || {r: 1, g: 1, b: 1});
            };

            this.getColor = function () {
                return material.getColor();
            };

            this.remove = function remove() {
                this.destroy();
            };

            this.select = function () {
                selected.enable();
            };

            this.deselect = function () {
                selected.disable();
            };
        }
    });
});
