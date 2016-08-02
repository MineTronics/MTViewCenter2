define(['angular'], function (angular) {
    'use strict';
    /**
     * Enchances file type input to automatically read files as string and save 
     * contents on the scope.
     * @returns {object} directive
     */
    function mtFileRead() {
        return {
            scope: {
                onEvent: '&'
            },
            link: function (scope, element) {
                /**
                 * Call onEvent listener about file read event.
                 * @param {object} event onEvent event
                 * @param {string} type event type
                 * @returns {undefined}
                 */
                function sendEvent(event, type) {
                    console.log('sending event', scope.onEvent);
                    if (angular.isFunction(scope.onEvent)) {
                        scope.onEvent({
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
                    var reader = new FileReader(), i;
                    reader.onload = function (loadEvent) {
                        sendEvent(loadEvent, 'load');
                        var loadedFile  = {
                            name: changeEvent.target.value,
                            size: loadEvent.loaded,
                            content: loadEvent.target.result
                        };
                        sendEvent(loadedFile, 'mtLoadedFile');
                        i++;
                        if (changeEvent.target.files[i]) {
                            reader.readAsBinaryString(changeEvent.target.files[i]);
                        }
                    };
                    reader.onerror = function (errorEvent) {
                        sendEvent(errorEvent, 'error');
                        i++;
                        if (changeEvent.target.files[i]) {
                            reader.readAsBinaryString(changeEvent.target.files[i]);
                        }
                    };

                    i = 0;
                    //Read first file
                    if (changeEvent.target.files[i]) {
                        reader.readAsBinaryString(changeEvent.target.files[i]);
                    }
                });
            }
        };
    }

    return mtFileRead;
});