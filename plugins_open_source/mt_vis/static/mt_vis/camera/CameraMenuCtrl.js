define([], function () {
    'use strict';

    /**
     * Binds camera menu with the camera service to allow setting visualisation
     * background color and camera predefined views.
     * @param {type} camera
     * @param {type} $scope
     * @returns {undefined}
     */
    function CameraMenuCtrl(camera, $scope) {
        var vm = this;
        vm.topColor = camera.background.topColor;
        vm.bottomColor = camera.background.bottomColor;

        $scope.$watchGroup(['cameraMenu.topColor', 'cameraMenu.bottomColor'], function (newVals) {
            camera.setBackgroundStyle(newVals[0], newVals[1]);
        });

        vm.views = camera.getViews();

        $scope.$watch(function () {
            return camera.getViews();
        }, function (newViews) {
            vm.views = newViews;
        });

        vm.setView = function (view) {
            camera.setView(view);
        };

        vm.getCameraPos = function () {
            var position = camera.getPosition();
            console.log("eye", position.eye);
            console.log("look", position.look);
            console.log("up", position.up);
        };
    }
    CameraMenuCtrl.$inject = ['cameraService', '$scope'];

    return CameraMenuCtrl;
});