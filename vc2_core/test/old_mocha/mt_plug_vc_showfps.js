var require=require('../mtjs/require.js').require //this is the only absolute path you need to give

console.log(process.cwd())

var assert = console.assert = require('assert');

define('angular', [], function() {
	return {controller: function(){}};
})

var MT = require('mt_core')

define('mt_plug_vc', [], function() {
	return {
		scene: {
			off: function() {},
			on: function() {}
		}
	}
})

define('stats', [], function() {
	return function() {
		this.domElement = {style: {}}
	}
})

var fps = require('mt_plug_vc_showfps')

define('document', [], function() {
	return {
		body: {}
	};
});

var _ = require('underscore')

describe('mt/plug/vis/fps', function () {

	it('should be instantialized', function() {
		assert(MT.Plugin.find('mt/vis/show-fps'))
	})

	it('should be instantialized via vc.scene', function(done) {
		require(['document'], function(document) {
			var cnt=0;
			document.body.appendChild = function(arg) {
				cnt++;
			}
			fps.enable();
			delete document.body['appendChild'];
			assert.equal(cnt, 1);
			document = null;
			done();
		})
	})

	it('should be instantialized via pubsub event')

	it('should deinitialize when turned off vc2')

	it('should not appear when vc not initialized')

})
