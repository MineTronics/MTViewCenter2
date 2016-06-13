define([], function pubsub() {
    "use strict";

    function pubsubFactory() {
        var topics = {};

        /**
         * Invokes topic subscribers' callbacks with given arguments.
         *
         * There are two possible syntaxes:
         * MT.pub('topic', array) <==> MT.pub('topic', ['first arg', 'second arg'])
         * MT.pub('topic2', object) <==> MT.pub('topic2', {val: 1})
         * Those properties can be accessed in following way:
         * MT.sub('topic', function(firstarg, secondarg){})
         * MT.sub('topic2', function(data){ console.log(data.val); })
         * @param {type} topic
         * @param {type} args
         * @returns {undefined}
         */
        function pub(topic, args) {
            var thisTopic = topics[topic],
                thisArgs = args || [];
            if (thisTopic) {
                thisTopic.forEach(function (topicCallback) {
                    if (thisArgs.length) {
                        topicCallback.apply(this, thisArgs);
                    } else {
                        topicCallback.call(this, thisArgs);
                    }
                });
            } else {
                console.error('Topic ' + topic + ' does not exists.');
            }
        }

        // Returns a handle needed for unsubscribing
        function sub(topic, callback) {
            if (!topics[topic]) {
                topics[topic] = [];
            }

            topics[topic].push(callback);

            return {
                topic: topic,
                callback: callback
            };
        }

        function unsub(handle) {
            var thisTopic, filteredSubList;
            if (topics[handle.topic]) {
                thisTopic = topics[handle.topic];

                filteredSubList = thisTopic.filter(function (callback) {
                    return callback !== handle.callback;
                });

                topics[handle.topic] = filteredSubList;
            }
        }


        /**
         * For backwards compatibility
         * @returns {pubsub.PubSub}
         */
        function getNewPubSub() {
            return pubsubFactory();
        }

        return {
            topics: topics,
            pub: pub,
            sub: sub,
            unsub: unsub,
            getNewPubSub: getNewPubSub
        };
    }

    return pubsubFactory;
});
