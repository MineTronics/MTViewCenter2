'use strict';

var path = require('path');
var fs = require('fs');
var util = require('util');
var CONFIG_PATH = process.argv[2];
var isTest = process.argv.some(function (arg) { return arg === '--test'; });
var isVerbose = process.argv.some(function (arg) { return arg === '--verbose'; });

if (!CONFIG_PATH) {
    throw 'Missing path to configuration file (config.js). Example usage: node scripts/install_dep.js vc2_core/default_config.js';
}

var cwd = process.cwd();
var config = require(path.resolve(cwd, CONFIG_PATH));

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
 * Restores backup file with 'temp_' prefix. Removes backup file on success.
 * @param {string} file Path to file to restore from backup file
 * @param {function} cb Callback function to be called on completion with
 * err parameter.
 * @returns {undefined}
 */
function restore(file, cb) {
    fs.stat('temp_' + file, function (err) {
        if (!err) {
            copyFile('temp_' + file, file, function (err) {
                if (!err) {
                    fs.unlink('temp_' + file, cb);
                } else {
                    cb(err);
                }
            });
        } else {
            cb('Missing temporary file for restoring ' + file);
        }
    });
}

/**
 * Returns array of all posible paths to plugins files. Because plugins can be
 * in multiple directories some paths might not exist, and there should be
 * a check if file exists under the result path.
 * @param {object} config VC2 configuration
 * @param {string} cwd Current working directory
 * @param {string} file File name to look for
 * @returns {string[]} Array of paths
 */
function getPaths(config, cwd, file) {
    var paths = [];
    config.pluginsDirs.forEach(function (pluginDir) {
        config.loadPlugins.forEach(function (pluginName) {
            paths.push(path.resolve(cwd, pluginDir, pluginName, file));
        });
    });
    return paths;
}

/**
 * Merges two dependencies collections by adding source's dependencies to the
 * target's dependencies. If both collections contain the same dependency but with
 * different version then function calls callback with error.
 * @param {object} source List of dependencies to be added
 * @param {object} target List of already added dependencies
 * @param {function} cb Callback function with error and merged dependecies arguments
 * @returns {undefined}
 */
function mergeDependencies(source, target, cb) {
    var err;
    Object.keys(source).forEach(function (dependecy) {
        if (!err) {
            if (target[dependecy] && (target[dependecy] !== source[dependecy])) {
                err = 'Can not merge dependecies because of version mismatch for ' +
                    dependecy + ': ' + target[dependecy] + ' !== ' + source[dependecy];
            } else {
                target[dependecy] = source[dependecy];
            }
        }
    });
    cb(err, target);
}

/**
 * Merges core dependecies with plugins dependecies. Returns single list of combined
 * dependecies.
 * @param {object} config VC2 application configuration
 * @param {string} cwd Current working directory
 * @param {string} file Path to json file with dependecies
 * @param {function} cb Callback function with error and dependencies list arguments
 * @returns {undefined}
 */
function mergeJsons(config, cwd, file, cb) {
    var mainJsonPath = path.resolve(cwd, file);
    readJson(mainJsonPath, function (err, mainJsonData) {
        if (err) {
            cb(err);
        } else {
            var processedCount = 0;
            getPaths(config, cwd, file).forEach(function (jsonPath, i, paths) {
                readJson(jsonPath, function (err, pluginJsonData) {
                    if (err) {
                        //getPaths gives all possible, but not actual existing paths
                        //Ignore the error silently
                        if (isVerbose) {
                            console.error('Could not read json at path ' + jsonPath + ' because of ', err);
                        }
                        processedCount += 1;
                        if (processedCount === paths.length) {
                            cb(null, mainJsonData);
                        }
                    } else {
                        mergeDependencies(pluginJsonData.dependencies, mainJsonData.dependencies, function (err) {
                            if (err) {
                                console.error('Error when merging ' + jsonPath);
                                cb(err);
                            } else {
                                processedCount += 1;
                                if (processedCount === paths.length) {
                                    cb(err, mainJsonData);
                                }
                            }
                        });
                    }
                });
            });
        }
    });
}

/**
 * Runs shell command using nodejs.
 * @param {string} command Command with arguments to run
 * @param {function} cb Callback function with error argument
 * @returns {undefined}
 */
function runCommand(command, cb) {
    process.stdout.write('Running command ' + command + '\n');
    if (isTest) {
        process.stdout.write('Command ' + command + ' finished successfully\n');
        cb();
        return;
    }

    var exec = require('child_process').exec,
        cmd = exec(command);

    cmd.stdout.on('data', function (data) {
        process.stdout.write(data + '\n');
    });
    cmd.stderr.on('data', function (data) {
        process.stderr.write(data + '\n');
    });
    cmd.on('exit', function (code) {
        if (code !== 0) {
            cb(command + ' failed with exit code ' + code);
        } else {
            process.stdout.write('Command ' + command + ' finished successfully\n');
            cb();
        }
    });
}

/**
 * Installs dependecies defined in file by running specified command. Uses application
 * configuration to find all plugins dependecies to merge them to single file
 * before running the install command. Creates backup file before merging.
 * Restores original core dependecy file on error.
 * @param {string} file Path to json file with dependencies
 * @param {string} command Command to install dependencies with package manager
 * @param {object} config VC2 application configuration
 * @param {function} cb Callback function with error and list of installed dependecies
 * arguments
 * @returns {undefined}
 */
function installDependecies(file, command, config, cb) {
    var cwd = process.cwd();

    /**
     * Callback on restoring original core dependency file.
     */
    function restoreFeedback(mainCb, mainErr, mainData) {
        return function (restoreErr) {
            mainCb(mainErr, mainData);
            if (restoreErr) {
                console.error('Could not restore ' + file + ' because of ', restoreErr);
            } else {
                console.error('Restored ' + file + ' from backup.');
            }
        }
    }

    copyFile(file, 'temp_' + file, function (err) {
        if (!err) {
            console.log('Created backup temp_' + file);
            mergeJsons(config, cwd, file, function (err, data) {
                if (!err) {
                    console.log('Saving merged ' + file + ' with plugins dependencies');
                    fs.writeFile(file, JSON.stringify(data, null, 4), function (err) {
                        if (!err) {
                            runCommand(command, function (err) {
                                restore(file, restoreFeedback(cb, err, data.dependencies));
                            });
                        //Could not create bower.json
                        } else {
                            restore(file, restoreFeedback(cb, err));
                        }
                    });
                //Could not merge plugin's files
                } else {
                    restore(file, restoreFeedback(cb, err));
                }
            });
        //Could not create backup copy
        } else {
            cb(err);
        }
    });
}

/**
 * Logs feedback about installing dependecies using console.log and console.error.
 * @param {string|object|null|undefined} err Optional error to be logged
 * @param {string} file Path to json file with dependeciencies list
 * @param {object|undefined} installedDeps Collection of installed dependencies
 * @returns {undefined}
 */
function installDepsFeedback(err, file, installedDeps) {
    if (err) {
        console.error('Installing ' + file + ' dependencies failed: ' + err);
    } else {
        console.log('Installed ' + file + ' dependecies: ');
        console.log(installedDeps);
    }
}

if (isTest) {
    console.log('Running in test mode without executing the commands.');
}

installDependecies('bower.json', 'bower install', config, function (err, installedDeps) {
    installDepsFeedback(err, 'bower.json', installedDeps);
    installDependecies('package.json', 'npm install', config, function (err, installedDeps) {
        installDepsFeedback(err, 'package.json', installedDeps);
    });
});
