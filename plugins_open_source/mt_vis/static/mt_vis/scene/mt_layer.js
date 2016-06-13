
/**
 * Custom node representing a map layer.
 *
 *  {
 *      type: "mt_layer",
 *      id: "layer1234",
 *      name: "my layer",
 *      visible: true,
 *      priority: 1, //The higher the value, the higher the priority is
 *      color: {r: red, g: green, b: blue}
 *  }
 *
 *  Each Layer node contains two sets of nodes:
 *  1. Nodes that are associated to this layer.
 *  2. Nodes that are connected to material node to make them appear in the scene.
 *
 *  On each action which would alter the mine graph, such as adding node,
 *  removing node, changing visibility of this layer, changing priority of this
 *  layer, removing layer, these two sets are updated to maintain the consistency.
 *
 *  Nodes which are displayed are connected to the material node, which belongs
 *  to the visible layer with highest priority.
 *
 *  Node can be in 2nd set only if it is in 1st set.
 *  
 *  @param {object} SceneJS library reference
 */
define(['scenejs'], function (SceneJS) {
    'use strict';
    SceneJS.Types.addType("mt_layer", {
        construct: function (params) {
            var defaultColor = params.color || {r: 1, g: 1, b: 1},
                layer = this.addNode({
                    type: "layer",
                    priority: params.priority,
                    enabled: params.visible
                }),
                name = params.name;

            /**
             * @public
             * Getters and setters
             */
            this.getName = function () {
                return name;
            };
            this.setName = function (newName) {
                name = newName;
            };
            this.getDefaultColor = function () {
                return defaultColor;
            };

            /*
             * Performs depth first search to change color of all material sub-nodes.
             * @param {object} checkNode
             */
            function updateMaterialNodes(checkNode) {
                var i, node;
                for (i = 0; i < checkNode.nodes.length; i++) {
                    node = checkNode.nodes[i];
                    if (node.type === "material") {
                        node.setColor(defaultColor);
                    }
                    if (node.type !== "mt_select_node") {
                        updateMaterialNodes(node);
                    }
                }
            }

            /*
             * Sets default color for this layer and optionaly updates color of all
             * sub-nodes of this layer.
             * @param {type} color
             * @param {type} forceUpdate
             * @returns {undefined}
             */
            this.setDefaultColor = function (color, forceUpdate) {
                defaultColor = color;
                if (forceUpdate) {
                    updateMaterialNodes(this);
                }
            };
            this.addNode = function (node, callback) {
                layer.addNode(node, callback);
            };
            this.isVisible = function isVisible() {
                return layer.getEnabled();
            };
            this.setVisible = function setVisible(newVisible) {
                layer.setEnabled(newVisible);
            };
            this.getPriority = function getPriority() {
                return layer.getPriority();
            };
            this.setPriority = function setPriority(priority) {
                layer.setPriority(priority);
            };
        }
    });
});
