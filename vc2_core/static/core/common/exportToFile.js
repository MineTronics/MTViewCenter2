define([], function () {
    'use strict';

    /**
     * Exports data to file, optionaly stringifies it to JSON.
     * @param {object} data Data to be saved
     * @param {string} fileName Name of the file.
     * @param {string} type File type one of the following: xml, json, txt (default)
     */
    function exportToFile(data, filename, type) {
        var blob, blobType, e, a;
        if (!data) {
            console.error('mt.common.exportToFile: No data');
            return;
        }

        if (!type) {
            type = 'txt';
        }

        switch (type) {
        case 'json':
            blobType = 'text/json';
            break;
        case 'xml':
            blobType = 'text/xml';
            break;
        default:
            blobType = 'text/plain';
        }

        if (!filename) {
            filename = 'file.' + type;
        }

        if (typeof data === 'object' && type === 'json') {
            data = JSON.stringify(data, undefined, 4);
        }

        if (typeof data === 'object' && type === 'xml') {
            data = new XMLSerializer().serializeToString(data);
        }

        blob = new Blob([data], {type: blobType});
        e = document.createEvent('MouseEvents');
        a = document.createElement('a');

        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl =  [blobType, a.download, a.href].join(':');
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    }

    return exportToFile;
});