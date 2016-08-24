/**
 * This script requires npm package 'async' to be available.
 * 
 * This script creates a combined (plugins and core) dependency file to install
 * them. It will stop and report about multiple versions for single dependency
 * of given type ('dependencies', 'devDependencies' etc.). Each dependency type 
 * is checked independently.
 * @param {type} config 
 * @param {type} cwd
 * @param {type} fileName
 * @param {type} coreName
 * @param {type} depsTypes
 * @returns {undefined}
 */
'use strict';

var path = require('path');
var fs = require('fs');
var util = require('util');
var async = require('async');

var CWD = process.cwd();
var CONFIG_PATH = process.argv[2];
if (!CONFIG_PATH) {
    throw 'Missing path to configuration file (config.js). Example usage: node scripts/install_dep.js vc2_core/default_config.js';
}
var CONFIG = require(path.resolve(CWD, CONFIG_PATH));
var CORE_NAME = 'vc2_core';
var FILE_NAME = process.argv[process.argv.findIndex(function (arg) { return arg === '--file'; }) + 1];
if (!FILE_NAME) {
    throw 'Missing file name to combine, like bower.json or package.json passed as --file argument ' + process.argv.join(',');
}
var DEPS_TYPES = [
    'dependencies',
    'devDependencies'
];

var isTest = process.argv.some(function (arg) { return arg === '--test'; });
var isVerbose = process.argv.some(function (arg) { return arg === '--verbose'; });

/**
 * Copies file from source path to target path
 * @param {string} source Source file path
 * @param {string} target Destination file path
 * @param {function} cb Callback function with error argument
 * @returns {undefined}
 */
function copyFile(source, target, cb) {
    //Flag is needed because pipe errors trigger an error on both streams
    var cbCalled = false,
        readStream,
        writeStream;

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }

    readStream = fs.createReadStream(source);
    readStream.on("error", function (err) {
        done(err);
    });
    writeStream = fs.createWriteStream(target);
    writeStream.on("error", function (err) {
        done(err);
    });
    writeStream.on("close", function (ex) {
        done();
    });
    readStream.pipe(writeStream);
}

/**
 * Reads json file under given path
 * @param {string} path Path to json file
 * @param {type} cb Callback function with error and parsed data arguments
 * @returns {undefined}
 */
function readJson(path, cb) {
    fs.readFile(path, { encoding: 'utf8' }, function (err, data) {
        if (err) {
            cb(err);
        } else {
            cb(null, JSON.parse(data));
        }
    });
}

/**
 * Creates async task for creating collection of plugins, which have a requested
 * file, like bower.json. Returned collection is an array with objects:
 * {
 *    {string} directory: directory where this plugin is located
 *    {string} name: name of the plugin 
 * }
 * This collection will be passed to the next async task.
 * @param {type} config
 * @param {type} cwd
 * @param {type} file
 * @returns {Function} 
 */
function getPlugins(config, cwd, file) {
    return function asyncTask(cb) {
        var plugins = [];

        if (isVerbose) {
            console.log('Resolving enabled plugins: [' + config.loadPlugins.join(',')
                + '] in directories [' + config.pluginsDirs + '].');
        }

        config.pluginsDirs.forEach(function (pluginDir) {
            config.loadPlugins.forEach(function (pluginName) {
                plugins.push({
                    directory: pluginDir,
                    name: pluginName
                });
            });
        });

        async.filter(plugins, function (plugin, filterCb) {
            var filePath = path.resolve(cwd, plugin.directory, plugin.name, file);
            fs.access(filePath, function (err) {
                filterCb(!err);
            });
        }, function (availablePlugins) {
            cb(null, availablePlugins);
        });
    };
}

/**
 * Creates async task to read requested json files found in plugins directories.
 * Each plugin object will be added with additional property names after json file
 * name with its parsed contents as a value.
 * @param {type} cwd
 * @param {type} file
 * @returns {Function} 
 */
function readPluginsFiles(cwd, file) {
    return function (plugins, cb) {
        if (isVerbose) {
            console.log('Found ' + plugins.length + ' additional ' + FILE_NAME + ' files.');
        }

        async.map(plugins, function (plugin, mapCb) {
            var jsonPath = path.resolve(cwd, plugin.directory, plugin.name, file);
            readJson(jsonPath, function (err, contents) {
                plugin[file] = contents;
                mapCb(err, plugin);
            });
        }, cb);
    };
}

/**
 * Creates async task to read core's file. Readed core is added to plugins list,
 * creating components list.
 * @param {type} cwd
 * @param {type} file
 * @param {type} coreName
 * @returns {Function}
 */
function readCoreFile(cwd, file, coreName) {
    return function (plugins, cb) {
        if (isVerbose) {
            console.log('Reading ' + coreName + ' ' + file + ' file.');
        }

        var coreJson = path.resolve(cwd, file);
        readJson(coreJson, function (err, contents) {
            var core = {
                name: coreName,
                directory: cwd
            };
            core[file] = contents;
            plugins.push(core);
            cb(err, plugins);
        });
    };
}

/**
 * Creates async task to merge different types of dependencies defined in requested
 * file, like bower.json. For each type of dependencies a new object is created,
 * which holds merged map of dependencies. Each map has a key which is a name of
 * dependnecy and a value which is another map with a version as a key and array
 * of components names that are using this version of dependnecy. Result that is
 * passed after executing this async task is as follows:
 *  {
 *      components: array of components passed from previous task,
 *      dependencies: {
 *          dependencyType (like 'devDependencies'): {
 *              dependencyName (like 'jQuery'): {
 *                  version (like '1.7.9'): [
 *                      'vc2_core', 'mt_plugin1'
 *                  ]
 *              }
 *          }
 *      }
 *  }
 * 
 * @param {type} depsTypes
 * @param {type} file
 * @returns {Function}
 */
