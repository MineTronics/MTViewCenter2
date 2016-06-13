'use strict';
var path = require('path');
var DEFAULT_OPTIONS = {
    mainLanguage: 'en.json'
};
/**
 * Registers task for merging language json files into one, to be served for 
 * providing i18n support. Only top first keys of json objects are merged, f.e
 * having parsed json objects:
 * var a = {
 *    aa: 'Some text a',
 *    inner: {
 *        ai: 'Some text in inner object a'
 *    }
 * };
 * 
 * var b = {
 *    bb: 'Some text b',
 *    inner: {
 *       bi: 'Some text in inner object b'
 *    }
 * }
 * 
 * Will result in merged object:
 * var merged = {
 *    aa: 'Some text a',
 *    bb: 'Some text b',
 *    inner: {
 *       bi: 'Some text in inner object b' //'inner' property value was replaced 
 *    }
 * }
 * 
 * When running in grunt verbose mode all replaced properties will be logged.
 * 
 * @param {object} grunt - Running Grunt instance
 * @returns {undefined}
 */
module.exports = function (grunt) {
    /**
     * Load and parse JSON file using grunt.file api
     * @param {string} path - File path
     * @returns {object} Parsed json
     */
    function loadJson(path) {
        return grunt.file.readJSON(path);
    }

    /**
     * Merges not recursively accumulator (object) with language object by 
     * adding all key-value pairs from language object, possibly overriding the 
     * accumulator values.
     * 
     * @param {object} merged - Result (accumulator object)
     * @param {object} langObject - Partial language object to be merged
     * @returns {object} - Merged language file with accumulator
     */
    function merge(merged, langObject) {
        Object.keys(langObject).forEach(function (key) {
            if (merged[key]) {
                grunt.verbose.writeln('Overriding language key ' + key + ' with ' +
                        'value ' + langObject[key]);
            }
            merged[key] = langObject[key];
        });
        return merged;
    }

    /**
     * Recursively walks two language objects, treating one as a model and the 
     * other as comparison target, to find missing properties from the target.
     * Complete path to missing property value is recorded instead of just the 
     * top-most parent property.
     * @param {object} model - Langage object which should contain only objects 
     * and strings, used as a model when comparing.
     * @param {object} target - Langage object which should contain only objects 
     * and strings which is compared to the model.
     * @param {string[]} result - Array accumulator for missing properties full
     * paths.
     * @param {type} parentProp - Helper param to pass parent property in recursive
     * calls.
     * @returns {undefined}
     */
    function compareLangObjects(model, target, result, parentProp) {
        if (model && typeof model === 'object') {
            Object.keys(model).forEach(function (prop) {
                compareLangObjects(
                    model[prop],
                    target ? target[prop] : target,
                    result,
                    parentProp ? parentProp + '.' + prop : prop
                );
            });
        } else if (typeof model === 'string' && typeof target !== 'string') {
            result.push(parentProp);
        }
    }

    /**
     * Compares target language with model language to find properties that 
     * are missing in the target language.
     * @param {object} language - target language object to look for missing keys
     * @param {object} model - reference language object
     * @param {string} bundleName - file name of the language bundle file
     * @returns {string[]} Array of missing keys paths
     */
    function logMissingKeys(language, model, bundleName) {
        var missing = [];
        grunt.verbose.subhead('Looking for missing keys in '.green + bundleName +
                ' language bundle'.green);
        compareLangObjects(model, language, missing);
        if (missing.length) {
            missing.forEach(function (langKey) {
                grunt.verbose.writeln('Missing '.yellow + langKey +
                        ' lang key in '.yellow + bundleName);
            });
        } else {
            grunt.verbose.writeln('OK: No missing keys found'.green);
        }
    }

    /**
     * Compares target language with model language to find properties that 
     * are redundant and can be safely removed from the target language.
     * @param {object} language - target language object to look for redundant keys
     * @param {object} model - reference language object
     * @param {string} bundleName - file name of the language bundle file
     * @param {string} mainBundleName - file name of the main language bundle
     * @returns {string[]} Array of redundant keys paths
     */
    function logRedundantKeys(language, model, bundleName, mainBundleName) {
        var redundant = [];
        grunt.verbose.subhead('Looking for prunable keys in '.green + bundleName +
                ' language bundle'.green);
        compareLangObjects(language, model, redundant);
        if (redundant.length) {
            redundant.forEach(function (langKey) {
                grunt.verbose.writeln('Key '.yellow + langKey + ' in '.yellow +
                    bundleName + ' is not present in ' + mainBundleName +
                    ' file and can be removed'.yellow);
            });
        } else {
            grunt.verbose.writeln('OK: No redundant keys found'.green);
        }
    }

    /**
     * Removes .json substring from given filename.
     * @param {string} filename - Filename to remove .json extension if present
     * @returns {string} New string without the '.json' substring
     */
    function removeJsonExt(filename) {
        return filename.replace('.json', '');
    }

    /**
     * Task for merging language json files into one, to be served for 
     * providing i18n support. Only top first keys of json objects are merged, f.e
     * having parsed json objects:
     * var a = {
     *    aa: 'Some text a',
     *    inner: {
     *        ai: 'Some text in inner object a'
     *    }
     * };
     * 
     * var b = {
     *    bb: 'Some text b',
     *    inner: {
     *       bi: 'Some text in inner object b'
     *    }
     * }
     * 
     * Will result in merged object:
     * var merged = {
     *    aa: 'Some text a',
     *    bb: 'Some text b',
     *    inner: {
     *       bi: 'Some text in inner object b' //'inner' property value was replaced 
     *    }
     * }
     * 
     * When running in grunt verbose mode all replaced properties will be logged.
     * 
     * @returns {undefined}
     */
    function buildLangFiles() {
        var thisTask = this,
            options = thisTask.options(DEFAULT_OPTIONS),
            bundles = {},
            mainBundle,
            bundlesKeys;

        thisTask.files.forEach(function (file) {
            file.src.forEach(function (filePath) {
                var json = loadJson(filePath),
                    filename = path.basename(filePath);
                if (!bundles[filename]) {
                    bundles[filename] = {};
                }
                bundles[filename] = merge(bundles[filename], json);
            });

        });

        if (!bundles[options.mainLanguage]) {
            grunt.fail.warn('Missing default langage file: ' + options.mainLanguage);
        }

        if (!options.destDir) {
            grunt.fail.warn('Missing destination directory for built language bundles');
        }

        mainBundle = bundles[options.mainLanguage];
        bundlesKeys = Object.keys(bundles);
        bundlesKeys.forEach(function (bundleName) {
            var bundle = bundles[bundleName];
            //Omit checking model language with itself
            if (bundleName !== options.mainLanguage) {
                logMissingKeys(bundle, mainBundle, bundleName);
                logRedundantKeys(bundle, mainBundle, bundleName, options.mainLanguage);
            }
            grunt.file.write(options.destDir + '/' + bundleName, JSON.stringify(bundles[bundleName]));
        });

        bundlesKeys = bundlesKeys.map(removeJsonExt);
        grunt.log.writeln('Available languages: ' + bundlesKeys.join(', '));
        grunt.config('appConfig.languages', bundlesKeys);
    }

    grunt.registerMultiTask('build_lang_files', 'Combines language files into bundles' +
            ' for each language found.', buildLangFiles);
};