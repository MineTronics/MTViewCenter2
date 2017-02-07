//based on http://rhumaric.com/2013/05/reloading-magic-with-grunt-and-livereload/
module.exports = function (grunt) {
    'use strict';
    // Load Grunt tasks declared in the package.json file
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
    var buildConfig,
        taskConfig,

        mtUtil = require('./mt_util'),

        CONFIG_PATH = '/config.js',
        DEFAULT_CONFIG_PATH = '/default_config.js',
        VC_CORE_PATH = './vc2_core',
        TASKS_PATH = '/tasks',
        LANG_PATH = '/static/lang/**/*.json';


    buildConfig = mtUtil.loadConfigFile(grunt, VC_CORE_PATH + CONFIG_PATH,
        VC_CORE_PATH + DEFAULT_CONFIG_PATH);

    /*
     * Grunt tasks configuration.

     * Values in <%= %> might reference properties from buildConfig object because
     * buildConfig and taskConfig are merged and used as grunt configuration.
     */
    taskConfig = {
        runTasks: '<% runTasks >',

        // grunt-open will open your browser at the project's URL
        open: {
            express: {
                path: 'http://localhost:<%= express.options.port%>'
            }
        },

        // grunt-regarde monitors the files and triggers livereload
        // Note 1: livereload complains when you try to use grunt-contrib-watch instead of grunt-regarde
        // Note 2: Changes in new files are not triggering regarde - you need to restart grunt
        regarde: {
            all: {
                // This'll just watch the index.html file, you could add **/*.js or **/*.css
                // to watch Javascript and CSS files too.
                files: [
                    './app/index.jade',
                    './app/**/*.js',
                    './app/**/*.html',
                    './app/**/*.css'
                ],
                tasks: [
                    'requirejs:dev',
                    'livereload'
                ] //if jade is on this list, index.html cannot be in files, because it creates cyclic reference
            },
            config: {
                files: [CONFIG_PATH, DEFAULT_CONFIG_PATH],
                tasks: ['build-app-config', 'livereload']
            }
        },
        copy: {
            coreFiles: {
                files: [
                    {
                        cwd: './vc2_core',
                        expand: true,
                        src: [
                            '!static/lang/**/*',
                            'static/**/*',
                            'test/**/*',
                            'views/**/*'
                        ],
                        dest: '<%= buildDir %>/vc2'
                    },
                    {
                        cwd: './bower_components/bootstrap/dist/fonts',
                        expand: true,
                        src: '**/*',
                        dest: '<%= buildDir %>/vc2/static/fonts'
                    },
                    {
                        cwd: './bower_components/datatables/media/images',
                        expand: true,
                        src: '**/*',
                        dest: '<%= buildDir %>/vc2/static/images'
                    },
                    {
                        cwd: './bower_components/requirejs',
                        expand: true,
                        src: 'require.js',
                        dest: '<%= buildDir %>/vc2/static'
                    }
                ]
            },
            customFiles: {
                files: '<%= filesToCopy %>'
            },

            //Final copy of files to create a release.
            toDist: {
                files: [
                    //Web application files
                    {
                        cwd: '<%= buildDir %>',
                        expand: true,
                        src: [
                            'public/**/*',
                            'mtjs/**/*',
                            'index.jade',
                            'main.js',

                            //Other bower components are concatenated in app and
                            //plugins bundles.
                            'bower_components/requirejs/require.js'],
                        dest: '<%= distDir %>/app'
                    },
                    //Server files
                    {
                        cwd: './',
                        expand: true,
                        src: [
                            //This could be improved to copy tasks present in
                            //config.serverTasks list - similar how plugins are
                            //included
                            'tasks/**/*',
                            'Gruntfile.js',
                            'bower.json',
                            'config.js',
                            'default-config.js',
                            'install_node_env.sh',
                            'package.json',

                            //This could be improved to copy files needed for
                            //running the project without development tools
                            'node_modules/**/*'
                        ],
                        dest: '<%= distDir %>'
                    }
                ]
            }
        },

        //Removes files and directories
        clean: {
            buildDir: {
                src: ['<%= buildDir %>']
            },
            distDir: {
                src: ['<%= distDir %>']
            }
        },

        /**
         * Used during deploy to create concatenated and minified main style file.
         */
        cssmin: {
            prod: {
                src: [
                    '<%= vendorCss %>',
                    '<%= appCss %>'
                ],
                dest: '<%= buildDir %>/vc2/static/css/mtviewcenter2.css'
            }
        },

        /**
         * Used during development to create concatenated main style file.
         */
        concat: {
            css: {
                src: '<%= cssmin.prod.src %>',
                dest: '<%= cssmin.prod.dest %>'
            }
        },

        /**
         * Combines language files used for i18n into bundles for each language.
         * Enabled plugins' files are appended to the src array during the
         * initialization.
         */
        build_lang_files: {
            all: {
                options: {
                    mainLanguage: 'en.json',
                    destDir: '<%= buildDir %>/vc2/static/lang'
                },
                files: [
                    {
                        expand: true,
                        src: [VC_CORE_PATH + LANG_PATH]
                    }
                ]
            }
        },

        /**
         * During development .js source files are simply copied to 'dir' folder.
         * To make application running in 'unoptimized' state a require.config
         * file is needed and is being automatically created with 'writeRequireConfigFile'
         * task.
         *
         * During deploy it creates and minifies bundles:
         * a) core:
         *  - app/public/core application
         *  - requireOnStart modules - dependencies required to be initialized
         *                             eagarly, like angular libraries
         *  - commonDeps modules - list of common dependencies that should
         *                         be excluded from other bundles, thus taking
         *                         care of duplicates
         * b) plugin bundle for each plugin in appConfig.plugins
         *
         * HTML templates are not included in plugins bundles, but are copied and
         * downloaded using angular template system.
         */
        requirejs: {
            options: {
                //Source
                baseUrl: '<%= buildDir %>/vc2/static',

                //Destination
                dir: '<%= buildDir %>/vc2/static',

                //The 'dir' will not be cleared before minification
                //True because we're optimizing the contents of the build folder
                keepBuildDir: true,
                allowSourceOverwrites: true,

                mainConfigFile: '<%= buildDir %>/vc2/static/main.js',

                //Optimize only specified modules, not the complete source folder
                skipDirOptimize: true,

                //Remove files that are combined in minified file
                removeCombined: true,

                //Inline modules which are required using text! plugin
                //Text is used for directive templates. app-config.json is
                //explicitly excluded so can be later edited if needed
                inlineText: true,

                //Use cssmin to optimize stylesheets instead
                optimizeCss: 'none',

                logLevel: 1,
                paths: '<%= paths %>',
                shim: '<%= shim %>',

                // waitSeconds is not included in the bundle so it was moved to main.js
                // waitSeconds: 9,

                modules: [
                    {
                        name: 'bower_components',
                        include: '<%= commonDeps %>',
                        create: true,
                        insertRequire: '<%= commonDeps %>'
                    },
                    {
                        name: 'vc2_core',
                        exclude: ['bower_components'],
                        excludeShallow: [
                            'text!core/config/app-config.json'
                        ]
                    }
                ],
                done: mtUtil.checkForDuplicatesInBundles(grunt)
            },
            prod: {
                options: {
                    optimize: 'uglify2',
                    generateSourceMaps: true,

                    //Can't be used together with source maps: http://requirejs.org/docs/errors.html#sourcemapcomments
                    preserveLicenseComments: false
                }
            },
            dev: {
                options: {
                    optimize: 'none'
                }
            }
        },

        /**
         * Builds app config used by the browser, to set application default
         * configuration values. The app config is extracted from config.js (or
         * default-config.js if former is not present) and saved as app-config.json.
         */
        'build-app-config': {
            all: {
                dest: '<%= buildDir %>/vc2/static/core/config/app-config.json'
            }
        },

        /**
         * creates the jsdoc htmls files from comments (like this one)
         */
        jsdoc : {
            dist : {
                src: ['Gruntfile.js', 'vc2_core/**/*.js', 'plugins_open_source/**/*.js' ],
                options: {
                    destination: 'docs',
                    configure : "docs/conf.json",
                    //template : "node_modules/angular-jsdoc/angular-template"
                    template : "node_modules/ink-docstrap/template"
                }
            }
        },

        /**
         * run Jasmine Unit tests according to its spec
         */
        jasmine: {
            core_tasks: {
                src: VC_CORE_PATH + '/tasks/*.js',
                options: {
                    specs: VC_CORE_PATH + '/test/spec/*Spec.js',
                    template: require('grunt-template-jasmine-requirejs')
                }
            },
            plugins_open_source_tasks: {
                src: 'plugins_open_source/**/mt_*.js',
                options: {
                    specs: 'plugins_open_source/**/test/*Spec.js',
                    template: require('grunt-template-jasmine-requirejs')
                }
            },
            browser_static: {
                options: {
                    helpers: [
                        //Adds special paths and shim for testing environment
                        VC_CORE_PATH + '/test/requirejs_test_config.js',

                        //Jasmine plugin for testing AJAX
                        'node_modules/jasmine-ajax/lib/mock-ajax.js'
                    ],
                    specs: [
                        VC_CORE_PATH + '/*/test/**/*-spec.js'
                    ].concat(mtUtil.getPluginsPathFor(buildConfig.pluginsDirs, '/test/**/*-spec.js', buildConfig.loadPlugins, grunt)),
                    template: require('grunt-template-jasmine-requirejs'),
                    templateOptions: {
                        requireConfig: '<%= requirejs.options %>'
                    }
                }
            }
        },

        /**
         * Check js source files for style consistency and possible errors
         */
        jslint: {
            server: {
                src: [
                    VC_CORE_PATH + TASKS_PATH + '**/*.js',
                    './Gruntfile.js',
                    'mt_util.js'
                ].concat(mtUtil.getPluginsPathFor(buildConfig.pluginsDirs, '/*/tasks/**/*.js')),
                directives: {
                    //Relax some of the rules
                    node: true,
                    unparam: true,
                    plusplus: true,
                    continue: true
                },
                options: {
                    failOnError: true,
                    errorsOnly: true
                }
            },
            client: {
                src: [
                    VC_CORE_PATH + '/static/**/*.js'
                ].concat(mtUtil.getPluginsPathFor(buildConfig.pluginsDirs, '/*/static/**/*.js')),
                exclude: [
                    //Fixes for memory leaks in SceneJS
                    './plugins_open_source/mt_vis/static/mt_vis/scene/scenejs_memory_fix.js'
                ].concat(mtUtil.getPluginsPathFor(buildConfig.pluginsDirs, TASKS_PATH + '**/*.js')),
                directives: {
                    browser: true,
                    unparam: true,
                    plusplus: true,
                    continue: true,
                    predef: [
                        'require',
                        'define',
                        'console',
                        'FileReader',
                        'btoa',
                        'atob',
                        'Float32Array',
                        'Uint16Array',
                        'DataView',
                        'Blob',
                        'XMLSerializer'
                    ]
                },
                options: {
                    failOnError: true,
                    errorsOnly: true
                }
            }
        }
    };

    //Merge buildConfig with taskConfig and use it as grunt config
    grunt.config.init(taskConfig);
    grunt.config.merge(buildConfig);
    mtUtil.loadTasks(grunt, VC_CORE_PATH + TASKS_PATH);
    grunt.log.writeln('Plugins enabled: [' + buildConfig.loadPlugins.join(',') + ']');
    mtUtil.loadPlugins(
        grunt,
        grunt.config('loadPlugins'),
        grunt.config('pluginsDirs'),
        CONFIG_PATH,
        DEFAULT_CONFIG_PATH,
        TASKS_PATH,
        LANG_PATH
    );

    grunt.log.ok('Finished loading plugins');
    grunt.log.writeln();

    /**
     * Prints running grunt configuration
     */
    grunt.registerTask('print_config', 'Prints contents of running grunt configuration.', function () {
        var configProperty = grunt.option('property');
        mtUtil.printObject(grunt.config.get(configProperty));
    });

    /**
     * Prints brief information about this Gruntfile
     */
    grunt.registerTask('help', 'Prints brief information about this Gruntfile', function () {
        grunt.log.writeln('Main grunt tasks list:'.green);
        grunt.log.writeln('\'grunt dev\''.magenta + ' builds the project and starts the development server.');
        grunt.log.writeln('\'grunt prod\''.magenta + ' creates a new release.');
        grunt.log.writeln('\'grunt run\''.magenta + ' starts production server hosting the /dist/app application.');
        grunt.log.writeln('\'grunt clean\''.magenta + ' clears /dist and /build directories.');
        grunt.log.writeln('\'grunt test\''.magenta + ' runs jslint');
        grunt.log.writeln('\'grunt jsdoc\''.magenta + ' starts creating html doc according to the complete project.');
        grunt.log.writeln('\'grunt print_config [--property=]\''.magenta + ' prints contents of complete (or just single property of) running grunt configuration. ');
        grunt.log.writeln();
        grunt.log.writeln('Grunt global options:'.green);
        grunt.log.writeln('\'--no_auth\''.cyan + ' http server will run without authentication module.');
        grunt.log.writeln('\'--default_config\''.cyan + ' force grunt to use ' + DEFAULT_CONFIG_PATH + ' instead of ' + CONFIG_PATH + '.');
        grunt.log.writeln('\'--show_keepalive[=INTERVAL]\''.cyan + ' log each \'keepalive\' task interval every INTERVAL ms, default 10000ms');
    });

    grunt.registerTask('default', ['help']);
};
