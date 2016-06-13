define(['angular', 'jquery'], function (angular, $) {
    'use strict';

    /**
     * Main controller for the mapinfo plugin tab
     * @param {object} $scope angular scope
     * @param {type} $timeout angular $timeout service
     * @param {type} mapModel mapModel service
     * @param {type} config config service
     * @param {type} mtMapService mtMapService service 
     * @param {type} $filter angular $filter service
     * @param {object} mtUtil Minetronics utility service
     * @returns {undefined}
     */
    function MapInfoCtrl($scope, $timeout, mapModel, config, mtMapService, $filter, mtUtil) {
        $scope.mapModel = mapModel;
        $scope.map = config.data;
        $scope.drawingFeedback = '';
        $scope.export = {
            filename: 'map.json'
        };
        var unsubMapLogger, colorPromise;

        /**
         * Parses map data to display summary about the map layers. This allows 
         * user to customize which parts of the map model should be drawn and 
         * which can be ignored to increase performance and visibility.
         * @param {type} data
         * @param {type} name
         * @returns {undefined}
         */
        function parseMap(data, name) {
            $scope.drawingFeedback = '';
            if (!mapModel.isEmpty()) {
                $scope.drawingFeedback = $filter('translate')('MAP.REMOVING') + '\n';
                mapModel.destroyMap();
            }
            $scope.drawingFeedback += $filter('translate')('MAP.PARSING');
            mapModel.parseMapData(data, name);
            $scope.drawingFeedback += '\n' + $filter('translate')('MAP.PARSING_DONE');
        }

        /**
         * Calls map model service to draw the map.
         * @returns {undefined}
         */
        $scope.drawMap = function () {
            if (!mapModel.isEmpty()) {
                $scope.drawingFeedback += '\n' + $filter('translate')('MAP.DRAWING');
                setTimeout(mapModel.drawMap);
            } else {
                $scope.drawingFeedback += '\n' + $filter('translate')('MAP.ERROR.NULL');
            }
        };

        /**
         * Subscribe to map logger to receive feedback information when parsing
         * and drawing a map.
         * @param {string} logEntry Key identifing log type. Also a i18n key.
         * @param {string} dynamicVal Message associated with the log entry.
         */
        unsubMapLogger = mapModel.logger.sub('log', function (logEntry, dynamicVal) {
            $scope.drawingFeedback += '\n' + $filter('translate')(logEntry, {sectionName: dynamicVal});
        });

        /**
         * Unsubscribe from map logger to release resources.
         */
        $scope.$on('$destroy', function () {
            mapModel.logger.unsub(unsubMapLogger);
        });


        /**
         * Last resort of drawing initial map by looking for map file at 
         * 'fallback_map_location' configuration value. This should be used for 
         * demonstration purposes.
         * @returns {undefined}
         */
        function loadFallbackMap() {
            if ($scope.map.fallback_map_location) {
                $.ajax({
                    url: $scope.map.fallback_map_location,
                    dataType: 'text',
                    type: 'GET'
                }).done(function (data) {
                    parseMap(data, $scope.map.fallback_map_location);
                    $scope.drawMap();
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    console.error('loadFallbackMap error: ', jqXHR, textStatus, errorThrown);
                });
            }
        }

        /**
         * Parses bytes to more readable format
         * @param {number} bytes Number of bytes
         * @returns {string} Rounded number of bytes as a more readible string 
         * with unit.
         */
        function bytesToSize(bytes) {
            if (bytes === 0) {
                return '0 Byte';
            }
            var k = 1000,
                sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                i = Math.floor(Math.log(bytes) / Math.log(k));
            return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
        }

        /**
         * Counts lines in given string. Implemented mainly for DXF files as
         * additional debuging information.
         * @param {type} fileString
         * @returns {Number}
         */
        function countLines(fileString) {
            return fileString ? fileString.split(/\r\n|\r|\n/g).length : 0;
        }

        $scope.mapCenter = {
            maps: [],
            refreshMapListText: 'MAP.REFRESH_LIST',
            mapUpload: {
                data: undefined,
                state: {
                    color: undefined,
                    details: undefined,
                    msg: undefined
                }
            },
            error: undefined
        };

        //Data used by load map from file form
        $scope.loadFile = {
            data: undefined,
            parsedSize: 0,
            lines: 0,
            state: {}
        };

        /**
         * Updates layer visibility in the scene
         *
         * @param {type} layer
         * @returns {undefined}
         */
        $scope.changeVisibility = function (layer) {
            if (layer.node) {
                layer.node.setVisible(layer.visibility);
            }
        };

        /**
         * Updates layer priority in the scene
         *
         * @param {type} layer
         * @returns {undefined}
         */
        $scope.changePriority = function (layer) {
            if (layer.node && angular.isNumber(layer.priority)) {
                layer.node.setPriority(layer.priority);
            }
        };

        /**
         * Updates layer name in the scene
         * @param {object} layer Map layer
         */
        $scope.changeName = function (layer) {
            if (layer.node && angular.isString(layer.name)) {
                layer.node.setName(layer.name);
            }
        };

        /**
         * Updates default color for objects associated with given layer
         * @param {object} layer
         * @returns {undefined}
         */
        $scope.changeColor = function (layer) {
            $timeout.cancel(colorPromise);
            colorPromise = $timeout(function () {
                if (layer.node) {
                    layer.node.setDefaultColor(layer.color, true);
                }
            }, 2000);
        };

        /**
         * Toggles isIgnored flag for given layer
         * @param {object} layer
         * @returns {undefined}
         */
        $scope.setLayerIgnore = function (layer) {
            layer.isIgnored = !layer.isIgnored;
            var index = mapModel.options.ignoredLayers.indexOf(layer.name);
            if (layer.isIgnored && index < 0) {
                mapModel.options.ignoredLayers.push(layer.name);
            }
            if (!layer.isIgnored && index >= 0) {
                mapModel.options.ignoredLayers.splice(index, 1);
            }
        };

        $scope.$watchCollection('mapModel.options.ignoredLayers', function (newIgnored) {
            angular.forEach(mapModel.layers, function (layer, name) {
                layer.isIgnored = newIgnored.indexOf(name) >= 0;
            });
        });

        /**
         * Retrieve list of available maps from MTMapCenter database
         * @returns {undefined}
         */
        $scope.getMineMapNames = function () {
            $scope.mapCenter.refreshMapListText = 'MAP.REFRESH_LIST_IN_PROGRESS';
            $scope.mapCenter.maps = [];
            mtMapService.getMineMapNames(function (namesArr) {
                $scope.mapCenter.error = undefined;
                $scope.mapCenter.maps = namesArr;
                $scope.mapCenter.refreshMapListText = 'MAP.REFRESH_LIST';
            }, function (soapError) {
                $scope.mapCenter.refreshMapListText = 'MAP.REFRESH_LIST';
                $scope.mapCenter.error = {
                    msg: 'MAP.ERROR.MAPCENTER',
                    details: soapError.httpText + ' - ' + soapError.httpCode
                };
                //Inform about connection problem or CORS problem
                console.error('getMineMapNames:soapError', soapError);
            });
        };
        $scope.getMineMapNames();

        /**
         * Retrieve map from MTMapCenter database
         * @param {type} id
         * @returns {undefined}
         */
        $scope.getMineMap = function (id) {
            mtMapService.getMineMap(id, parseMap, function (soapError) {
                $scope.mapCenter.error = {
                    msg: 'MAP.ERROR.MAPCENTER',
                    details: soapError.httpText + ' - ' + soapError.httpCode
                };
                console.error('getMineMap:soapError', soapError);
            });
        };

        /**
         * Handle loading map from file
         * @param {object} newFileData Result of loading a file with fileread directive
         */
        $scope.$watch('loadFile.data', function (newFileData) {
            if (newFileData) {
                $scope.loadFile.parsedSize = bytesToSize(newFileData.size);
                $scope.loadFile.lines = countLines(newFileData.content);
                parseMap(newFileData.content, newFileData.name);
            }
        });

        /**
         * Handle uploading map file to MTMapCenter database
         * @param {object} newFile
         */
        $scope.$watch('mapCenter.mapUpload.data', function (newFile) {
            if (newFile) {
                $scope.mapCenter.mapUpload.state.color = 'info';
                $scope.mapCenter.mapUpload.state.msg = 'MAP.SENDING';
                mtMapService
                    .setMineMap(newFile.content, newFile.name, function () {
                        $scope.mapCenter.mapUpload.state.color = 'success';
                        $scope.mapCenter.mapUpload.state.msg = 'MAP.SEND_SUCC';
                        $scope.getMineMapNames();
                    }, function (soapError) {
                        $scope.mapCenter.mapUpload.state.color = 'danger';
                        $scope.mapCenter.mapUpload.state.msg = 'MAP.ERROR.SEND';
                        $scope.mapCenter.mapUpload.state.details = soapError.httpText + ' - ' + soapError.httpCode;
                    });
            }
        });

        $scope.handleLoadFileEvent = function (event, type) {
            switch (type) {
            case 'change':
                $scope.loadFile.state.msg = 'MAP.FILE.READING';
                $scope.loadFile.state.type = 'info';
                break;
            case 'load':
                $scope.loadFile.state.msg = 'MAP.FILE.LOADED';
                $scope.loadFile.state.type = 'success';
                break;
            case 'error':
                $scope.loadFile.state.msg = 'MAP.FILE.ERROR';
                $scope.loadFile.state.type = 'danger';
                break;
            default:
                $scope.loadFile.state.msg = undefined;
            }
        };

        $scope.extrapolateToGrid = function (layer) {
            mapModel.extrapolateToGrid(layer);
        };

        $scope.exportAsJson = function () {
            console.log('Exporting map to ' + $scope.export.filename + ' please wait...');
            var mapData = mapModel.getMapDataForExport(mapModel.layers);
            mtUtil.saveAsJson(mapData, $scope.export.filename);
        };

        /**
         * If default database map is not specified or download fails a fallback
         * map will get loaded if possible.
         */
        if (angular.isNumber($scope.map.default_map_id)) {
            mtMapService.getMineMap($scope.map.default_map_id,
                parseMap, function (soapError) {
                    console.error('Loading default map error', soapError);
                    loadFallbackMap();
                });
        } else {
            loadFallbackMap();
        }
    }
    MapInfoCtrl.$inject = ['$scope', '$timeout', 'mapModel', 'config', 'mtMapService', '$filter', 'mtUtil'];

    return MapInfoCtrl;
});