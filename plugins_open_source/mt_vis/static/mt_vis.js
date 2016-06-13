/**
 * This plugin creates a visualisation tab which consists of:
 * -mt_scene where everything is drawn (currently only 1 scene is supported)
 * -drawingService simple wrapper of SceneJS api
 * -cameraService for controlling the camera position
 * -labelsService for controlling labels
 * -left and right side menus (containers) 
 * 
 * @param {type} angular
 * @param {type} mtScene
 * @param {type} drawingService
 * @param {type} canvasListener
 * @param {type} visSideMenu
 * @param {type} cameraService
 * @param {type} CameraMenuCtrl
 * @param {type} cameraMenu
 * @param {type} labelsService
 * @param {type} labelsController
 * @param {type} mtLabel
 * @param {type} mtLabelLine
 * @returns {undefined}
 */
define([
    'angular',
    'mt_vis/scene/mt_scene',
    'mt_vis/scene/drawingService',
    'mt_vis/scene/canvasListener',
    'mt_vis/scene/visSideMenu',

    'mt_vis/camera/cameraService',
    'mt_vis/camera/CameraMenuCtrl',
    'mt_vis/camera/cameraMenu',

    'mt_vis/labels/labelsService',
    'mt_vis/labels/labelsController',
    'mt_vis/labels/mtLabel',
    'mt_vis/labels/mtLabelLine'
], function (
    angular,
    mtScene,
    drawingService,
    canvasListener,
    visSideMenu,

    cameraService,
    CameraMenuCtrl,
    cameraMenu,

    labelsService,
    labelsController,
    mtLabel,
    mtLabelLine
) {
    'use strict';

    angular.module('editor')

        .directive('mtScene', mtScene)
        .factory('drawingService', drawingService)
        .directive('canvasListener', canvasListener)
        .directive('visSideMenu', visSideMenu)

        .factory('cameraService', cameraService)
        .controller('CameraMenuCtrl', CameraMenuCtrl)
        .directive('cameraMenu', cameraMenu)

        .factory('labelsService', labelsService)
        .controller('labelsController', labelsController)
        .directive('mtLabel', mtLabel)
        .directive('mtLabelLine', mtLabelLine);

    return {
        enable: function ($injector) {
            var configTable = $injector.get('configTable');
            configTable.addKey('visualisation_autostart', 'VIS.AUTOSTART', 'CONFIG.AUTOSTART_GROUP');
        }
    };
});
