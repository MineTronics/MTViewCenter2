module.exports = function (grunt) {
    'use strict';

    function buildAppConfigTask() {
        var task = this;
        if (!task.files.length) {
            grunt.fail.fatal('There is no file specified for client configuration. Please check Gruntfile configuration for build-config task.');
        }
        task.files.forEach(function (file) {
            grunt.file.write(file.dest, JSON.stringify(grunt.config.get('appConfig')));
            grunt.log.writeln('Created application configuration file '.green + file.dest + '.');
        });
    }
    grunt.registerMultiTask('build-app-config', 'Builds app-config.json', buildAppConfigTask);
};

