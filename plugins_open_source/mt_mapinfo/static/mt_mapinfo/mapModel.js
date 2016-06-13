define(['core/common/mt_pubsub', 'angular'], function (mtPubSub, angular) {
    'use strict';

    function mapModel(drawing, camera, colorHelper, config) {
        /**
         * Map raw data is stored in tree structure. Each layer holds information
         * about attached nodes. This information is used to tell drawing interface
         * what needs to be drawn.
         */
        var layers = {},
            info = {},
            parsers = {},
            postponedMap = null,
            logger = mtPubSub(),
            options = {
                ignoredLayers: [],
                gridAlign: {
                    x: 0,
                    y: 1,
                    z: 0
                },
                gridSize: 1
            },
            typeMap = {
                'MT.nodes': 'nodes',
                'MT.edges': 'edges',
                'MT.grids': 'mt_grid_line'
            };

        /**
         * Tries to retrieve file's extension. Optimistically removes '/' to get
         * last part which supposed to be a filename.
         *
         * ""                            -->   ""
         * "name"                        -->   ""
         * "name.txt"                    -->   "txt"
         * ".htpasswd"                   -->   ""
         * "name.with.many.dots.myext"   -->   "myext"
         * @param {String} file File name
         * @returns {String} extension string in lower case or empty string
         */
        function getFileExtension(file) {
            return file.substr((Math.max(0, file.lastIndexOf(".")) || Infinity) + 1).toLowerCase();
        }

        /**
         * Constructs MT Layer by initilizing it with passed layer data.
         * @param {object} layerData Data used to initialize the layer, like name
         * or visiblity.
         * @param {string[]} ignoredArr List of ids of the ignored layers 
         * @returns {object} MT Layer
         */
        function makeMTLayer(layerData, ignoredArr) {
            var i, isIgnored = false;
            for (i = 0; ignoredArr && !isIgnored && i < ignoredArr.length; i++) {
                isIgnored = (layerData.name === ignoredArr[i]);
            }
            layerData.visibility = !!layerData.visibility;
            layerData.color = layerData.color || {r: 40.0 / 255, g: 40.0 / 255, b: 200.0 / 255};
            layerData.nodes = {};
            layerData.edges = {};
            layerData.mt_grid_line = {};
            layerData.nodeSize = layerData.size || [0.3, 0.3, 0.3];
            layerData.isIgnored = isIgnored;
            return layerData;
        }

        /**
         * Saves element details in the map tree, so when map is being drawn it
         * knows how to draw it. Elements attached to ignored layer or defining
         * ignored layer itself are ignored.
         *
         * @param {type} e
         * @param {type} type
         * @returns {undefined}
         */
        function addElement(e, type) {
            switch (type) {
            case 'dxfHeader':
                info.dxfHeader = e;
                break;
            case 'mtlayer':
                if (!layers[e.name]) {
                    e.color = colorHelper.HexToRGB(e.color);
                    layers[e.name] = makeMTLayer(e, options.ignoredLayers);
                }
                break;
            default:
                //Set default layer id if there is none specified for this element.
                //It enforces that all elements belong to some layer.
                if (!e.layer) {
                    e.layer = "Default";
                }

                //Initilize layer with default properties
                if (!layers[e.layer]) {
                    layers[e.layer] = makeMTLayer({name: e.layer, visibility: true});
                }

                //Destroy view model for this element if it was already drawn
                if (layers[e.layer][type][e.id] && layers[e.layer][type][e.id].node) {
                    layers[e.layer][type][e.id].node.destroy();
                    layers[e.layer][type][e.id].node = null;
                }

                //Set new element in the map tree, so the scene will know how to draw it
                layers[e.layer][type][e.id] = e;
            }
        }

        /**
         * Handle request for drawing a map. If there is no parser for given map
         * format the data is saved and used after such parser has instantiated.
         *
         * @param {object} data - ajax returned data
         * @param {string} filename file name of the received data
         * @returns {undefined}
         */
        function parseMapData(data, filename) {
            var extension = getFileExtension(filename);
            if (extension === '') {
                throw "Could not determine file extension.";
            }
            if (!parsers[extension]) {
                postponedMap = {data: data, filename: filename, format: extension};
                throw 'Type:"' + extension + '" parser is not available. Map will be drawn after loading required parser.';
            }
            //Free potential resources
            postponedMap = null;
            parsers[extension](data, addElement);
            //Remove nodes which are in map tree, but are not in ajax call.
            //These nodes were removed by somebody else or added to scene, but not
            //pushed to database.
        }

        /**
         * Register new map data parser and load any waiting map to be loaded.
         * @param {string} type File type which this parser can handle
         * @param {function} parser Parsing function which takes raw map data
         * and creates drawable map elements.
         * @returns {undefined}
         */
        function addParser(type, parser) {
            console.log(type, parser);
            if (angular.isFunction(parser)) {
                parsers[type] = parser;
                if (postponedMap && postponedMap.format === type) {
                    parseMapData(postponedMap.data, postponedMap.filename);
                }
            } else {
                throw "Parser parameter should be a function with data and addElement function parameters.";
            }
        }

        /**
         * Parses object parsed from JSON. Expected object structure:
         * {
         *    "MT.nodes":
         *       [
         *          {
         *             "id": "123",
         *             "x": "123",
         *             "y": "123",
         *             "z": "123"
         *          }
         *       ],
         *    "MT.edges":
         *       [
         *          {
         *             "id": "124",
         *             "from": "123",
         *             "to": "123"
         *          }
         *       ]
         * }
         * @param {type} json
         * @param {function} addElement function to call on parsed elements to
         *                              add them to the model
         * @returns {undefined}
         */
        function parseJSON(json, addElement) {
            var jsonMap = angular.fromJson(json);

            Object.keys(jsonMap).forEach(function (elementType) {
                if (typeMap[elementType]) {
                    jsonMap[elementType].forEach(function (mapElement) {
                        addElement(mapElement, typeMap[elementType]);
                    });
                }
            });
        }

        /**
         * Set JSON as available parser
         */
        addParser('json', parseJSON);

        /**
         * Functor setting reference to SceneJS.mt-node node or SceneJS.mt-edge
         * node for given element.
         *
         * @param {type} element
         * @returns {Function}
         */
        function setSceneJSNode(element) {
            return function (newNode) {
                element.node = newNode;
            };
        }

        /**
         * Draws nodes and edges attached to the layer.
         *
         * @param {type} layer
         * @param {type} l_id
         * @returns {undefined}
         */
        function drawLayerElements(layer, l_id) {
            var countNodes = 0,
                countEdges = 0,
                countGrids = 0,
                n_id,
                mtnode,
                e_id,
                edge;
            for (n_id in layer.nodes) {
                if (layer.nodes.hasOwnProperty(n_id)) {
                    mtnode = layer.nodes[n_id];
                    if (mtnode.node) {
                        mtnode.node.destroy();
                    }
                    drawing.createNode(n_id, mtnode.x, mtnode.y, mtnode.z, l_id, setSceneJSNode(layer.nodes[n_id]), layer.nodeSize);
                    countNodes++;
                }
            }
            for (e_id in layer.edges) {
                if (layer.edges.hasOwnProperty(e_id)) {
                    edge = layer.edges[e_id];
                    if (edge.node) {
                        edge.node.destroy();
                    }
                    if (layer.nodes[edge.from] && layer.nodes[edge.to]) {
                        drawing.createEdge(e_id, layer.nodes[edge.from], layer.nodes[edge.to], layer.nodeSize[0], layer.nodeSize[1], l_id, setSceneJSNode(layer.edges[e_id]));
                        countEdges++;
                    } else {
                        console.log("Could not find edge nodes ", edge.id, edge.from, layer.nodes[edge.from], edge.to, layer.nodes[edge.to], layer.nodes);
                    }
                }
            }
            Object.keys(layer.mt_grid_line).forEach(function (gridID) {
                var grid = layer.mt_grid_line[gridID];
                if (layer.nodes[grid.from] && layer.nodes[grid.to]) {
                    layer.node.addNode({
                        type: 'mt_grid_line',
                        modelNodeId: gridID,
                        a: layer.nodes[grid.from],
                        b: layer.nodes[grid.to],
                        align: grid.align || options.gridAlign,
                        layer: layer.node,
                        size: grid.size || options.gridSize,
                        color: layer.color
                    });
                    countGrids++;
                }
            });
            console.log('Built ' + countNodes + ' nodes, ' + countEdges + ' edges' +
                ' and ' + countGrids + ' grids for layer ' + layer.name);
        }

        /**
         * Functor setting reference to SceneJS.mt-layer node for given layer
         * @param {type} layer
         * @returns {Function}
         */
        function setLayerNode(layer) {
            return function (newLayerNode) {
                layer.node = newLayerNode;
                drawLayerElements(layer, layer.node.id);
            };
        }

        /**
         * Parses map tree to draw required layers and all elements attached to
         * them using drawing interface.
         *
         * @returns {undefined}
         */
        function drawMap() {
            var layerName, layer;
            for (layerName in layers) {
                if (layers.hasOwnProperty(layerName)) {
                    layer = layers[layerName];
                    if (!layer.isIgnored) {
                        console.log("Drawing layer: " + layerName);
                        if (!layer.node) {
                            drawing.addLayer(layer.name, layer.visibility, layer.priority, layer.color, setLayerNode(layer));
                        } else {
                            drawLayerElements(layer, layer.node.id);
                        }
                    }
                }
            }
        }

        /**
         * Compares current min and max coordinates with given node's coordinates
         * and sets the appropriate values for passed min and max objects.
         * @param {type} node
         * @param {type} min
         * @param {type} max
         * @returns {undefined}
         */
        function setMinMax(node, min, max) {
            min.x = min.x ? Math.min(min.x, node.x) : node.x;
            min.y = min.y ? Math.min(min.y, node.y) : node.y;
            min.z = min.z ? Math.min(min.z, node.z) : node.z;
            max.x = max.x ? Math.max(max.x, node.x) : node.x;
            max.y = max.y ? Math.max(max.y, node.y) : node.y;
            max.z = max.z ? Math.max(max.z, node.z) : node.z;
        }

        /**
         * Calculates initial camera position with some pre-set positions.
         * @returns {undefined}
         */
        function setCamera() {
            var min = {}, max = {}, l_id, n_id, views, view, i;
            /**
             * Set map dimensions based on DXF header
             */
            if (info.dxfHeader) {
                max = info.dxfHeader.$EXTMAX;
                min = info.dxfHeader.$EXTMIN;
            } else {
                //Temporary fix with angular.fromJson after adding parsers
                for (l_id in layers) {
                    if (layers.hasOwnProperty(l_id)) {
                        for (n_id in layers[l_id].nodes) {
                            if (layers[l_id].nodes.hasOwnProperty(n_id)) {
                                setMinMax(layers[l_id].nodes[n_id], min, max);
                            }
                        }
                    }
                }
            }

            if (min && max) {
                camera.prepareCameraViews(min, max);
                views = camera.getViews();
                for (i = 0; i < views.length && !view; i++) {
                    if (views[i].name === config.data.camera_default_view_name) {
                        view = views[i];
                    }
                }
                camera.setView(view || views[0]);
            }
        }

        drawing.menu.right.items.push({
            heading: 'MAP.LAYER.HEADER',
            body: '<layer-panel/>'
        });

        function destroyMap() {
            var l_id;
            for (l_id in layers) {
                if (layers.hasOwnProperty(l_id)) {
                    if (layers[l_id].node) {
                        layers[l_id].node.destroy();
                    }
                    delete layers[l_id];
                }
            }
        }

        /**
         * Returns if current map model doesn't have any layer (elements) thus
         * is empty and doesn't need to be destroyed explicitly to retrieve
         * resources.
         * @returns {Boolean}
         */
        function isEmpty() {
            var l_id;
            for (l_id in layers) {
                if (layers.hasOwnProperty(l_id)) {
                    return false;
                }
            }
            return true;
        }

        /**
         * Clones MT Node attached to given layer
         * @param {object} mtNode
         * @param {string} layerName
         * @returns {mapModel_L1.mapModel.cloneNodeForGrid.mapModelAnonym$3}
         */
        function cloneNodeForGrid(mtNode, layerName) {
            return {
                id: mtNode.id + '_' + layerName,
                x: mtNode.x,
                y: mtNode.y,
                z: mtNode.z,
                layer: layerName
            };
        }

        /**
         * Extrapolates 3D lines represented by mt_edge to grids represented by
         * mt_grid_line and adds them to new layer called layer name appended 
         * with '_extrapolated'.
         * @param {object} layer
         * @returns {undefined}
         */
        function extrapolateToGrid(layer) {
            var layerName = layer.name + '_extrapolated',
                gridLayer = layers[layerName],
                edges,
                nodes;
            if (gridLayer && gridLayer.node) {
                gridLayer.node.destroy();
            } else {
                gridLayer = makeMTLayer({
                    name: layerName
                }, options.ignoredLayers);
                layers[layerName] = gridLayer;
            }

            edges = layers[layer.name].edges;
            nodes = layers[layer.name].nodes;
            Object.keys(edges).forEach(function (edgeID) {
                var nodeFrom = nodes[edges[edgeID].from],
                    nodeTo = nodes[edges[edgeID].to];
                nodeFrom = cloneNodeForGrid(nodeFrom, layerName);
                nodeTo = cloneNodeForGrid(nodeTo, layerName);
                addElement(nodeFrom, 'nodes');
                addElement(nodeTo, 'nodes');
                addElement({
                    id: edgeID + '_' + layerName,
                    from: nodeFrom.id,
                    to: nodeTo.id,
                    layer: layerName,
                    align: options.gridAlign,
                    size: options.gridSize
                }, 'mt_grid_line');
            });
        }

        /**
         * Returns layers data as one object for exporting
         * @param {object} layers
         * @returns {String}
         */
        function getMapDataForExport(layers) {
            var mapData = {
                'MT.nodes': [],
                'MT.edges': [],
                'MT.grids': []
            };
            Object.keys(layers).forEach(function (layerID) {
                var layer = layers[layerID];
                Object.keys(layer.nodes).forEach(function (nodeId) {
                    var node = layer.nodes[nodeId];
                    mapData['MT.nodes'].push({
                        id: node.id,
                        x: node.x,
                        y: node.y,
                        z: node.z,
                        layer: node.layer
                    });
                });

                Object.keys(layer.edges).forEach(function (edgeID) {
                    var edge = layer.edges[edgeID];
                    mapData['MT.edges'].push({
                        id: edge.id,
                        from: edge.from,
                        to: edge.to,
                        layer: edge.layer
                    });
                });

                Object.keys(layer.mt_grid_line).forEach(function (gridID) {
                    var grid = layer.mt_grid_line[gridID];
                    mapData['MT.grids'].push({
                        id: grid.id,
                        from: grid.from,
                        to: grid.to,
                        layer: grid.layer,
                        align: grid.align,
                        size: grid.size
                    });
                });
            });
            return mapData;
        }

        return {
            info: info,
            layers: layers,
            destroyMap: destroyMap,
            parseMapData: parseMapData,
            drawMap: function () {
                drawMap();
                setCamera();
            },
            addParser: addParser,
            logger: logger,
            isEmpty: isEmpty,
            options: options,
            extrapolateToGrid: extrapolateToGrid,
            getMapDataForExport: getMapDataForExport
        };
    }
    mapModel.$inject = ['drawingService', 'cameraService', 'mtColorHelper', 'config'];

    return mapModel;
});
