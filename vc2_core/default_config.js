/*
 * Default configuration file copied and renamed to 'config.js' if it's not present.
 * To configure application use 'config.js' file. This file should contain only
 * 'factory' like settings.
 */

module.exports = {
    //Where plugins are located
    pluginsDirs: [
        './plugins_proprietary',
        './plugins_open_source'
    ],
    //Which plugins are enabled and should be loaded (doesn't mean running in browser)
    loadPlugins: [
        'mt_config', 'mt_login_form', 'mt_vis', 'mt_mapinfo'
    ],
    //Start of app config
    //To edit appConfig of deployed application please edit
    //`/public/core/config/app-config.json` instead. This file is used to
    //generate app-config.json with 'build-app-config' grunt task.
    //
    //App config is what is being sent to browser to set application defaults
    appConfig: {
        /**
         * List of available plugins
         *
         * exampleOfPlugin: {
         *  //Path to requirejs module to load the plugin contents
         *  //Path is added automatically by mt_util.addPluginModule method
         *  modulePath: 'plugins_open_source/examplePlugin/static/examplePlugin',
         *
         *  //Should this plugin start automatically after running application
         *  autostart: true,
         *
         *  //Displayed name of the plugin
         *  //Please note this is an angular translate key
         *  title: 'CONFIG.TITLE',
         *
         *  //Displayed description of the plugin
         *  //Please note this is an angular translate key
         *  description: 'CONFIG.DESC',
         *
         *  //Plugin's version number.
         *  version: 2.0,
         *
         *  //List of plugins on which this plugin depends on and should be
         *  //excluded from plugin bundle. Requirejs optimizer would duplicate
         *  //the plugin and its dependecies in plugin bundle otherwise. Please
         *  //double check this list with plugin's define call to maintain
         *  //consistency
         *  pluginDeps: ['mt_config']
         *
         *  //Plugin's tab to be injected to the page
         *  tab: {
         *      //Plugin's tab title
         *      //Please note this is an angular translate key
         *      title: 'CONFIG.TITLE',
         *
         *      //HTML contents of the plugin's tab
         *      content: '<example-plugin-tab></example-plugin-tab>',
         *
         *      //Should this tab be displayed in fullscreen mode - all
         *      //available browser window space will be used
         *      //false by default
         *      fullscreen: false,
         *
         *      //Should this tab be active (selected) on page load.
         *      //Please note that the last loaded plugin tab will be active.
         *      //false by default
         *      active: false,
         *
         *      //Should this tab be disabled (visible but unselectable)
         *      //false by default,
         *      disabled: false
         *  }
         * }
         * @type Array
         */
        plugins: [
            //Automatically filled by mt_util.addPluginModule so the browser 
            //has data about available plugins to download
        ],

        /**
         * Application configuration defaults. This values will be overwritten
         * by values stored in user's browser's local storage.
         * @type type
         */
        configDefaults: {
            'mtcenter_url': 'http://mtcenter:8080/'
        },
        //Angular modules to be added as dependency to main module
        vendorNgModules: [],
        
        //Available languages are discovered by build_app_config task
        languages: []
    },
    
    /**
     * CSS files paths to be concatenated in order vendorCss, appCss. When plugins
     * are discovered and loaded by Grunt their .css styles are automatically 
     * pushed to appCss array. 
     * 
     * Separation of css files allows better control of order of applied style 
     * rules. 
     */
    vendorCss: [
        'bower_components/bootstrap/dist/css/bootstrap.css',
        'bower_components/jquery-ui/themes/smoothness/jquery-ui.css',
        'bower_components/datatables/media/css/jquery.dataTables.css'
    ],
    appCss: [
        './vc2_core/static/css/**/*'
    ],

    filesToCopy: [],

    loginServiceWSDL: 'http://mtcenter:8080/MTUserCenter/LoginService?wsdl',
    buildDir: './build',
    distDir: './build',
    serverPort: '9001',
    serverCache: true,
    
    //Grunt tasks (backend) to be started after the web server has started
    serverTasks: [],
        
    //Common dependencies are included in main bundle file (public/app.js),
    //and are explicitly excluded from dynamically loaded plugins.
    commonDeps: [
        'jquery', 
        'jquery-ui', 
        'angular',
        'angular-animate', 
        'angular-local-storage',
        'ng-translate', 
        'ng-translate-loader', 
        'ng-translate-logger', 
        'bootstrap-ui-tpls',
        'text', 
        'moment',
        'underscore', 
        'datatables'
    ],
    
    //Location of bower components folder from the point of build/vc2/static folder.
    bower_components: '../../../bower_components',
    
    paths: {
        'jquery': '<%= bower_components %>/jquery/dist/jquery',
        'jquery-ui': '<%= bower_components %>/jquery-ui/jquery-ui',
        'angular': '<%= bower_components %>/angular/angular',
        'angular-animate': '<%= bower_components %>/angular-animate/angular-animate',
        'angular-local-storage': '<%= bower_components %>/angular-local-storage/dist/angular-local-storage',
        'ng-translate': '<%= bower_components %>/angular-translate/angular-translate',
        'ng-translate-loader': '<%= bower_components %>/angular-translate-loader-static-files/angular-translate-loader-static-files',
        'ng-translate-logger': '<%= bower_components %>/angular-translate-handler-log/angular-translate-handler-log',
        'ng-cookies': '<%= bower_components %>/angular-cookies/angular-cookies',
        'ng-translate-storage-cookie': '<%= bower_components %>/angular-translate-storage-cookie/angular-translate-storage-cookie',
        'ng-translate-storage-local': '<%= bower_components %>/angular-translate-storage-local/angular-translate-storage-local',
        'bootstrap-ui-tpls': '<%= bower_components %>/angular-bootstrap/ui-bootstrap-tpls',
        'text': '<%= bower_components %>/text/text',
        'moment': '<%= bower_components %>/moment/moment',
        'underscore': '<%= bower_components %>/underscore/underscore',
        'datatables': '<%= bower_components %>/datatables/media/js/jquery.dataTables'
    },
    shim: {
        'jquery-ui': {
            deps: ['jquery']
        },
        "angular": {
            deps: ['jquery'],
            exports: "angular"
        },
        'ng-cookies': {
            deps: ['angular']
        },
        "angular-animate": {
            deps: ['angular']
        },
        'angular-local-storage': {
            deps: ['angular']
        },
        "ng-translate": {
            deps: ['angular']
        },
        "ng-translate-loader": {
            deps: ['angular', 'ng-translate']
        },
        'ng-translate-logger': {
            deps: ['angular', 'ng-translate']
        },
        'ng-translate-storage-cookie': {
            deps: ['angular', 'ng-cookies', 'ng-translate']
        },
        'ng-translate-storage-local': {
            deps: ['angular', 'ng-translate', 'ng-translate-storage-cookie']
        },
        'bootstrap-ui-tpls': {
            deps: ['angular']
        },
        "underscore": {
            exports: "_"
        },
        'datatables': {
            deps: ['jquery']
        }
    }
};
