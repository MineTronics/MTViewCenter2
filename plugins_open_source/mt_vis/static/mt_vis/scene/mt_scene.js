define([
    'angular',
    'text!mt_vis/scene/mt_scene.html',
    'scenejs',
    'stats',

    //Custom nodes
    'mt_vis/camera/mt_orbit_camera',
    'mt_vis/scene/mt_layer',
    'mt_vis/scene/mt_node',
    'mt_vis/scene/mt_edge',
    'mt_vis/scene/mt_select_node',
    'mt_vis/scene/mt_grid_line',

    'mt_vis/scene/scenejs_memory_fix'
], function (
    angular,
    mtSceneTmpl,
    SceneJS,
    Stats,

    mt_orbit_camera,
    mt_layer,
    mt_node,
    mt_edge,
    mt_select_node,
    mt_grid_line,

    SceneJSFix
) {
    'use strict';

    function mtScene(drawing, camera, config, $rootScope) {
        SceneJS.setConfigs({
            pluginPath: '/static/scenejs_plugins'
        });

        return {
            restrict: 'E',
            template: mtSceneTmpl,
            link: function (scope) {
                /**
                 * Sets background color for the scene
                 * @param {type} background
                 * @returns {undefined}
                 */
                function setStyle(background) {
                    scope.sceneBackground = {
                        background: background
                    };
                }

                /**
                 * Parses vector passed as string from config to array
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

                scope.sceneBackground = setStyle(camera.background.style);
                scope.$watch(function () {
                    return camera.background.style;
                }, setStyle);
                drawing.scene = SceneJS.createScene({
                    canvasId: "main_canvas",
                    transparent: true,
                    nodes: [
                        {
                            type: mt_orbit_camera,
                            id: "cameraNode",
                            eye: parseVector(config.data.camera_default_eye_vector),
                            lookAt: parseVector(config.data.camera_default_lookAt_vector),
                            up: parseVector(config.data.camera_default_up_vector)
                        }
                    ]
                });

                drawing.canvas.el = drawing.scene.getCanvas();
                if (drawing.scene.isActive() && drawing.scene.isRunning()) {
                    var stats = new Stats();
                    stats.domElement.style.position = 'absolute';
                    stats.domElement.style.top = '0px';
                    stats.domElement.style.right = '0px';
                    stats.domElement.style.zIndex = 150;
                    document
                            .getElementById('canvas-container')
                            .appendChild(stats.domElement);
                    drawing.scene.on("tick", function () {
                        stats.end();
                        stats.begin();
                    });
                    console.info("SceneJS scene is active and running render loop: ", drawing.scene);
                    $rootScope.$emit('mt.mt_scene.new', drawing.scene);
                } else {
                    console.error("SceneJS was not initialized properly and is not active.", drawing.scene);
                }
            }
        };
    }
    mtScene.$inject = ['drawingService', 'cameraService', 'config', '$rootScope'];

    return mtScene;
});