
var require=require('../mtjs/require.js').require //this is the only absolute path you need to give
var assert = require("assert")
require('mt_pubsub');
require('mt_core');

var cnt = 0;

function nop() {}

define('angular', [], function() {
	return {controller: function(){}};
})

define('scenejs', [], function() {
	return {
		createScene: function() {
			cnt++;
			return {
				getNode: nop
			};
		},
		setConfigs: nop,
		SceneJS_events: {
			addListener: function(evType, cb) {
				setTimeout(cb, 50);
			}
		}
	};
})

require('mt_plugin');
require.undef('mt_plug_vc') //This has to be loaded from real file
var vc=require('mt_plug_vc'); //Preserving this here forces this test to use object obtained in this script. Even if it is replaced later.

describe('mt_vis', function() {
	it('execute createScene', function(done) {
		require(['mt_plug_vc'], function() {
			assert(!vc.enabled)

			function predone() {
				assert.equal(cnt, 1);
				done();
			}
			vc.enable(function() {
				predone()
			});
			assert(typeof vc.enabled == 'boolean')
		})
	});

	it('should emit event when created scene');
});
