/**
 * 
 * @param {type} angular
 * @param {type} mtVis
 * @param {type} mapinfo
 * @param {type} mapModel
 * @param {type} MapInfoCtrl
 * @param {type} layerPanel
 * @param {type} mtMapService
 * @param {type} fileread
 * @param {type} filterObjectByKeyVal
 * @returns {mt_plug_mapinfo_L16.mt_plug_mapinfoAnonym$1}
 */
define([
    'angular',
    'mt_vis',

    'mt_mapinfo/mapinfo',
    'mt_mapinfo/mapModel',
    'mt_mapinfo/MapInfoCtrl',
    'mt_mapinfo/layerPanel',
    'mt_mapinfo/mtMapService',

    'mt_mapinfo/fileread',
    'mt_mapinfo/filterObjectByKeyVal'
], function (
    angular,
    mtVis,
    mapinfo,
    mapModel,
    MapInfoCtrl,
    layerPanel,
    mtMapService,
    fileread,
    filterObjectByKeyVal
) {
    'use strict';

    angular.module('editor')
        //Plugin tab
        .directive('mapinfo', mapinfo)
        //Loaded map data
        .factory('mapModel', mapModel)
        .controller('MapInfoCtrl', MapInfoCtrl)

        //Map layers panel
        .directive('layerPanel', layerPanel)

        //Web service for accessing map data
        .factory('mtMapService', mtMapService)

        //Utility
        .directive('fileread', fileread)
        .filter('filterObjectByKeyVal', filterObjectByKeyVal);

    return {
        enable: function ($injector) {
            var configTable = $injector.get('configTable');
            configTable.addKey('mt_mapinfo_autostart', 'MAP.AUTOSTART', 'CONFIG.AUTOSTART_GROUP');
            configTable.addKey('mt_mapinfo_autostart', 'MAP.AUTOSTART', 'MAP.CONFIG_GROUP');
            configTable.addKey('default_map_id', 'MAP.CONFIG_DEFAULT_MAP', 'MAP.CONFIG_GROUP');
            configTable.addKey('drawing_primitive', 'MAP.DRAWING_PRIMITIVE', 'MAP.CONFIG_GROUP');
            configTable.addKey('fallback_map_location', 'MAP.FALLBACK_MAP', 'MAP.CONFIG_GROUP');
            configTable.addKey('camera_default_eye_vector', 'VIS.CAMERA_DEFAULT_EYE', 'MAP.CONFIG_GROUP');
            configTable.addKey('camera_default_lookAt_vector', 'VIS.CAMERA_DEFAULT_LOOK_AT', 'MAP.CONFIG_GROUP');
            configTable.addKey('camera_default_up_vector', 'VIS.CAMERA_DEFAULT_UP', 'MAP.CONFIG_GROUP');
            configTable.addKey('camera_default_view_name', 'VIS.CAMERA_DEFAULT_VIEW_NAME', 'MAP.CONFIG_GROUP');
        }
    };
});
