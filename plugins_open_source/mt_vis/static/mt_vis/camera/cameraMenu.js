define(['text!mt_vis/camera/camera_menu.html'], function (cameraMenuTmpl) {
    'use strict';

    /**
     * Creates form for controling the visualisation camera.
     * @returns {object} directive definition
     */
    function cameraMenu() {
        return {
            restrict: "E",
            controller: 'CameraMenuCtrl',
            controllerAs: 'cameraMenu',
            template: cameraMenuTmpl
        };
    }

    return cameraMenu;
});