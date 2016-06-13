define(['angular'], function (angular) {
    'use strict';

    /**
     * Returns a new and filtered collection of objects of which all has a 
     * property (filterKey) with requested value (filterVal);
     * @param {object|array} input Collection of objects to be filtered
     * @param {string} filterKey Object's property to be checked
     * @param {string} filterVal Value to be checked for equality (===)
     * @returns {object} New collection without filtered objects
     */
    function filterCollection(input, filterKey, filterVal) {
        var filteredInput = {};
        angular.forEach(input, function (value, key) {
            if (value.hasOwnProperty(filterKey) && value[filterKey] === filterVal) {
                filteredInput[key] = value;
            }
        });
        return filteredInput;
    }

    /**
     * Angular filter constructor for filterObjectByKeyVal 
     * @returns {function} filtering function
     */
    function filterObjectByKeyVal() {
        return filterCollection;
    }

    return filterObjectByKeyVal;
});