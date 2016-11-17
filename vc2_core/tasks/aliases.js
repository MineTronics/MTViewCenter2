  /**
 * Defines aliases for build tasks
 * 
 * test - runs unit tests, jslint check and langage consistency check
 * dev - development task
 * prod - creates production release
 * run - runs release
 * 
 * @param {type} grunt
 * @returns {undefined}
 */

'use strict';
module.exports = function (grunt) {
    var serverTasks = grunt.config('serverTasks') || [],
        devTasks,
        runProdServerTasks;

    grunt.registerTask('test', 'Runs JSlint and test specs against source files', [
        //Check for style errors in js source files
        'jslint',
        'clean:buildDir',
        'copy:coreFiles',
        'copy:customFiles',
        'build_lang_files',
        'build-app-config',
        'jasmine:browser_static'
    ]);

    devTasks = [
        //Check the source for possible bugs and style inconsistencies
        'jslint',
        //Clean build directory
        'clean:buildDir',
        //Copy vc2_core/static, vc2_core/test, vc2_core/views to build
        //Copy libraries static files to build
        //Copy plugins static files to build
        'copy:coreFiles',
        'copy:customFiles',
        //Build i18n assets
        'build_lang_files',
        //Create browser config file by extracting it from config.js
        'build-app-config',
        //Run unit tests
        'jasmine:browser_static',
        //Copy source files (:dev target will NOT concatenate and minify it)
        'requirejs:dev',
        //Concatenate all the css files to one file
        'concat:css',
        //Start livereload server to reload browser on source changes
        'livereload-start',
        //Configure authentication handler (run with --no_auth to turn it off)
        'mt_auth',
        //Run the development server
        'express:dev'
    ].concat(serverTasks);

    //Regarde is watching for source files changes to trigger livereload
    devTasks.push('regarde');
    grunt.registerTask('dev', 'Builds the project and starts the development server', devTasks);

    grunt.registerTask('prod', 'Alias for running tasks during staging production', [
        //Check the source for possible bugs and style inconsistencies
        'jslint',

        //Clean both the build and dist directories
        'clean',

        //Copy vc2_core/static, vc2_core/test, vc2_core/views to build
        //Copy libraries static files to build
        //Copy plugins static files to build
        'copy:coreFiles',
        'copy:customFiles',
        //Build i18n assets
        'build_lang_files',
        //Create browser config file by extracting it from config.js
        'build-app-config',
        //Run unit tests
        'jasmine:browser_static',
        //Copy, concatenate and minify source files - no additional shim or paths configuration is required
        'requirejs:prod',

        //Concatenate and minify the css files
        'cssmin:prod'

        //Copy the build folder and server files to dist folder
//        'copy'
    ]);

    runProdServerTasks = [
        //Configure authentication handler (run with --no_auth to turn it off)
        'mt_auth',

        //Run the production server
        'express:prod'
    ];
    runProdServerTasks.concat(serverTasks);

    //Keepalive will keep grunt process running 
    runProdServerTasks.push('keepalive');

    /**
     * Run 'grunt run' to start the production server
     */
    grunt.registerTask('run', runProdServerTasks);
};