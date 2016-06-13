'use strict';
var util = require('util');

/**
 * Running Grunt instance
 * @typedef {object} Grunt
 */

/**
 * Prints complete object instead of [Object object]
 * @param {type} o
 * @returns {undefined}
 */
function printObject(o) {
    console.log(util.inspect(o, false, null, true));
}

/**
 * Loads configuration file located under passed path. If the file is missing
 * then it will use the path to default configuration file to regenerate a 
 * configuration file by copying it. If the default configuration is missing it 
 * will fail grunt task with a warning. 
 * 
 * Passing `--default_config` argument in the command line will force to use
 * the default configuration.
 * 
 * Configuration file is not tracked by git in contrary to default configuration
 * file.
 * @param {Grunt} grunt - Running Grunt instance
 * @param {string} configPath - Path to the configuration file
 * @param {string} defaultConfigPath - Path to the default configuration file
 * @returns {object} Configuration object to be merged with grunt config.
 */
function loadConfigFile(grunt, configPath, defaultConfigPath) {
    var config;
    if (grunt.option('default_config')) {
        if (!grunt.file.exists(defaultConfigPath)) {
            grunt.fail.warn('Missing default configuration file: ' + defaultConfigPath);
        }
        config = require(defaultConfigPath);
        grunt.verbose.writeln('Running configuration found in ' + defaultConfigPath.green);
    } else {
        if (!grunt.file.exists(configPath)) {
            grunt.verbose.writeln(('Missing ' + configPath + ' file - regenerating using ' + defaultConfigPath + ' file instead').yellow);
            grunt.file.copy(defaultConfigPath, configPath);
        }
        config = require(configPath);
        grunt.verbose.writeln('Running configuration found in ' + configPath.green);
    }
    return config;
}

/**
 * Searches plugin directories for plugin directory to return path to it.
 * @param {Grunt} grunt - Running Grunt instance
 * @param {string} pluginName - Enabled plugin name
 * @param {string[]} pluginsDirs - List of plugins directories paths in which it 
 * should look for given plugin's name
 * @returns {(string|undefined)} Path to the plugin's contents or undefined if not found.
 */
function findPluginPath(grunt, pluginName, pluginsDirs) {
    var foundPluginPath = pluginsDirs
            .map(function (pluginDir) {
                return pluginDir + '/' + pluginName;
            })
            .filter(function (path) {
                return grunt.file.exists(path);
            });

    return foundPluginPath[0];
}

/**
 * Loads tasks defined under taskPath.
 * @param {Grunt} grunt - Running Grunt instance
 * @param {string} taskPath - path to folder where the tasks are defined
 * @returns {undefined}
 */
function loadTasks(grunt, taskPath) {
    if (grunt.file.exists(taskPath)) {
        //Grunt will log what tasks has been loaded with --verbose mode
        grunt.task.loadTasks(taskPath);
    }
}

/**
 * Adds plugins files' paths which should be copied on copy task during the 
 * build process.
 * @param {Grunt} grunt - Running Grunt instance
 * @param {string} pluginPath - Path to the plugin's contents
 * @param {string[]} folderPaths - List of glob patterns of files that must be
 * copied. Used as a 'src' parameter of Grunt files array format.
 * @returns {undefined}
 */
function addPluginFoldersPathsToCopy(grunt, pluginPath, folderPaths) {
    var filesArray = grunt.config('filesToCopy');
    filesArray.push({
        cwd: pluginPath,
        expand: true,
        src: folderPaths,
        dest: '<%= buildDir %>/vc2'
    });
    grunt.config('filesToCopy', filesArray);
    grunt.verbose.writeln('Added ' + pluginPath + ' files to copy task: ' + folderPaths);
}

/**
 * Ads css file paths to the main configuration for concatenation and 
 * minification during the build process. Those files will be combined
 * in alphabetic order per each plugin.
 * @param {Grunt} grunt - Running Grunt instance
 * @param {string} pluginPath - Path to the plugin's contents
 * @returns {undefined}
 */
function addCssPaths(grunt, pluginPath) {
    var cssFiles = grunt.config('appCss');
    cssFiles.push(pluginPath + '/static/css/**/*.css');
    grunt.config('appCss', cssFiles);
}

/**
 * Returns name for the plugin's AMD module if there is existance of .js file
 * inside the plugin's `static` directory, with the same name as the plugin.
 * @param {Grunt} grunt - Running Grunt instance
 * @param {string} pluginPath - Path to the plugin directory
 * @param {string} pluginName - Plugin name
 * @returns {string|null} Name of the plugin's AMD module (which would be the 
 * same as the plugin's name)
 */
function getPluginModule(grunt, pluginPath, pluginName) {
    var module = pluginPath + '/static/' + pluginName;
    return grunt.file.exists(module + '.js') ? pluginName : null;
}

