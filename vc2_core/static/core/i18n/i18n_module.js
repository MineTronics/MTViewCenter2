define([
    'angular',
    'ng-translate',
    'ng-translate-loader', //For loading language files
    'ng-translate-logger' //For logging missing translations
], function (angular) {
    'use strict';

    /**
     * Injects and compiles button template to the plugin tab list. This button
     * allows changing the language.
     * @param {type} $translate
     * @param {type} $compile
     * @returns {i18n_module_L1.i18nButton.i18n_moduleAnonym$1}
     */
    function i18nButton($translate, $compile) {
        return {
            restrict: "A",
            link: function (scope, element, attr) {
                scope.langs = {
                    en: "LANG.EN",
                    pl: "LANG.PL",
                    si: "LANG.SI",
                    de: "LANG.DE"
                };
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
    i18nButton.$inject = ['$translate', '$compile'];

    /**
     * Configuration for the angular translate library
     * @param {type} $translateProvider
     * @returns {i18n_module_L1.configureTranslateModule}
     */
    function configureTranslateModule($translateProvider) {
        $translateProvider
            .useStaticFilesLoader({
                prefix: '/static/lang/',
                suffix: '.json'
            })
            .preferredLanguage('en')
            .fallbackLanguage('en')
            .useMissingTranslationHandlerLog();
    }
    configureTranslateModule.$inject = ['$translateProvider'];

    var i18nModuleName = 'mt.i18n';

    angular
        .module(i18nModuleName, ['pascalprecht.translate'])
        .directive('i18nButton', i18nButton)
        .config(configureTranslateModule);

    return i18nModuleName;
});