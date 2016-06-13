'use strict';
module.exports = function (grunt) {
    /**
    * Forces grunt to run infinitely which is used to keep the server listening
    * for requests. By design task responsible for starting the server would 
    * stop the server as soon as all grunt tasks finishes.
    */
    grunt.registerTask('keepalive', 'Force grunt process running', function () {
        this.async();
        var showMsgInterval = grunt.option('show_keepalive');

        //Set default interval if no option value was passed
        if (showMsgInterval === true) {
            showMsgInterval = 10000;
        }
        if (showMsgInterval) {
            grunt.log.writeln('Task will print keepalive message each ' + showMsgInterval + 'ms.');
        }

        setInterval(function () {
            if (showMsgInterval) {
                grunt.log.writeln('Keep alive: ' + new Date());
            }
        }, showMsgInterval);
    });
};

