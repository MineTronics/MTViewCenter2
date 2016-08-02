/**
 * This utility adds localMoment() which creates a moment and sets local timezone.
 * Moment.js when parses a date from string will set the date's timezone, which
 * can differ from current timezone because of DST. 
 * 
 * In short: It wrapps moment() call into a moment().utcOffset(UTC_OFFSET) call.
 * 
 * USAGE:
 * a) Use as an angular injectable dependency named 'localMoment'
 * b) Use as a requirejs dependency with core/common/localMoment module path
 * 
 * @param {type} moment
 * @returns {undefined}
 */
define(['moment'], function (moment) {
    'use strict';

    //Current moment with local timezone
    var UTC_OFFSET = moment().utcOffset();

    /**
     * Creates a new moment with TimeZone set to local time zone. When moment
     * parses date from string it will set different time zone because of DST.
     * @returns {unresolved}
     */
    function localMoment() {
        return moment.apply(this, Array.prototype.slice.call(arguments, 0))
            .utcOffset(UTC_OFFSET);
    }

    return localMoment;
});