/**
 * Given plugin's AMD module name registers it in browser config and the 
 * requirejs optimizer. Browser needs to know what plugins are available and
 * under what path (module name) they can be retrieved. Requirejs needs to know
 * explicitly what bundles it needs to create as the plugins are loaded dynamically;
 * @param {Grunt} grunt - Running Grunt instance
 * @param {object} config - Plugin configuration
 * @param {type} pluginModule - Name of the plugin's AMD module
 * @param {string[]} pluginsDirs - Array of directories paths where to look for 
 * plugins
 * @returns {undefined}
 */
function addPluginModule(grunt, config, pluginModule, pluginsDirs) {
    if (pluginModule) {
        if (!config.appConfig || !config.appConfig.plugin) {
            grunt.fail.warn('Missing plugin definition in configuration file for plugin ' + pluginModule);
        } else {
            var plugin = config.appConfig.plugin,
                plugins = grunt.config('appConfig.plugins'),
                requirejsModules = grunt.config('requirejs.options.modules');

            plugin.modulePath = pluginModule;
            plugins.push(plugin);
            grunt.config('appConfig.plugins', plugins);
            grunt.verbose.writeln('Added plugin ' + pluginModule + ' description to the browser appConfig');

            plugin.pluginDeps = plugin.pluginDeps || [];

            requirejsModules.push({
                name: pluginModule,
                exclude: plugin.pluginDeps
                    .map(function (pluginName) {
                        var pluginPath, depPluginModule;
                        pluginPath = findPluginPath(grunt, pluginName, pluginsDirs);
                        if (!pluginPath) {
                            grunt.fail.warn('Plugin module ' + pluginModule + ' has a ' +
                                ' dependecy on plugin ' + pluginName + ' but it ' +
                                ' could not be found in plugins directories: [' +
                                pluginsDirs.join(', ') + '].');
                            return;
                        }

                        depPluginModule = getPluginModule(grunt, pluginPath, pluginName);
                        if (!depPluginModule) {
                            grunt.fail.warn('Plugin module ' + pluginModule + ' has a ' +
                                ' dependecy on plugin ' + pluginName + ' but it ' +
                                ' does not have an module file called: ' + pluginName +
                                '.js.');
                            return;
                        }

                        return depPluginModule;
                    })
                    .concat(['bower_components', 'vc2_core']),
                excludeShallow: ['text!core/config/app-config.json']
            });
            grunt.config('requirejs.options.modules', requirejsModules);
            grunt.verbose.writeln('Added plugin module ' + pluginModule + ' to be optimized into a bundle.');
        }
    } else {
        if (config.appConfig && config.appConfig.plugin) {
            grunt.fail.warn('Missing module file for plugin ' + pluginModule);
        }
    }
}

/**
 * Uniquely concatenates arrays.
 * @param {array} arr1
 * @param {array} arr2
 * @returns {array}
 */
function concatUniquely(arr1, arr2) {
    return arr1.concat(arr2).filter(function (val, i, array) {
        return array.indexOf(val) === i;
    });
}

/**
 * Merges plugin configuration file with the grunt configuration. AppConfig 
 * property is merged with this rules before calling `grunt.config.merge`:
 * - configDefaults are added/overriden (otherwise the complete object 
 * `configDefaults` would get replaced)
 * - vendorNgModules arrays are uniquely concatenated (otherwise it would be 
 * overriden, and the same angular module dependency would be added)
 * 
 * @param {Grunt} grunt - Running Grunt instance
 * @param {object} pluginConfig - Plugin configuration file
 */
function mergePluginConfig(grunt, pluginConfig) {
    var pluginAppConfig = pluginConfig.appConfig,
        config = grunt.config();
    if (pluginAppConfig) {
        //Merge properties of configDefaults objects
        Object.assign(config.appConfig.configDefaults, pluginAppConfig.configDefaults);

        //Uniquely concatenate vendorNgModules arrays
        config.appConfig.vendorNgModules = concatUniquely(config.appConfig.vendorNgModules,
            pluginAppConfig.vendorNgModules || []);

        delete pluginConfig.appConfig;
        grunt.config('appConfig', config.appConfig);
    }

    Object.keys(pluginConfig).forEach(function (key) {
        switch (key) {
        case 'filesToCopy':
        case 'vendorCss':
        case 'appCss':
        case 'serverTasks':
        case 'commonDeps':
            config[key] = config[key].concat(pluginConfig[key]);
            break;
        default:
            Object.assign(config[key], pluginConfig[key]);
        }
        grunt.config(key, config[key]);
    });
}

/**
 * Adds path to language files to the build_lang_files task configuration.
 * @param {type} grunt
 * @param {type} path
 * @returns {undefined}
 */
function addLangFiles(grunt, path) {
    var files = grunt.config('build_lang_files.all.files');
    grunt.verbose.writeln('Adding path to lang files:' + path);
    files[0].src.push(path);
    grunt.config('build_lang_files.all.files', files);
}

