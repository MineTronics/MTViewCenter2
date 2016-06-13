/*
 * Edge (3D line) created using coordinates of two 3D points.
 *
 */
define(['glmat', 'scenejs'], function (glmat, SceneJS) {
    'use strict';
    SceneJS.Types.addType("mt_edge", {
        construct: function (params) {
            this.modelNodeId = params.modelNodeId;
            var material,
                start = {
                    x: params.a.x,
                    y: params.a.y,
                    z: params.a.z
                },
                end = {
                    x: params.b.x,
                    y: params.b.y,
                    z: params.b.z
                },
                width = params.sizeX,
                height = params.sizeY,
                middle,
                length,
                matrixNode,
                edgeNode,
                selected,
                primitive = params.primitive;

            material = this.addNode({
                type: "name",
                name: "mt_edge_" + params.id
            }).addNode({
                type: "material",
                color: params.color || params.layer.getDefaultColor() || {r: 1, g: 1, b: 1}
            });

            this.getColor = function () {
                return material.getColor();
            };

            this.setColor = function (color) {
                material.setColor(color);
            };

            /**
             * Calculates middle 3D point between two 3D points
             * @returns {undefined}
             */
            function calculateMiddle() {
                middle = glmat.vec3.fromValues((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2);
            }

            /**
             * Creates transformation matrix to rotate and translate a tunnel
             * between points a and b.
             * Box is rotated relative to X axis and then to Z axis and translated
             * to middle point between the points a and b.
             * @returns {undefined}
             */
            function createMatrixNode() {
                var matrix = glmat.mat4.create(), xAngle, temp_side, zAngle;
                glmat.mat4.translate(matrix, matrix, middle);
                xAngle = Math.atan((start.z - end.z) / (start.y - end.y));
                glmat.mat4.rotateX(matrix, matrix, isNaN(xAngle) ? 0 : xAngle);
                temp_side = Math.sqrt(Math.pow(start.y - end.y, 2) + Math.pow(start.z - end.z, 2));
                zAngle = Math.atan(temp_side / (start.x - end.x));
                glmat.mat4.rotateZ(matrix, matrix, start.y >= end.y ? zAngle : -zAngle);
                matrixNode = material.addNode({
                    type: "matrix",
                    elements: matrix
                });
            }

            /**
             * Returns distance between two points in 3D space.
             * @returns {undefined}
             */
            function calculateLength() {
                length =  Math.sqrt(Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2) + Math.pow(start.z - end.z, 2));
            }

            /**
             * Creates box representing a line between two 3D points.
             * @returns {mt_edge_L8.mt_edgeAnonym$1.construct.createEdgeNode.mt_edgeAnonym$3}
             */
            function createEdgeNode() {
                edgeNode = matrixNode.addNode({
                    type: "geometry/box",
                    size: [
                        length / 2,
                        width,
                        height
                    ]
                });
            }

            /**
             * Creates selection node surrounding this edge. It's visible only
             * when this edge is selected.
             * @param {object} parentNode
             * @returns {undefined}
             */
            function createSelectNode(parentNode) {
                var isSelected = false;
                if (selected && selected.destroy) {
                    isSelected = selected.isSelected();
                    selected.destroy();
                }
                selected = parentNode.addNode({
                    type: "mt_select_node",
                    size: [
                        length / 2,
                        width,
                        height
                    ],
                    margin: 1,
                    enabled: isSelected
                });
            }

            /**
             * Builds this edge using more complex nodes
             * @returns {undefined}
             */
            function buildEdge() {
                calculateLength();
                if (edgeNode && edgeNode.destroy) {
                    edgeNode.destroy();
                }
                createEdgeNode();
                createSelectNode(matrixNode);
            }

            /**
             * Builds this edge using low level WebGL API 
             * @returns {undefined}
             */
            function buildPrimitiveLine() {
                if (edgeNode && edgeNode.destroy) {
                    edgeNode.destroy();
                }
                edgeNode = material.addNode({
                    type: 'geometry',
                    primitive: 'lines',
                    positions: new Float32Array([
                        start.x, start.y, start.z,
                        end.x, end.y, end.z
                    ]),
//                    normals: new Float32Array([
//                        0, 0, 1,
//                        0, 0, 1
//                    ]),
                    indices: new Uint16Array([
                        0, 1
                    ])
                });
                createSelectNode(material);
            }

            /**
             * Builds this edge node
             * @param {type} primitive
             * @returns {undefined}
             */
            function build(primitive) {
                if (primitive) {
                    buildPrimitiveLine();
                } else {
                    calculateMiddle();
                    if (matrixNode && matrixNode.destroy) {
                        matrixNode.destroy();
                    }
                    createMatrixNode();
                    buildEdge();
                }
            }
            build(primitive);

            this.xyz = {
                get: function () {
                    return {
                        x: middle[0],
                        y: middle[1],
                        z: middle[2]
                    };
                }
            };

            this.getStart = function () {
                return start;
            };

            this.setStart = function (x, y, z) {
                if (start.x !== x || start.y !== y || start.z !== z) {
                    start.x = x;
                    start.y = y;
                    start.z = z;
                    build();
                }
            };

            this.setEnd = function (x, y, z) {
                if (end.x !== x || end.y !== y || end.z !== z) {
                    end.x = x;
                    end.y = y;
                    end.z = z;
                    build();
                }
            };

            this.getEnd = function () {
                return end;
            };

            this.getHeight = function () {
                return height;
            };

            this.getWidth = function () {
                return width;
            };

            this.setSize = function (newWidth, newHeight) {
                width = newWidth;
                height = newHeight;
                if (!primitive) {
                    buildEdge();
                } else {
                    console.error('Setting size of primitive edge is not supported');
                }
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
