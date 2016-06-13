define(['angular', 'jquery', 'moment', 'jquery.soap'], function (angular, $, moment) {
    'use strict';
    /**
     * Consumer of MTMapService web service
     * @returns {object} angular factory
     */
    function mtMapService() {
        /**
         * Creates SOAP request for MTMapCenter
         * @param {type} method
         * @param {type} data
         * @param {type} onSuccess
         * @param {type} onError
         * @returns {undefined}
         */
        function soapRequest(method, data, onSuccess, onError) {
            $.support.cors = true;
            var xhr = $.soap({
                url: 'ws/MTMapService/MapControls/',
                HTTPHeaders: {
                    'Access-Control-Allow-Origin': '*'
                },
                envAttributes: {
                    'xmlns:mtm': 'http://mtmapcenter.minetronics.com/'
                },
                appendMethodToURL: false,
                method: method,
                elementName: 'mtm:' + method,
                data: data,
                success: onSuccess,
                error: onError
            });
            xhr.withCredentials = false;
            xhr.crossDomain = true;
        }

        /**
         * Requests MTMapCenter for map with given id. Received map data is decoded
         * from base64 string.
         * @param {type} id
         * @param {type} onSucc
         * @param {type} onErr
         * @returns {undefined}
         */
        function getMineMap(id, onSucc, onErr) {
            soapRequest('getMineMap', {map_id: id},
                function (soapSuccess) {
                    if (angular.isFunction(onSucc)) {
                        var mapData = $(soapSuccess.content).find('mapData').get(0).textContent,
                            mapName = $(soapSuccess.content).find('name').get(0).textContent;
                        onSucc(atob(mapData), mapName);
                    }
                },
                function (soapError) {
                    if (angular.isFunction(onErr)) {
                        onErr(soapError);
                    }
                });
        }

        /**
         * Requests MTMapCenter to return all available maps for download.
         * @param {type} onSucc
         * @param {type} onErr
         * @returns {undefined}
         */
        function getMineMapNames(onSucc, onErr) {
            soapRequest('getMineMapNames', {},
                function (soapSuccess) {
                    var namesArr = $(soapSuccess.content).find('MineMapName').map(function (i, e) {
                        return {
                            id: e.children[0].textContent,
                            name: e.children[1].textContent,
                            ts: moment(e.children[2].textContent).format('YYYY-MM-DD HH:mm:ss')
                        };
                    });
                    if (angular.isFunction(onSucc)) {
                        onSucc(namesArr);
                    }
                }, function (soapError) {
                    if (angular.isFunction(onErr)) {
                        onErr(soapError);
                    }
                });
        }

        /**
         * Uploads map to MTMapCenter. Map data is encoded to base64 string.
         * @param {type} mapData
         * @param {type} mapName
         * @param {type} onSucc
         * @param {type} onErr
         * @returns {undefined}
         */
        function setMineMap(mapData, mapName, onSucc, onErr) {
            soapRequest('setMineMap', {
                MapSimple: {
                    mapData: btoa(mapData),
                    name: mapName
                }
            }, function (soapSuccess) {
                if (angular.isFunction(onSucc)) {
                    onSucc();
                }
            }, function (soapError) {
                if (angular.isFunction(onErr)) {
                    onErr(soapError);
                }
            });
        }

        return {
            soapRequest: soapRequest,
            getMineMap: getMineMap,
            getMineMapNames: getMineMapNames,
            setMineMap: setMineMap
        };
    }

    return mtMapService;
});