function mergeDeps(depsTypes, file) {
    return function (components, cb) {
        var deps = depsTypes.map(function (depsType) {
            if (isVerbose) {
                console.log('Merging ' + file + ' ' + depsType + '.');
            }

            var depsList = components.reduce(function (target, component) {
                var dependencies = component[file][depsType];
                if (dependencies) {
                    Object.keys(dependencies).forEach(function (dependency) {
                        var version = dependencies[dependency],
                            targetDep = target[dependency] || {};
                        if (!targetDep[version]) {
                            targetDep[version] = [component.name];
                        } else {
                            targetDep[version].push(component.name);
                        }
                        target[dependency] = targetDep;
                    });
                }

                return target;
            }, {});

            return {
                type: depsType,
                list: depsList
            };
        });
        cb(null, {
            components: components,
            dependencies: deps
        });
    };
}

/**
 * Inspects dependencies map to return list of dependencies which have more than
 * one version used.
 * @param {type} depsMap
 * @returns {Array}
 */
function getConflicts(depsMap) {
    return Object.keys(depsMap).filter(function (dependency) {
        return Object.keys(depsMap[dependency]).length > 1;
    }).map(function (dependency) {
        return {
            name: dependency,
            versions: depsMap[dependency]
        };
    });
}

/**
 * Async task which inspects all dependencies for conflicts (each type of dependnecy,
 * like devDependencies is checked seperately). Conflict indicates that at least
 * two components requires the same dependency but in different versions, which
 * is not supported.
 * @param {type} previousAsyncTask
 * @param {type} cb
 * @returns {undefined}
 */
function checkConflictsTask(previousAsyncTask, cb) {
    var isConflict = false;
    if (isVerbose) {
        console.log('Checking list of dependencies for version conflicts.');
    }

    previousAsyncTask.dependencies.forEach(function (dependencyKind) {
        var conflicts = getConflicts(dependencyKind.list);
        if (conflicts.length) {
            isConflict = true;
            console.log('Found ' + dependencyKind.type + ' version conflicts:');
            conflicts.forEach(function (dependency) {
                console.log('Dependency ' + dependency.name + ' has multiple versions.');
                Object.keys(dependency.versions).forEach(function (version) {
                    console.log(version + ' is used by: [' + dependency.versions[version].join(',') + '].');
                });
            });
        }
    });
    cb(isConflict ? 'Found conflicting versions of dependencies - see the previous messages.' : null, previousAsyncTask);
}

/**
 * Creates async task which creates a backup of requested file.
 * @param {type} file
 * @returns {Function}
 */
function createBackup(file) {
    return function (previousAsyncTask, cb) {
        copyFile(file, 'temp_' + file, function (err) {
            if (!err) {
                console.log('Created backup of core ' + FILE_NAME + ': ' + 'temp_'
                    + FILE_NAME + ' to install dependencies');
            }
            cb(err, previousAsyncTask);
        });
    };
}

/**
 * Async task which flattens dependencies comples map to a simple map with 
 * dependency name as a key and dependency version as a value pairs.
 * @param {type} previousAsyncTask
 * @param {type} cb
 * @returns {undefined}
 */
function flattenDepsListTask(previousAsyncTask, cb) {
    previousAsyncTask.dependencies.forEach(function (dependencyKind) {
        var depCollection = dependencyKind.list;
        Object.keys(depCollection).forEach(function (dependencyName) {
            //at this point after checkConflictsTask() there must be one version
            var version = Object.keys(depCollection[dependencyName])[0];
            depCollection[dependencyName] = version;
        });
    });
    cb(null, previousAsyncTask);
}

/**
 * Creates async task which writes a new json file (like bower.json) with combined
 * dependencies from the plugins and the core.
 * @param {type} file
 * @param {type} coreName
 * @returns {Function}
 */
function saveCombinedFile(file, coreName) {
    return function (previousAsyncTask, cb) {
        var coreIndex = previousAsyncTask.components.findIndex(function (component) {
                return component.name === coreName;
            }),
            core = previousAsyncTask.components[coreIndex],
            bowerData;

        if (!core) {
            cb(coreName + ' not found!');
        } else {
            bowerData = core[file];
            previousAsyncTask.dependencies.forEach(function (depColl, i) {
                bowerData[depColl.type] = previousAsyncTask.dependencies[i].list;
            });
            fs.writeFile(file, JSON.stringify(bowerData, null, 4), cb);
        }
    };
}

/**
 * This script creates a combined (plugins and core) dependency file to install
 * them. It will stop and report about multiple versions for single dependency
 * of given type ('dependencies', 'devDependencies' etc.). Each dependency type 
 * is checked independently.
 * @param {type} config
 * @param {type} cwd
 * @param {type} fileName
 * @param {type} coreName
 * @param {type} depsTypes
 * @returns {undefined}
 */
function runScript(config, cwd, fileName, coreName, depsTypes) {
    async.waterfall([
        getPlugins(config, cwd, fileName),
        readPluginsFiles(cwd, fileName),
        readCoreFile(cwd, fileName, coreName),
        mergeDeps(depsTypes, fileName),
        checkConflictsTask,
        createBackup(fileName),
        flattenDepsListTask,
        saveCombinedFile(fileName, coreName)
    ], function (err) {
        if (err) {
            console.log('Script for making a combined dependencies file failed: ', err);
        } else {
            console.log('Created combined ' + fileName + ' file.');
        }
    });
}

runScript(CONFIG, CWD, FILE_NAME, CORE_NAME, DEPS_TYPES);
