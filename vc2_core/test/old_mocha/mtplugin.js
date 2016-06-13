var require=require('../mtjs/require.js').require //this is the only absolute path you need to give

console.log(process.cwd())

var assert = console.assert = require('assert');

require('mt_pubsub')
var MT = require('mt_core')
require('mt_plugin')
var _ = require('underscore')

describe('mt/plugin', function () {

	it('verify removal of plugin after destruct')

	it('should execute onRegister', function (done) {
		new MT.Plugin({
			name: 'mt/test1',
			version: 1,
			onRegister: (function (done) { return function() {
				done()
			}})(done)
		});
	});

	it('it should throw error when no enable or disable method')

	it('two different calls to angulars module should return the same module')

	it('handle single posthook', function() {
		var cnt=0;
		var class1 = MT.Plugin.extend({
			construct: function() {
				cnt+=3;
			}
		})
		new class1();
		assert.equal(cnt, 3);
	})

	it.skip('handling of multiple level-in-class-hierarchy posthooks for constructor', function () {
		var cnt=0;
		MT.Plugin.addPostHook('construct', function() {
			cnt+=2;
		})
		var class1 = MT.Plugin.extend({
			construct: function() {
				cnt+=3;
				console.log('elo', this)
			}
		})
		new class1();
		assert.equal(cnt, 5);
	})

	it('should not assign properties to .impl if they are not in callbacks')

	it('should return false only if not initialized correctly, otherwise does not matter', function() {
		//MT.topicAsStream('plugin-load').take(1).exec(function() {})
		var cnt=0;
		MT.actions['plugin-load'].error=function() {cnt++}
		var plug=new MT.Plugin({
			onRegister: function() {
				return false;
			}
		});
		assert.equal(typeof plug.onRegister(), typeof false, "onRegister does not return boolean")
		assert(plug.onRegister()===false, "onRegister did not return false")
		console.log(plug)
		assert(cnt>=1, "onRegister did not fail");
		delete MT.actions['plugin-load']['error']
	})

	it("onRegister should execute plugin's .error method rather than action's")

	it('should retjurn undefined when onRegister succeeded', function() {
		var plug=new MT.Plugin({
			cnt: 0,
			error: function() {this.cnt++},
			onRegister: function() {
			}
		});
		assert(plug.onRegister()===undefined, "onRegister did not return undefined")
		assert.equal(typeof plug.onRegister(), typeof undefined, "onRegister did not ret undef")
	})

	it('should emit event on loading plugin', function() {
		var did=false;
		MT.sub('plugin-load', function() {did=true;})
		var plug=new MT.Plugin({
			onRegister: function() {
				return false;
			}
		});
		assert(did, "loading plugin did not emit event")
	})

	it('onRegister should not be there by default', function() {
		var plug=new MT.Plugin({});
		assert(typeof plug.onRegister != "function", "onRegister is there");
	})

	it('should not initialize when there are not required plugins enabled (if plugin A depends on B, then A cannot be loaded before B is loaded', function() {
		var pluga=new MT.Plugin({
			name: 'pluginA'
		});
		plugb=new MT.Plugin({
			name: 'pluginB',
			deps: ['pluginA']
		});
		try {
			plugb.enable();
		} catch(e) {
			console.error("ERROR", e)
			return;
		}
		assert(false && MT.Plugin.find('pluginB').enabled, 'PluginB should not be initialized at all, because it depends on non-enabled-yet pluginA.');
	})

	it('allow enabling plugin only if all deps fulfilled', function() {
		var pluga=new MT.Plugin({
			name: 'pluginC'
		});
		plugb=new MT.Plugin({
			name: 'pluginD',
			deps: ['pluginC']
		});
		pluga.enable();
		plugb.enable();
		assert.equal(true, MT.Plugin.find('pluginD').enabled, 'PluginB was not enabled for some reason');
	})

	it('should disable plugin when plugin which is depencence plugin of this plugin (plguin A depends on B, then disabling B disables also A)')

})
