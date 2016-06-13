define(['text!mt_mapinfo/mapinfo.html'], function (mapinfoTmpl) {
    'use strict';
    /**
     * Creates mapinfo interface.
     *
     * @returns {object} directive
     */
    function mapinfo() {
        return {
            restrict: 'E',
            controller: 'MapInfoCtrl',
            template: mapinfoTmpl
        };
    }

    return mapinfo;
});