define([
    'angular',
    'ng-translate',
    'ng-translate-loader', //For loading language files
    'ng-translate-logger', //For logging missing translations
    'ng-cookies',
    'ng-translate-storage-cookie', //Fallback for remembering used language
    'ng-translate-storage-local' //Used language is remembered in local storage
], function (angular) {
    'use strict';

    var i18nModuleName = 'mt.i18n';

    /**
     * Injects and compiles button template to the plugin tab list. This button
     * allows changing the language.
     * @param {type} $translate
     * @param {type} $compile
     * @param {string[]} LANGUAGES List of available languages as their keys like 'en'
     * @returns {i18n_module_L1.i18nButton.i18n_moduleAnonym$1}
     */
    function i18nButton($translate, $compile, LANGUAGES) {
        return {
            restrict: "A",
            link: function (scope, element, attr) {
                if (!LANGUAGES.length) {
                    console.error('I18N Error: There is no information about ' +
                        'available languages. Language button might not be visible correctly.');
                }

                scope.langs = LANGUAGES.reduce(function (langsObj, langKey) {
                    langsObj[langKey] = "LANG." + langKey.toUpperCase();
                    return langsObj;
                }, {});

                var i18nTab = "<li class='pull-right i18n' dropdown>" +
                    "<a dropdown-toggle>" +
                    "{{'LANG.BUTTON' | translate}} <span class='caret'></span>" +
                    "</a>" +
                    "<div class='dropdown-menu list-group'>" +
                    "<a href='#' class='list-group-item' ng-repeat='(i,lang) in langs' ng-click='selectLang(i)'>" +
                    "<div translate>{{lang}}</div>" +
                    "<img ng-src='static/img/country_icons/{{i}}.png'>" +
                    "</a>" +
                    "</div>" +
                    "</li>";
                i18nTab = angular.element(i18nTab);
                element.children('ul').append(i18nTab);
                $compile(i18nTab)(scope);
                scope.selectLang = function (langKey) {
                    $translate.use(langKey);
                };
            }
        };
    }
    i18nButton.$inject = ['$translate', '$compile', 'LANGUAGES'];

    /**
     * Configuration for the angular translate library
     * @param {type} $translateProvider
     * @param {string[]} LANGUAGES List of available languages as their keys like 'en'
     * @returns {i18n_module_L1.configureTranslateModule}
     */
    function configureTranslateModule($translateProvider, LANGUAGES) {
        if (!LANGUAGES.length) {
            console.error('I18N Error: There is no information about ' +
                'available languages. Translate provider will not work correctly.');
        }

        //Create mapping so that 'en_US' 'en_UK' will point to the same lang key 'en'
        var langMapping = LANGUAGES.reduce(function (langMapping, langKey) {
            langMapping[langKey + '*'] = langKey;
            return langMapping;
        }, {});

        //Default mapping
        langMapping['*'] = 'en';

        $translateProvider
            .useStaticFilesLoader({
                prefix: '/static/lang/',
                suffix: '.json'
            })
            .registerAvailableLanguageKeys(LANGUAGES, langMapping)
            .fallbackLanguage('en')
            .determinePreferredLanguage()
            .useLocalStorage()
            .useMissingTranslationHandlerLog();
    }
    configureTranslateModule.$inject = ['$translateProvider', 'LANGUAGES'];

    angular
        .module(i18nModuleName, ['ngCookies', 'pascalprecht.translate'])
        .directive('i18nButton', i18nButton)
        .config(configureTranslateModule);

    return i18nModuleName;
});