/**
 * Load plugins components located in plugins driectories:
 * - Grunt tasks in /tasks folder
 * - Configuration - configuration object to be merged (override) main configuration
 * - Assets - Files inside the static, views and test folders (except for .css),
 * to be copied over.
 * - CSS - Plugin's css files.
 * @param {Grunt} grunt - Running Grunt instance
 * @param {string[]} pluginsNames - Array of plugins names to be loaded
 * @param {string[]} pluginsDirs - Array of directories paths where to look for 
 * plugins
 * @param {string} configPath - Relative path to configuration file
 * @param {string} defaultConfigPath - Relative path to the default configuration file
 * @param {string} tasksPath - Relative path to the grunt tasks
 * @param {string} langPath - Relative path to the language (i18n) files
 * @returns {undefined}
 */
function loadPlugins(grunt, pluginsNames, pluginsDirs, configPath, defaultConfigPath, tasksPath, langPath) {
    pluginsNames.forEach(function (pluginName) {
        grunt.verbose.writeln();
        grunt.verbose.ok('Loading plugin ' + pluginName);
        var path = findPluginPath(grunt, pluginName, pluginsDirs),
            config;
        if (path) {
            loadTasks(grunt, path + tasksPath);

            config = loadConfigFile(grunt, path + configPath, path + defaultConfigPath);
            if (config) {
                addPluginModule(grunt, config, getPluginModule(grunt, path, pluginName), pluginsDirs);

                mergePluginConfig(grunt, config);
                grunt.verbose.writeln('Merged ' + pluginName + ' configuration with main configuration');
            }

            addPluginFoldersPathsToCopy(grunt, path, [
                //.css and lang files are handled by cssmin (or concat) and 
                //build_lang_files tasks respectively
                'static/**/*', '!static/css/**/*', '!static/lang/**/*',
                'views/**/*', 'test/**/*'
            ]);

            addCssPaths(grunt, path);
            addLangFiles(grunt, path + langPath);
        } else {
            grunt.log.error('Could not find plugin ' + pluginName + ' in any'
                    + ' of these locations: [' + pluginsDirs + ']');
        }
    });
}

/**
 * Returns paths for plugins components. 
 * @param {string[]} pluginsDirs - Array of directories paths where to look for 
 * plugins
 * @param {string} pathType - Plugin's component path
 * @returns {string[]} List of paths to the plugin's components
 */
function getPluginsPathFor(pluginsDirs, pathType) {
    return pluginsDirs.map(function (path) {
        return path + pathType;
    });
}

/**
 * Creates a function to be called after the requirejs optimizer finished creating
 * new build.
 * @param {Grunt} grunt - Running Grunt instance
 * @returns {function} Function which parses build summary to detect duplicates.
 */
function checkForDuplicatesInBundles(grunt) {
    /**
    * Performs check on created r.js bundles if they consist of duplicates,
    * which is presence of the same module in two separate bundles. This might
    * cause unexpected behaviour when the same module is defined twice of more
    * times.
    *
    * In case of a duplicate ('config' is object exported by config.js):
    * - Check if this module could be inlcuded in config.commonDeps list (like jQuery)
    * - Check config.appConfig.requireOnStart list - This list is made specially
    *   for angular libraries that needs to be loaded prior to creating this
    *   project main angular module, so they can be included as angular module
    *   dependencies.
    * - Check config.appConfig.plugins.pluginDeps
    *
    * @param {function} callback - Function to call when finished, to signal
    * requirejs optimizer that it can continue.
    * @param {string} buildSummary - Optimizer result summary
    * @returns {undefined}
    */
    return function (callback, buildSummary) {
        var bundleName,
            build = {},
            duplicates;

        buildSummary
            .split(/\r\n|\r|\n/g)
            .forEach(function (line) {
                //New line indicating new bundle file
                if (!line.length) {
                    bundleName = null;
                } else if (!bundleName) {
                    bundleName = line;
                } else if (line !== '----------------') {
                    build[line] = build[line] || [];
                    build[line].push(bundleName);
                }
            });

        duplicates = Object.keys(build).filter(function (module) {
            return build[module].length > 1;
        });

        if (duplicates.length) {
            grunt.log.subhead('Duplicates found in requirejs build:');
            duplicates
                .forEach(function (module) {
                    grunt.log.warn('Module ' + module + ' is duplicated in this bundles: ', build[module]);
                });
            callback(new Error('r.js built bundles with duplicated modules. Please check dependencies and pluginDeps in config.js.'));
        } else {
            callback();
        }
    };
}

module.exports = {
    loadConfigFile: loadConfigFile,
    loadTasks: loadTasks,
    checkForDuplicatesInBundles: checkForDuplicatesInBundles,
    getPluginsPathFor: getPluginsPathFor,
    loadPlugins: loadPlugins,
    printObject: printObject,
    addLangFiles: addLangFiles
};