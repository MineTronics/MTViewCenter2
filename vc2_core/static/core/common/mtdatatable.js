define(['angular', 'datatables', 'core/i18n/i18n_module'], function (angular, datatables, i18nModule) {
    'use strict';

    var mtDatatableModuleName = 'mt.datatable';

    function mtDatatableFactory($translate) {
        var DATATABLES_LANGUAGE_KEYS = [
            'DATATABLES.emptyTable',
            'DATATABLES.info',
            'DATATABLES.infoEmpty',
            'DATATABLES.infoFiltered',
            'DATATABLES.infoPostFix',
            'DATATABLES.thousands',
            'DATATABLES.lengthMenu',
            'DATATABLES.loadingRecords',
            'DATATABLES.processing',
            'DATATABLES.search',
            'DATATABLES.zeroRecords',
            'DATATABLES.paginate.first',
            'DATATABLES.paginate.last',
            'DATATABLES.paginate.next',
            'DATATABLES.paginate.previous',
            'DATATABLES.aria.sortAscending',
            'DATATABLES.aria.sortDescending'
        ];

        function translateDtKeys() {
            var promise = $translate(DATATABLES_LANGUAGE_KEYS)
                .then(function (translations) {
                    return {
                        emptyTable:     translations['DATATABLES.emptyTable'],
                        info:           translations['DATATABLES.info'],
                        infoEmpty:      translations['DATATABLES.infoEmpty'],
                        infoFiltered:   translations['DATATABLES.infoFiltered'],
                        infoPostFix:    translations['DATATABLES.infoPostFix'],
                        thousands:      translations['DATATABLES.thousands'],
                        lengthMenu:     translations['DATATABLES.lengthMenu'],
                        loadingRecords: translations['DATATABLES.loadingRecords'],
                        processing:     translations['DATATABLES.processing'],
                        search:         translations['DATATABLES.search'],
                        zeroRecords:    translations['DATATABLES.zeroRecords'],
                        paginate: {
                            first:      translations['DATATABLES.paginate.first'],
                            last:       translations['DATATABLES.paginate.last'],
                            next:       translations['DATATABLES.paginate.next'],
                            previous:   translations['DATATABLES.paginate.previous']
                        },
                        aria: {
                            sortAscending:  translations['DATATABLES.aria.sortAscending'],
                            sortDescending: translations['DATATABLES.aria.sortDescending']
                        }
                    };
                });

            return promise;
        }

        function createDatatable(element, options, oldTable) {
            return translateDtKeys()
                .then(function (language) {
                    //Datatables will not trigger change in language options
                    //if the same options object is passed
                    var optionsCopy = angular.copy(options);
                    optionsCopy.language = language;
                    return element.DataTable(optionsCopy);
                });
        }

        return {
            createDatatable: createDatatable
        };
    }
    mtDatatableFactory.$inject = ['$translate'];

    angular
        .module(mtDatatableModuleName, [i18nModule])
        .factory('mtDatatableFactory', mtDatatableFactory);

    return mtDatatableModuleName;
});