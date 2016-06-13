var require=require('../mtjs/require.js').require //this is the only absolute path you need to give

console.log(process.cwd())

var assert = console.assert = require('assert');

define('angular', [], function() {
	return {controller: function(){}};
})

require('mt_pubsub')
var MT = require('mt_core')
MT=require('mt_plugin')
require('mt_plug_config')
var _ = require('underscore')

if(0)
describe('mt/plug/config', function () {

	it('MT.Plugins has to be not null', function() {
		assert(MT.Plugin)
	})

	it('should enable enable plugins, .enabled property should be Object.observe-d by plugins', function() {
		console.log(',elo', MT)
		var len=MT.plugins.length
		new MT.Plugin({name: 'psls'})
		console.assert(MT.plugins.length==len+1, "plugin was not created")
		new MT.Plugin({name: 'vis1'})
		new MT.Plugin({name: 'vis2'})
		console.log(',elo', Object.keys(MT.Plugin))
		MT.Config.update({
			'psls.enabled': true,
			'vis1.enabled': false,
			'vis2.enabled': true
		})
		assert(!!MT.Plugin.find('psls'), "find returned undef")
		assert(MT.Plugin.find('psls').enabled, "plugin was not enabled")
		assert(!MT.Plugin.find('vis1').enabled)
		assert(MT.Plugin.find('vis2').enabled)
		MT.Config.reset()//prepare for other tests
	})

	/**
	 * Having this kind of API would allow us to easily exchange settings
	 */
	it('should update camera-eye', function() {
		var vis=new MT.Plugin({name: 'vis', 'camera-eye': [0, 0, 0]}), newcameye;
		MT.Config.update({'plugin-vis.camera-eye': newcameye=[3.14, .28, 42]})
		assert(_.equal(vis['camera-eye'], newcameye));
	})

	it('MT.Config.persist should save config using custom storage', function() {
		var MTStorage = {
			storage: {},
			keys: function() {
				return Object.keys(this.storage);
			},
			save: function(name, val) {
				this.storage[name]=val;
			},
		}
		var properties;
		MT.Config.update(properties={
			'plugin-vis.camera-zoom': 13,
			'updateDevs': 5,
			'plugin-vis/selected-devs': [1501, 1502]
		});
		MT.Config.persist(MTStorage || MT.Storage) //persist using customized storage or use default one
		assert(_.containsAll(Object.keys(properties), MTStorage.keys()))
	})

	it('should continously synchronize camera-eye, test consumption of settings-fetched. This test simulates that there are two browsers running on different computers and they are fetching actions from the server (DB), both clients should have synchronized actions', function(done) {

		//client1 and client2 represent two clients which are sending and receiving data
		var MT1={} //context for first client, those contexts differ only with pub/sub implementations
		var client1={incoming: {}, outgoing: {}}
		var MT2={} //context for second client
		var client2={incoming: {}, outgoing: {}}

		var contexts={};
		var MTSyncRL = MT.Plugin.extend({
			name: 'sync settings over TCP!',
			onRegister: function() {this.enable();}, //for testing immediately enable this plugin
			client: undefined, //this should be set as a testing environment client dependent
			config: undefined, //config storing settings, each client has its own
			enable: function() {
				this.hnd=MT.update.addPostHook(function(data) {
					//iterate over given properties
					var nn, vv;
					data.each(function(n, v) {this.otherClient.incoming[nn=n]=vv=v;}) //iterate over all changed properties in this settings update
					// simulate other reads the data
					this.otherClient.pub('settings-fetched') //this triggers otherClient's config parser
					assert(this.otherClient.config[nn]==vv); //verify that settings were updated
				})
			},
			//in case of this test pub is launched only when new settings
			pub: function() {
				assert.equals(this.client, contexts.receiver) //ensure that pub is executed only within
				var data=this.incoming;
				assert(Object.keys(data).indexOf('plugin-vis.camera-eye')!=-1) //ensure that given setting exists
				var key;
				this.config[key=Object.keys(data)[0]]=data[key]; //simulate that event was processed
			},
			disable: function() {
				this.hnd(); //remove postHook
			}
		})
		contexts.receiver=client2;
		var MTSync1 = new MT.Plugin({client: client1, otherClient: client2, config: {}}) //creation with new automatically calls exec (enabled plugin)
		var MTSync2 = new MT.Plugin({client: client2, otherClient: client1, config: {}})
		var ar;
		MTSync1.update({'plugin-vis.camera-eye': ar=[1, 2, 3]}); //this emits
		assert(_.equal(MTSync2.config['plugin-vis.camera-eye'], ar))
		MTSync1.update({'plugin-vis.camera-eye': ar=[2, 3, 4]});
		assert(_.equal(MTSync2.config['plugin-vis.camera-eye'], ar))
		MTSyncRL.destroy(); //clean after test
	})

	it('should perform smart, incremental diff of settings obj', function() {
		var instance;
		MT.Config.update({val: 0, 'very-heavy-object': (instance={})})
		new MT.update({val: 1})
		new MT.update({val: 2})
		assert.equals(MT.config['very-heavy-object'], instance) //verify that settings updates are inheriting previous settings via .__proto__ - this means settings are differed incrementaly using Object.create
	})

	it('should group simultaneous tasks when synchronizing over TCP', function() {
		//make sure that if two tasks occur, lets say within config.get('time2grp', 2000[ms]),
		//then send those two tasks together
	})

	it('MT.update if has only one key, then updates that key', function() {
		new MT.update({val: 1337})
		assert(MT.config['val']==1337)
		new MT.update({prop: 'val', value: 1338})
		assert(MT.config['val']==1338)
	})

})
