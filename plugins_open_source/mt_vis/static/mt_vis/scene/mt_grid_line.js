/**
 * This node extrapolates 3D line into an artificial grid aligned with given 
 * 'align' vector. If the line is collinear with the 'align' vector then fixed
 * perpendicular to 'align' vector is used instead.
 * @param {object} SceneJS open-source WebGL-based 3D visualization engine from @xeoLabs.
 * @param {object} glmat Javascript Matrix and Vector library for High Performance WebGL apps
 */
define(['scenejs', 'glmat'], function (SceneJS, glmat) {
    'use strict';

    /**
     * Returns vector from point A to point B
     * @param {number[]} a 3D Point
     * @param {number[]} b 3D Point
     * @returns {number[]} 3D Vector 
     */
    function getVector(a, b) {
        return glmat.vec3.sub(glmat.vec3.create(), b, a);
    }

    /**
     * Returns gl-matrix 3D vector as object with x, y and z properties for the
     * positions.
     * @param {number[]} vec3
     * @returns {object} 3D point
     */
    function vec3asObject(vec3) {
        return {
            x: vec3[0],
            y: vec3[1],
            z: vec3[2]
        };
    }

    /**
     * Returns object representing 3D point as gl-matrix 3D vector
     * @param {object} ob
     * @returns {numer[]} gl-matrix 3D vector
     */
    function objectAsVec3(ob) {
        return glmat.vec3.fromValues(ob.x, ob.y, ob.z);
    }

    /**
     * Extrapolates 3D line into a grid, aligned with given vector
     * and scaled. This function finds a plane perpendicular to one of 
     * the line's ends. Plane is defined by two normalized vectors, 
     * perpendicular to the line and to themselves. Those vectors are 
     * then scaled by given scalar value.
     * @param {number[]} a First end of a 3D line 
     * @param {number[]} b Second end of a 3D line
     * @param {object} alignVec 3D vector used to set grid orientation. 
     * @param {number} scale Scalar value for grid width 
     * @returns {number[]} Array of positions which can be directly used
     * in geometry node.
     */
    function extrapolateLineToGrid(a, b, alignVec, scale) {
        var ab,
            perpendicular1,
            perpendicular2,
            nPerpendicular1,
            nPerpendicular2,
            points;

        ab = getVector(a, b);

        perpendicular1 = glmat.vec3.cross(glmat.vec3.create(), ab, alignVec);
        perpendicular2 = glmat.vec3.cross(glmat.vec3.create(), perpendicular1, ab);
        glmat.vec3.normalize(perpendicular1, perpendicular1);
        glmat.vec3.normalize(perpendicular2, perpendicular2);
        glmat.vec3.scale(perpendicular1, perpendicular1, scale * 0.5);
        glmat.vec3.scale(perpendicular2, perpendicular2, scale * 0.5);
        nPerpendicular1 = glmat.vec3.negate(glmat.vec3.create(), perpendicular1);
        nPerpendicular2 = glmat.vec3.negate(glmat.vec3.create(), perpendicular2);

        //4 corners of the plane
        points = [
            glmat.vec3.add(glmat.vec3.create(a), perpendicular1, perpendicular2),
            glmat.vec3.add(glmat.vec3.create(a), nPerpendicular1, perpendicular2),
            glmat.vec3.add(glmat.vec3.create(a), nPerpendicular1, nPerpendicular2),
            glmat.vec3.add(glmat.vec3.create(a), perpendicular1, nPerpendicular2)
        ];

        //Second end of the 3D line
        points.forEach(function (point) {
            points.push(glmat.vec3.add(glmat.vec3.create(), point, ab));
        });

        //Flatten the points array into positions array. 
        return points.reduce(function (positions, vec3) {
            glmat.vec3.add(vec3, vec3, a); //Position correction
            positions.push(vec3[0], vec3[1], vec3[2]);
            return positions;
        }, []);
    }

    function calculateIndicesForGrid(gridPositions) {
        var indices = [], i;
        for (i = 0; i < gridPositions.length; i += 24) {
            indices.push(
                //Point A plane's corners
                i,
                i + 1,
                i + 1,
                i + 2,
                i + 2,
                i + 3,
                i + 3,
                i,

                //Point B plane's corners
                i + 4,
                i + 5,
                i + 5,
                i + 6,
                i + 6,
                i + 7,
                i + 7,
                i + 4,

                //Connection of planes' corners
                i,
                i + 4,
                i + 1,
                i + 5,
                i + 2,
                i + 6,
                i + 3,
                i + 7
            );
        }
        return indices;
    }

    /**
     * Returns true if the two vectors are collinear
     * @param {number[]} a Vector
     * @param {number[]} b Vector
     * @returns {Boolean}
     */
    function isCollinear(a, b) {
        var x = a[0] / b[0],
            y = a[1] / b[1],
            z = a[2] / b[2];
        return x === y && x === z;
    }

    /**
     * Calculates middle 3D point between two 3D points
     * @param {object} a 3D Point
     * @param {object} b 3D Point
     * @returns {object} Middle point
     */
    function calculateMiddle(a, b) {
        return glmat.vec3.fromValues((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    }

    /**
     * Returns distance between two points in 3D space.
     * @param {object} a 3D Point
     * @param {object} b 3D Point
     * @returns {number} Distance between two 3D points
     */
    function calculateLength(a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2));
    }

    SceneJS.Types.addType("mt_grid_line", {
        construct: function (params) {
            this.modelNodeId = params.modelNodeId;
            var material,
                start = objectAsVec3(params.a),
                end = objectAsVec3(params.b),
                align = objectAsVec3(params.align),
                size = params.size || 1,
                geometry;

            material = this.addNode({
                type: "name",
                name: "mt_grid_line_" + params.id
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
             * Constructs geometry node representing the grid line, aligned
             * with given vector and scaled to given size.
             * @param {number[]} a 3D point
             * @param {number[]} b 3D point
             * @param {number[]} align Vector used for orientating extrapolated 
             * grid in 3D space as there infinite possible orientations otherwise.
             * @param {number} size Size (height and width) of the extrapolated 
             * grid
             * @returns {undefined}
             */
            function buildGridLine(a, b, align, size) {
                var positions, indices;

                if (isCollinear(getVector(a, b), align)) {
                    //Fixed perpendicular vector to align vector when they are 
                    //collinear and would cause calculation problems.
                    align = glmat.vec3.fromValues(align[1], -align[0], 0);
                }
                positions = extrapolateLineToGrid(a, b, align, size);
                indices = calculateIndicesForGrid(positions);

                if (geometry && geometry.destroy) {
                    geometry.destroy();
                }
                geometry = material.addNode({
                    type: 'geometry',
                    primitive: 'lines',
                    positions: positions,
                    indices: indices
                });
            }
            buildGridLine(start, end, align, size);

            this.xyz = {
                get: function () {
                    return vec3asObject(calculateMiddle(start, end));
                }
            };

            this.getStart = function () {
                return vec3asObject(start);
            };

            this.setStart = function (x, y, z) {
                if (start[0] !== x || start[1] !== y || start[2] !== z) {
                    start = glmat.vec3.fromValues(x, y, z);
                    buildGridLine(start, end, align, size);
                }
            };

            this.setEnd = function (x, y, z) {
                if (end[0] !== x || end[1] !== y || end[2] !== z) {
                    end = glmat.vec3.fromValues(x, y, z);
                    buildGridLine(start, end, align, size);
                }
            };

            this.getEnd = function () {
                return vec3asObject(end);
            };

            this.getLength = function () {
                return calculateLength(start, end);
            };

            this.setSize = function () {
                console.error('setting size of mt_grid_line is not implemented');
            };

            this.select = function () {
                console.error('selecting mt_grid_line is not implemented');
            };

            this.deselect = function () {
                console.error('deselecting mt_grid_line is not implemented');
            };
        }
    });
});