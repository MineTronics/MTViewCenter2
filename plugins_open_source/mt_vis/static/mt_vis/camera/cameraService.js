define(['angular'], function (angular) {
    'use strict';

    /**
     * Used to control the camera position, movement, rotation, zoom etc.
     *
     * @param {object} drawingService
     * @param {object} config
     * @returns {object}
     */
    function cameraService(drawingService, config) {
        drawingService.menu.right.items.push({
            heading: 'VIS.CAM',
            body: '<camera-menu/>'
        });

        /*
         * Parses string like '123.32,3123,365' into array of numbers [123.32,
         * 3123, 365] to be used by glmat when creating vec3 objects OR returns
         * false if parse fails.
         * @param {type} vectorString
         * @returns {Boolean}
         */
        function parseVector(vectorString) {
            if (!angular.isString(vectorString)) {
                return false;
            }
            var vectorArr = vectorString
                .split(',')
                .map(function (stringFloat) {
                    return parseFloat(stringFloat);
                });
            return (vectorArr.some(isNaN) || vectorArr.length !== 3) ? false : vectorArr;
        }

        /**
         * Initializes 'Default' view out of config entries. If config is invalid
         * the default view will be:
         * eye: [0, 0, 100]
         * lookAt: [0, 0, 0]
         * up: [0, 1, 0]
         * @param {type} config
         * @returns {Array}
         */
        function initDefaultViewsArray(config) {
            var eye = parseVector(config.data.camera_default_eye_vector),
                lookAt = parseVector(config.data.camera_default_lookAt_vector),
                up = parseVector(config.data.camera_default_up_vector);

            if (eye && lookAt && up) {
                return [{
                    name: "VIS.CAMERA.DEFAULT",
                    cameraPosition: {
                        eye: {
                            x: eye[0],
                            y: eye[1],
                            z: eye[2]
                        },
                        look: {
                            x: lookAt[0],
                            y: lookAt[1],
                            z: lookAt[2]
                        },
                        up: {
                            x: up[0],
                            y: up[1],
                            z: up[2]
                        }
                    }
                }];
            }
            return [{
                name: "VIS.CAMERA.DEFAULT",
                cameraPosition: {
                    eye: {
                        x: 0,
                        y: 0,
                        z: 100
                    },
                    look: {
                        x: 0,
                        y: 0,
                        z: 0
                    },
                    up: {
                        x: 0,
                        y: 1,
                        z: 0
                    }
                }
            }];
        }

            /**
             * Current camera settings
             *
             */
        var mouseMoveSpeed = 0.5,
            mouseRotationSpeed = 0.5,
            mouseZoomSpeed = 0.1,

            /**
             * Default settings for camera
             * @type type
             */
            DEFAULTS = {
                "mt_orbit_camera" : {
                    mouseMoveSpeed : 0.5,
                    mouseRotationSpeed : 0.5,
                    mouseZoomSpeed : 0.1
                }
            },
            camera = null,

            /**
            * Holds camera preset views. Initialized with default view.
            * @type Array
            */
            views = initDefaultViewsArray(config),

            background = {
                topColor: '#FFFFFF',
                bottomColor: '#A9A9A9',
                style: 'linear-gradient(#FFFFFF, #A9A9A9)'
            };


        /**
         * Sets the default values for camera speed parameters. 
         * @param {type} type
         * @returns {undefined}
         */
        function loadDefaults(type) {
            if (DEFAULTS[type]) {
                mouseMoveSpeed = DEFAULTS[type].mouseMoveSpeed;
                mouseRotationSpeed = DEFAULTS[type].mouseRotationSpeed;
                mouseZoomSpeed = DEFAULTS[type].mouseZoomSpeed;
            }
        }

        /**
         *  Camera node is retrieved asynchronicaly (see retrieving nodes
         *  from SceneJS scene).
         * @param {SceneJS.Node} cameraNode - Reference to the MT Camera node
         */
        drawingService.getCamera(function (cameraNode) {
            loadDefaults(cameraNode.type);
            camera = cameraNode;
        });
        function getCamera(callback) {
            drawingService.getCamera(function (cameraNode) {
                camera = cameraNode;
                callback(camera);
            });
        }

        /**
         * Parses mouse movement into camera movement.
         *
         * @param {number} x
         * @param {number} y
         * @returns {undefined}
         */
        function move(x, y) {
            getCamera(function (camera) {
                var speedX = Math.min(x < 0 ? -x : x, mouseMoveSpeed),
                    speedY = Math.min(y < 0 ? -y : y, mouseMoveSpeed);
                camera.i.horizontal(x < 0 ? speedX : -speedX);
                camera.i.vertical(y < 0 ? -speedY : speedY);
            });
        }

        /**
         * Using the camera rotation method calls camera to rotate for passed
         * number of degrees adjusted by the max speed.
         * @param {number} degrees
         * @param {function} cameraRotate 
         * @param {number} maxSpeed
         * @returns {undefined}
         */
        function rotate(degrees, cameraRotate, maxSpeed) {
            degrees *= mouseRotationSpeed;
            degrees = Math.max(degrees, -maxSpeed);
            degrees = Math.min(degrees, maxSpeed);
            cameraRotate(degrees);
        }

        /**
         * Calls camera to zoom.
         * @param {type} value
         * @returns {undefined}
         */
        function zoom(value) {
            getCamera(function (camera) {
                camera.i.zoom(value > 0 ? -mouseZoomSpeed : mouseZoomSpeed);
            });
        }

        /**
         * Fixes the apsect of the camera for given width and heigth.
         * Used when browser window is beind resized.
         * @param {type} width
         * @param {type} height
         * @returns {undefined}
         */
        function fixAspect(width, height) {
            getCamera(function (camera) {
                camera.i.setAspect(width / height);
            });
        }

        /**
         * Returns object describing camera's current position with three vectors
         * or undefined if camera node is not available.
         * @returns {object|undefined}
         */
        function getCameraPosition() {
            return camera ? camera.i.getPositionVectors() : undefined;
        }

        /**
         * Sets camera position described by three vectors.
         * @param {object} position
         * @returns {undefined}
         */
        function setCameraPosition(position) {
            getCamera(function (camera) {
                camera.i.setPositionVectors(position);
            });
        }

        /**
         * Creates a predefined camera view.
         * @param {string} name - i18n key for the view
         * @param {object} center - 3D point defining the point that camera looks at
         * @param {type} direction - 3D normalized vector from the look at point
         * to the camera's eye point
         * @param {type} distance - Distance between the look at point and the
         * eye point. 
         * @param {type} up - 3D normalized vector defining the camera's up vector
         * @returns {object} view
         */
        function createView(name, center, direction, distance, up) {
            return {
                name: name,
                cameraPosition: {
                    look: center,
                    eye: {
                        x: center.x + direction.x * distance,
                        y: center.y + direction.y * distance,
                        z: center.z + direction.z * distance
                    },
                    up: up
                }
            };
        }

        /**
         * Returns altitude of a right pyramid with a square base.
         * @param {number} side
         * @returns {number} Altitude
         */
        function getAltitude(side) {
            return side / 1.41;
        }

        /**
         * Creates preset camera positions. Min and max are the dimensions
         * of the model.
         *  +X: east
         *  -X: west
         *  +Y: north
         *  -Y: south
         *  +Z: upwards
         *  -Z: downwards
         *  
         * The views are right pyramids with square base. Square side length is
         * calculated from the model's dimensions to assure that whole model
         * fits inside the view. Camera is positioned at the apex of the pyramid.
         * The center point is the middle point of provided model's dimensions.
         * dimensions. The preset views are as follows:
         *    1. Top - Eye is looking downwards at the model with west on the 
         *             right and north on the top of the screen. 
         *
         *    2. SideWE - Similiar to the Top view but we are looking at
         *                the West-East side. The camera is positioned on
         *                the NS axis.
         *
         *    3. SideNS - Similiar to the Top view but we are looking at
         *                the North-South side. The camera is positioned
         *                on the WE axis.
         *
         * @param {object} min
         * @param {object} max
         * @returns {undefined}
         */
        function prepareCameraViews(min, max) {
            var center = {
                    x: (min.x + max.x) / 2,
                    y: (min.y + max.y) / 2,
                    z: (min.z + max.z) / 2
                },
                distX = Math.abs(min.x - max.x),
                distY = Math.abs(min.y - max.y),
                distZ = Math.abs(min.z - max.z);

            views = initDefaultViewsArray(config);
            views.push(
                createView("VIS.CAMERA.TOP", center, {x: 0, y: 0, z: 1}, getAltitude(Math.max(distX, distY)), {x: 0, y: 1, z: 0}),
                createView("VIS.CAMERA.W_E", center, {x: 0, y: 1, z: 0}, getAltitude(Math.max(distX, distZ)), {x: 0, y: 0, z: 1}),
                createView("VIS.CAMERA.N_S", center, {x: 1, y: 0, z: 0}, getAltitude(Math.max(distY, distZ)), {x: 0, y: 0, z: 1})
            );
            console.log('Calculated ' + views.length + ' views for the model of dimensions [' + distX + ', ' + distY + ', ' + distZ + '].');
        }

        /**
         * Sets camera position by the view name.
         * @param {object} view
         * @returns {undefined}
         */
        function setView(view) {
            var foundView = views.filter(function (cameraView) {
                return cameraView.name === view.name;
            });

            if (foundView[0]) {
                setCameraPosition(foundView[0].cameraPosition);
                console.log('Set camera view', foundView[0]);
            } else {
                console.error("Could not find view: ", view.name);
            }
        }

        /**
         * Returns array of available views
         * @returns {object[]} available views
         */
        function getViews() {
            return views;
        }

        /**
         * Sets the visualisation background color. Background is a gradient of 
         * two colors: top and bottom.
         * @param {type} top
         * @param {type} bottom
         * @returns {undefined}
         */
        function setBackgroundStyle(top, bottom) {
            background.topColor = top;
            background.bottomColor = bottom;
            background.style = 'linear-gradient(' + background.topColor + ', ' + background.bottomColor + ')';
        }

        /**
         * Camera controlls interface
         */
        return {
            keyDown: function (event) {
                console.info('Keyboard-controlled camera not implemeneted. Could not handle ', event, ' event.');
            },
            fixAspect: fixAspect,
            getPosition: getCameraPosition,
            setPosition: setCameraPosition,
            prepareCameraViews: prepareCameraViews,
            getViews: getViews,
            setView: setView,
            yaw: function (degrees) {
                getCamera(function (camera) {
                    rotate(degrees, camera.i.yaw, 5.0);
                });
            },
            pitch: function (degrees) {
                getCamera(function (camera) {
                    rotate(degrees, camera.i.pitch, 5.0);
                });
            },
            roll: function (degrees) {
                getCamera(function (camera) {
                    rotate(degrees, camera.i.roll, 5.0);
                });
            },
            background: background,
            setBackgroundStyle: setBackgroundStyle,
            move: move,
            zoom: zoom
        };
    }
    cameraService.$inject = ['drawingService', 'config'];

    return cameraService;
});
