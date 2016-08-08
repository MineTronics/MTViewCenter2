define(['angular'], function (angular) {
    'use strict';
    /**
     * Enchances file type input to automatically read files as string and save 
     * contents on the scope.
     * @returns {object} directive
     */
    function fileread() {
        return {
            scope: {
                fileread: '=',
                onFileReadEvent: '&?'
            },
            link: function (scope, element) {
                /**
                 * Call onFileReadEvent listener about file read event.
                 * @param {object} event FileReader event
                 * @param {string} type event type
                 * @returns {undefined}
                 */
                function sendEvent(event, type) {
                    if (angular.isFunction(scope.onFileReadEvent)) {
                        scope.onFileReadEvent({
                            event: event,
                            type: type
                        });
                    }
                }

                /**
                 * Load file when user selects a file.
                 * @param {object} changeEvent FileReader event
                 */
                element.bind('change', function (changeEvent) {
                    sendEvent(changeEvent, 'change');
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        sendEvent(loadEvent, 'load');
                        scope.$apply(function () {
                            scope.fileread = {
                                name: changeEvent.target.value,
                                size: loadEvent.loaded,
                                content: loadEvent.target.result
                            };
                        });
                    };
                    reader.onerror = function (errorEvent) {
                        sendEvent(errorEvent, 'error');
                    };

                    reader.readAsBinaryString(changeEvent.target.files[0]);
                });
            }
        };
    }

    return fileread;
});