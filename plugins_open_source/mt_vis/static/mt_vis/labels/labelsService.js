define([
    'angular',
    'glmat',
    'underscore'
], function (angular, glmat, underscore) {
    'use strict';

    /**
     * Service for maintaining labels collection for nodes added to scene.
     * Each node can have one label associated with it. Label text is
     * stored as an array of strings for easy way of storing multiple
     * line label.
     *
     * @returns {object} angular factory
     */
    function labelsService() {
        /**
         * Label is associated with one node. It contains array of strings
         * to support multiline label. Label subscribes to three node
         * events:
         * -rendered - this is required for other events be published
         * -canvasPos - to get canvas position of node
         * -projPos - to get Z coordinate which will help on determining
         * if the label is in front or behind the camera.
         *
         * The visibile property will work only if field of view is
         * less or equal to 180 degrees.
         *
         * @param {SceneJS.Node} node Node associated with this label
         * @param {string[]} textArr Array of strings to be displayed
         * @param {string} type Additional information about label
         * @param {string} header Additional information about label
         * @param {integer} offX Canvas X coordinate offset of the label.
         * @param {integer} offY Canvas Y coordinate offset of the label.
         * @returns {_L2.labelModule.Label}
         */
        function Label(node, textArr, type, header, offX, offY) {
            var self = this,
                renderedHandle = node.on("rendered", angular.noop),
                canvasPosHandle = node.on("canvasPos", function (position) {
                    self.x = position.x;
                    self.y = position.y;
                }),
                worldPosHandle = node.on("projPos", function (position) {
                    self.visible = position.z >= 0;
                });

            self.node = node;
            self.textArr = textArr || [];
            self.offX = offX || 0;
            self.offY = offY || 0;
            self.x = -1;
            self.y = -1;
            self.visible = false;

            self.unsubscribe = function () {
                node.off(canvasPosHandle);
                node.off(worldPosHandle);
                node.off(renderedHandle);
            };
            self.type = type || "";
            self.header = header || "";
            self.active = true;
        }

        /**
         * Labels are stored in array rather than in Object because of
         * angular ng-repeat.
         * @type Array
         */
        var labels = [],
            styles = {
                defaultStyle: {
                    visibleName: "LABELS.DEFAULT",
                    activeColour: '#FFFFFF',
                    colourOnTimeout: '#A3A3A3',
                    timeout: 600,
                    fontSize: 14,
                    alwaysMaximized: false
                }
            };

        /**
         * Returns index of label in collection or -1 if it doesn't exists.
         * @param {SceneJS.Node} node
         * @returns {Number}
         */
        function indexOf(node) {
            var i;
            for (i = 0; i < labels.length; i++) {
                if (labels[i].node.id === node.id) {
                    return i;
                }
            }
            return -1;
        }

        /**
         * Adds label to collection or overwrites existing one if node.id
         * is present in the collection.
         * @param {Label} label
         * @returns {Label} label
         */
        function add(label) {
            var index = indexOf(label.node);
            if (index !== -1) {
                labels[index] = label;
            } else {
                labels.push(label);
            }
            return label;
        }

        /**
         * Creates new Label object and adds it to collection;
         * @param {SceneJS.Node} node
         * @param {string[]} text
         * @param {string} type
         * @param {string} header
         * @param {number} offX
         * @param {number} offY
         * @returns {drawing_L24.Label}
         */
        function addNew(node, text, type, header, offX, offY) {
            return add(new Label(node, text, type, header, offX, offY));
        }

        /**
         * Removes node's label from collection.
         * @param {SceneJS.Node} node
         * @returns {undefined}
         */
        function removeNodeLabel(node) {
            var index = indexOf(node), label;
            if (index !== -1) {
                label = labels[index];
                labels.splice(index, 1);
                label.unsubscribe();
            }
            return label;
        }

        /**
         * Searches collection for label for node with given id.
         * @param {type} id
         * @returns {unresolved}
         */
        function findLabelByNodeID(id) {
            var i;
            for (i = 0; i < labels.length; i++) {
                if (labels[i].node.id === id) {
                    return labels[i];
                }
            }
            return null;
        }

        /**
         * Calculates if two labels collide with each other. Require labels
         * to have jQuery height() and width() methods. Margin param specify
         * how far from each other labels must be to not collide.
         *
         * @param {type} l1
         * @param {type} l2
         * @param {type} margin
         * @returns {Boolean}
         */
        function doLabelsCollide(l1, l2, margin) {
            var l1top = l1.y + l1.offY,
                l1bottom = l1top + l1.$label.height() + margin,
                l1left = l1.x + l1.offX,
                l1right = l1left + l1.$label.width() + margin,
                l2top = l2.y + l2.offY,
                l2bottom = l2top + l2.$label.height() + margin,
                l2left = l2.x + l2.offX,
                l2right = l2left + l2.$label.width() + margin;

            return !((l1bottom <= l2top) ||
                     (l1top >= l2bottom) ||
                     (l1right <= l2left) ||
                     (l1left >= l2right));
        }

        /**
         * Spreads colliding displayed labels with given spead. To completely
         * space out labels (they are not overlapping each other) this function
         * needs to be called multiple times.
         *
         * For each label a normalized move (spread) vector is calculated which
         * modifies the label offX and offY values, efectively moving the label.
         * This vector is scaled by the speed parameter to increase the lenght
         * of move vector.
         *
         * If mouse cursor is over label, that label will not move.
         *
         * !! Because labels can have dynamic width and height it's being
         * calculated using jQuery. When Label object is created, mt-label
         * directive will attach a $label property to it. Labels without
         * $label will not be spread out.
         *
         * @param {type} speed How big are the movement steps (default ~1px)
         * @param {type} margin Additional margin labels should have (default 0)
         * @returns {undefined}
         */
        function spreadLabels(speed, margin) {
            var areOverlapping = false, i, l1, l2, l1Center, move, j, l2Center, diff, scale, offX, offY;
            for (i = 0; i < labels.length; i++) {
                l1 = labels[i];

                if (!l1.$label || l1.mouseover) {
                    continue;
                }

                l1Center = glmat.vec2.fromValues(l1.x, l1.y);
                move = glmat.vec2.create();

                for (j = 0; j < labels.length; j++) {
                    if (i === j) {
                        continue;
                    }

                    l2 = labels[j];

                    if (!l2.$label) {
                        continue;
                    }

                    if (!doLabelsCollide(l1, l2, margin || 0)) {
                        continue;
                    }
                    areOverlapping = true;

                    l2Center = glmat.vec2.fromValues(l2.x, l2.y);

                    diff = glmat.vec2.create();
                    glmat.vec2.sub(diff, l1Center, l2Center);

                    if (glmat.vec2.len(diff)) {
                        scale = 1 / glmat.vec2.len(diff);
                        glmat.vec2.normalize(diff, diff);
                        glmat.vec2.scale(diff, diff, scale);
                        glmat.vec2.add(move, move, diff);
                    } else {
                        offX = l1.offX - l2.offX;
                        offY = l1.offY - l2.offY;
                        glmat.vec2.add(move, move, glmat.vec2.fromValues(offX || 1, offY || 1));
                    }
                }

                if (glmat.vec2.len(move)) {
                    glmat.vec2.normalize(move, move);
                    glmat.vec2.scale(move, move, speed || 1);
                }

                l1.offX += move[0];
                l1.offY += move[1];
            }
            return areOverlapping;
        }

        /**
         * Adds new styles
         * @param {type} stylesArr
         * @returns {undefined}
         */
        function addStyles(stylesArr) {
            var i, style;
            for (i = 0; i < stylesArr.length; i++) {
                style = stylesArr[i];
                if (style.type && style.visibleName) {
                    underscore.defaults(style, styles.defaultStyle);
                    styles[style.type] = style;
                } else {
                    console.error("Labels.addStyle: Missing style.type or style.visibleName: ", style);
                }
            }
        }

        /**
         * Returns style object by name or the default style object if not found.
         * @param {string} type Name of the style to return
         * @returns {object} Style definition
         */
        function getStyle(type) {
            return styles[type] || styles.defaultStyle;
        }

        return {
            create: Label,
            collection: labels,
            add: add,
            addNew: addNew,
            remove: removeNodeLabel,
            findByID: findLabelByNodeID,
            indexOf: indexOf,
            spread: spreadLabels,
            styles: styles,
            addStyles: addStyles,
            getStyle: getStyle,
            options: {
                automaticSpread: true,
                maximizeAll: false
            }
        };
    }

    return labelsService;
});

