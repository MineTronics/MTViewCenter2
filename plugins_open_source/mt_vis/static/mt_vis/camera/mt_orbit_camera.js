/**
 * Node representing camera orbiting around some defined 'center' point.
 * 
 * @param {object} glmat - Library for matrix and vector mathematical operations
 * @param {object} SceneJS - WebGL 3D visualisation engine
 *
 * Matrix, vector and quaternion operations are done using the glMatrix
 * http://glmatrix.net/ library.
 *
 * Camera position is represented by four 3d vectors:
 * 1. look point - what the camera is looking at
 * 2. eye point - from where the camera is looking
 * 3. up vector - points to 'up' direction from eye
 * 4. center point - point around which camera orbits
 *
 * Initial values:
 *  camera's eye is positioned at (0, 0, 0)
 *  look at is positioned at (0, 0, -10)
 *  up is set to [0, 1, 0] (Y axis)
 *  center point is clone on look point
 *
 *  When camera moves the eye and look points changes, but not the center point.
 *  This allows orbiting around constant point in world space no matter where the
 *  camera is positioned.
 *
 *  The local X, Y, Z axes of rotation are remembered and also rotated to make rotation
 *  more intuitive. For example if we pitch 90 degrees and then try to yaw 90 degrees
 *  it will look like we are rolling along Z axis. This is because we would perform
 *  yaw like if there was no pitch rotation.
 *
 *  The center point should be reset whenever camera position is set.
 *
 *  The complete node tree of mt_orbit_camera. These nodes are internal SceneJS
 *  nodes which are created by default. They are explicitly created and added
 *  to the scene to expose api for controlling the camera behaviour.
 *
 *  SceneJS.lookAtNode //Exposes api for setting postition of camera
 *         |
 *     SceneJS.cameraNode //Holds information about optics of the camera
 *              |
 *        SceneJS.lightsNode //Holds information about lights (like ambient or point
 *                |          //lights)
 *                |
 *           SceneJS.flagsNode //Flags has very general purpose, here it's used
 *                   |         //to optimize performance by telling to not render
 *                   |         //backfaces
 *                   |
 *              SceneJS.depthbuf //Depth buffer to further optimize performance
 *                      |        //by reducing number of nodes to render which
 *                      |        //are too far from the camera and would be hardly
 *                      |        //visible anyway.
 *                      |        //
 *                      |        //This node has an id:'hook' so it can be retrieved
 *                      |        //by calling scene.getNode('hook', callback)
 *                      |        //To make things organized all other nodes
 *                      |        //should be children of this 'hook' node, like
 *                      |        //layers
 *                      |
 *                 SCENE NODES TO BE DISPLAYED
 */
