define([], function () {
    'use strict';

    /**
     * Simple wrapper of SceneJS api to create and attach to mt_scene custom nodes.
     * Adds picking support. 
     * 
     * @param {type} $root
     * @param {type} config
     * @returns {drawingService_L1.drawingService.drawing}
     */
    function drawingService($root, config) {
        var drawing = {
            /*
             * Reference is set by mtScene directive
             */
            scene: undefined,
            /**
             * Holds position information about canvas element
             * @type type
             */
            canvas: {
                el: undefined,
                top: 0,
                left: 0
            },
            menu: {
                right: {
                    items: [],
                    expanded: true,
                    closeOthers: false
                },
                left: {
                    items: [],
                    expanded: false,
                    closeOthers: false
                }
            },
            primitive: config.data.drawing_primitive
        };

        /**
         * Asynchronous method to retrieve reference to camera node.
         * @param {type} callback
         * @returns {undefined}
         */
        drawing.getCamera = function (callback) {
            if (drawing.scene) {
                drawing.scene.getNode('cameraNode', callback);
            }
        };

        /**
         * Asynchronous method to add mt_layer
         * @param {type} layer_name
         * @param {type} visibile
         * @param {type} priority
         * @param {type} color
         * @param {type} callback
         * @returns {undefined}
         */
        drawing.addLayer = function (layer_name, visibile, priority, color, callback) {
            if (drawing.scene) {
                drawing.scene.getNode('hook', function (hook) {
                    hook.addNode({
                        type: "mt_layer",
                        name: layer_name,
                        visible: visibile,
                        priority: priority,
                        color: color
                    }, callback);
                });
            }
        };

        /**
         * Asynchronous method to add mt_node
         * @param {type} modelNodeId
         * @param {type} x
         * @param {type} y
         * @param {type} z
         * @param {type} layerId
         * @param {type} callback
         * @param {type} size
         * @param {type} color
         * @param {type} transparent
         * @param {type} force3D
         * @returns {undefined}
         */
        drawing.createNode = function (modelNodeId, x, y, z, layerId, callback, size, color, transparent, force3D) {
            if (drawing.scene) {
                drawing.scene.getNode(layerId, function (layer) {
                    layer.addNode({
                        type: "mt_node",
                        modelNodeId: modelNodeId,
                        x: x,
                        y: y,
                        z: z,
                        layer: layer,
                        size: size,
                        color: color,
                        transparent: transparent,
                        primitive: force3D ? false : drawing.primitive
                    }, callback);
                });
            }
        };

        /**
         * Asynchronous method to add mt_edge
         * @param {type} modelNodeId
         * @param {type} pointA
         * @param {type} pointB
         * @param {type} width
         * @param {type} heigth
         * @param {type} layerId
         * @param {type} callback
         * @param {type} color
         * @returns {undefined}
         */
        drawing.createEdge = function (modelNodeId, pointA, pointB, width, heigth, layerId, callback, color) {
            if (drawing.scene) {
                drawing.scene.getNode(layerId, function (layer) {
                    layer.addNode({
                        type: "mt_edge",
                        modelNodeId: modelNodeId,
                        a: pointA,
                        b: pointB,
                        sizeX: width,
                        sizeY: heigth,
                        layer: layer,
                        primitive: drawing.primitive
                    }, callback);
                });
            }
        };

        /**
         * Picking module. Whenever pick.at(x,y) is invoked the result object
         * is saved in pick.last property, and drawing-pick event is being
         * emitted on $rootScope with pick result and reference to picked
         * node.
         *
         * @type _L2.pickInitialize.Anonym$8
         */
        drawing.pick = {
            last: undefined,
            at: function (x, y) {
                if (drawing.scene) {
                    var result = drawing.scene.pick(x, y, {rayPick: true});
                    if (result) {
                        drawing.scene.getNode(result.nodeId, function (nameNode) {
                            drawing.pick.last = nameNode.parent;
                            $root.$emit('drawing-pick', {
                                result: result,
                                node: drawing.pick.last
                            });
                        });
                    } else {
                        drawing.pick.last = null;
                        $root.$emit('drawing-pick', {
                            result: undefined,
                            node: undefined
                        });
                    }
                }
            }
        };
        return drawing;
    }
    drawingService.$inject = ['$rootScope', 'config'];

    return drawingService;
});