define(['glmat', 'scenejs'], function (glmat, SceneJS) {
    'use strict';
    SceneJS.Types.addType('mt_orbit_camera', {
        construct: function (params) {
            var self = this,
                scene = self.getScene(),
                DEG_TO_RAD = Math.PI / 180,
                lookat = self.addNode({
                    type: "lookAt"
                }),
                optics = lookat.addNode({
                    type: "camera",
                    optics: {
                        type: "perspective",
                        fovy: 45.0,
                        aspect: 2.0,
                        near: 0.1,
                        far: 5000.0
                    }
                }),

                /**
                 * There is no method to get light, we can only set them thus
                 * they are stored in external array which we can update when needed.
                 * Please note that you cannot add more lights after lights
                 * node has been added to the scene - see #1694
                 * @type type
                 */
                usedLights = [
                    /*
                     * All example DXF maps we have are made for black background.
                     * This light comes from SceneJS example were a black background
                     * is present. Becase lights array is specified no default settings
                     * are used so there is only one directional white light,
                     * causing background to look black.
                     */
                    {
                        mode: "dir",
                        color: { r: 1.0, g: 1.0, b: 1.0 },
                        diffuse: true,
                        specular: false,
                        dir: { x: 0.5, y: 0.0, z: -0.5 },
                        space: "view"
                    }
                ],

                lightsNode = optics.addNode({
                    type: "lights",
                    lights: usedLights,
                    nodes: [
                        {
                            type: "flags",
                            flags: {
                                backfaces: false
                            },
                            nodes: [
                                {
                                    id: "hook",
                                    type: "depthBuffer",
                                    enabled: true, // Default
                                    clearDepth: 1, // Default is 1.0 - clamped to [0..1]
                                    depthFunc: "less" // Default - also "equal","lequal","greater","notequal" and "gequal"
                                }
                            ]
                        }
                    ]
                }),

                //Camera vectors
                eye = params.eye ?
                        glmat.vec3.fromValues(params.eye[0], params.eye[1], params.eye[2])
                    : glmat.vec3.fromValues(0, 0, 100),
                look = params.lookAt ?
                        glmat.vec3.fromValues(params.lookAt[0], params.lookAt[1], params.lookAt[2])
                    : glmat.vec3.fromValues(0, 0, 0),
                up = params.up ?
                        glmat.vec3.fromValues(params.up[0], params.up[1], params.up[2])
                    : glmat.vec3.fromValues(0, 1, 0),
                center = glmat.vec3.clone(look),

                //Distance of eye point from look point
                distance = glmat.vec3.distance(eye, look),

                //Local axes of rotation
                xAxis = glmat.vec3.fromValues(1, 0, 0),
                yAxis = glmat.vec3.fromValues(0, 1, 0),
                zAxis = glmat.vec3.fromValues(0, 0, 1);
            /**
             * Sets the Eye, Look, and Up vectors of SceneJS.LookAt node
             * @private
             * @param {type} eye
             * @param {type} up
             * @param {type} lookAt
             * @returns {undefined}
             */
            function setLookAtNode(eye, up, lookAt) {
                lookat.setEye({x: eye[0], y: eye[1], z: eye[2]});
                lookat.setUp({x: up[0], y: up[1], z: up[2]});
                lookat.setLook({x: lookAt[0], y: lookAt[1], z: lookAt[2]});
            }

            /**
             * Informs camera subscribes about position change so they can
             * re-calculate their positions like labels.
             * Because viewMat and projMat might not be initialized right
             * after camera node is available I have added a small loop,
             * which should be called only once as long as the scene is
             * not destroyed.
             * @returns {undefined}
             */
            function pubCameraUpdate() {
                var data = null;
                try {
                    /*jslint nomen: true*/
                    data = {
                        viewMat : scene._engine.display._frameCtx.viewMat,
                        projMat: scene._engine.display._frameCtx.cameraMat,
                        eye: eye,
                        look: look,
                        up: up
                    };
                    /*jslint nomen: false*/
                    if (data.viewMat && data.projMat) {
                        self.publish("cameraUpdate", data);
                    } else {
                        setTimeout(pubCameraUpdate, 500);
                    }
                } catch (e) {
                    console.error("Could not set matrices for cameraUpdate event: ", e);
                }
            }

            function setPositionVectors(position) {
                //Read eye, look and up vectors and update LookAt node
                eye = glmat.vec3.fromValues(position.eye.x, position.eye.y, position.eye.z);
                look = glmat.vec3.fromValues(position.look.x, position.look.y, position.look.z);
                up = glmat.vec3.fromValues(position.up.x, position.up.y, position.up.z);
                setLookAtNode(eye, up, look);

                //Set center point to look point
                center = glmat.vec3.clone(look);

                //Calculate distance between eye and look
                var distVect = glmat.vec3.create();
                glmat.vec3.sub(distVect, eye, look);
                distance = glmat.vec3.len(distVect);

                //Update local axes of rotation
                yAxis = glmat.vec3.clone(up);
                glmat.vec3.normalize(zAxis, distVect);
                glmat.vec3.negate(zAxis, zAxis);
                glmat.vec3.cross(xAxis, zAxis, yAxis);

                //Inform subscribers about new position
                pubCameraUpdate();

                console.log('Set camera position to ' + position);
            }
            //Set deafult look
            setPositionVectors({
                eye: {
                    x: eye[0],
                    y: eye[1],
                    z: eye[2]
                },
                look: {
                    x: look[0],
                    y: look[1],
                    z: look[2]
                },
                up: {
                    x: up[0],
                    y: up[1],
                    z: up[2]
                }
            });

            /**
             * Changes the distance from eye to look point. (Zoom)
             *
             * @param {type} scale
             * @returns {undefined}
             */
            function changeDistance(scale) {
                distance += distance * scale;
                glmat.vec3.sub(eye, look, eye);
                glmat.vec3.normalize(eye, eye);
                glmat.vec3.scale(eye, eye, -distance);
                glmat.vec3.add(eye, look, eye);
                setLookAtNode(eye, up, look);
                pubCameraUpdate();
            }

            /**
             * Performs horizontal move by finding perpendicular vector
             * to direction vector and up vector.
             * Distance of move scales up with distance value.
             * @param {type} scale
             * @returns {undefined}
             */
            function moveHorizontal(scale) {
                var vector = glmat.vec3.create();
                glmat.vec3.sub(vector, look, eye);
                glmat.vec3.normalize(vector, vector);
                glmat.vec3.cross(vector, vector, up);
                glmat.vec3.scale(vector, vector, scale * (distance / 50));
                glmat.vec3.add(look, look, vector);
                glmat.vec3.add(eye, eye, vector);
                setLookAtNode(eye, up, look);
                center = glmat.vec3.clone(look);
                pubCameraUpdate();
            }

            /**
             * Moves eye and look point alongside up vector scaled to match
             * given speed.
             * Distance of move scales up with distance value.
             * @param {type} scale
             * @returns {undefined}
             */
            function moveVerctical(scale) {
                var vector = glmat.vec3.create();
                glmat.vec3.scale(vector, up, scale * (distance / 50));
                glmat.vec3.add(look, look, vector);
                glmat.vec3.add(eye, eye, vector);
                setLookAtNode(eye, up, look);
                center = glmat.vec3.clone(look);
                pubCameraUpdate();
            }

            /**
             * Rotates the camera around the center point along provided
             * axis.
             * @param {type} axis Axis of rotation
             * @param {type} degree
             * @returns {undefined}
             */
            function rotateAxis(axis, degree) {
                //Position camera so the center point is in the center
                //of XYZ coordinate system (0, 0, 0)
                glmat.vec3.sub(eye, eye, center);
                glmat.vec3.sub(look, look, center);

                //Using up vector find the 'up' point
                glmat.vec3.add(up, up, eye);

                //Create rotation represented by quaternion
                var quat = glmat.quat.create();
                glmat.quat.setAxisAngle(quat, axis, degree * DEG_TO_RAD);

                //Rotate eye, look and up points representing camera
                //around the center point
                glmat.vec3.transformQuat(eye, eye, quat);
                glmat.vec3.transformQuat(up, up, quat);
                glmat.vec3.transformQuat(look, look, quat);

                //Update the local axes
                glmat.vec3.transformQuat(xAxis, xAxis, quat);
                glmat.vec3.transformQuat(yAxis, yAxis, quat);
                glmat.vec3.transformQuat(zAxis, zAxis, quat);

                //Recreate the up vector
                glmat.vec3.sub(up, up, eye);
                glmat.vec3.normalize(up, up);

                //Move camera back
                glmat.vec3.add(eye, eye, center);
                glmat.vec3.add(look, look, center);
                setLookAtNode(eye, up, look);

                pubCameraUpdate();
            }

            /**
             * Sets the aspect of the camera so it can be adjusted to the
             * available browser width and height. Otherwise the view
             * would be streched in one of the dimensions.
             * @param {type} val
             * @returns {undefined}
             */
            function setAspect(val) {
                optics.setOptics(
                    {
                        type: "perspective",
                        fovy: 45.0,
                        aspect: val || 1.0,
                        near: 0.1,
                        far: 5000.0
                    }
                );
            }

            /**
             * Sets the background color
             * @param {type} r
             * @param {type} g
             * @param {type} b
             * @returns {undefined}
             */
            function setBackground(r, g, b) {
                lightsNode.setLights({
                    0: {
                        mode: "ambient",
                        color: {r: r, g: g, b: b},
                        diffuse: true,
                        specular: false
                    }
                });
            }

            /*
             * Camera interface
             * Encapsuleted to minimize the namespace polution
             */
            self.i = {
                yaw: function (speed) {
                    rotateAxis(yAxis, -speed);
                },
                pitch: function (speed) {
                    rotateAxis(xAxis, -speed);
                },
                roll: function (speed) {
                    rotateAxis(zAxis, speed);
                },
                left: function (speed) {
                    moveHorizontal(-speed);
                },
                right: function (speed) {
                    moveHorizontal(speed);
                },
                up: function (speed) {
                    moveVerctical(speed);
                },
                down: function (speed) {
                    moveVerctical(-speed);
                },
                forward: function (speed) {
                    changeDistance(-speed);
                },
                backward: function (speed) {
                    changeDistance(speed);
                },
                //@depracated
                update: function (dragging) { return; },
                setAspect: function (val) {
                    setAspect(val);
                },
                setBackground: function (r, g, b) {
                    setBackground(r, g, b);
                },
                //@depracated
                setSlowdown: function (val) { return; },
                zoom: function (speed) {
                    changeDistance(speed);
                },
                vertical: function (speed) {
                    moveVerctical(speed);
                },
                horizontal: function (speed) {
                    moveHorizontal(speed);
                },
                setPositionVectors: setPositionVectors,
                getPositionVectors: function () {
                    return {
                        eye: {
                            x: eye[0],
                            y: eye[1],
                            z: eye[2]
                        },
                        look: {
                            x: look[0],
                            y: look[1],
                            z: look[2]
                        },
                        up: {
                            x: up[0],
                            y: up[1],
                            z: up[2]
                        }
                    };
                }
            };
        }
    });

    return 'mt_orbit_camera';
});
