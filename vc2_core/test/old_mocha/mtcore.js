var require=require('../mtjs/require.js').require //this is the only absolute path you need to give

console.log(process.cwd())

var c=console;

var assert = console.assert = require('assert');

var MT = require('mt_core')
var _ = require('underscore')

describe('mt/core', function () {

	it('should behave like inheritance', function () {
		var PosChanged = MT.Object.extend({
			construct: function(data) {
				console.log('saving to history...', this.id, this.newpos);
			},
			exec: function() {
				console.log('emit', this.id, this.newpos);
				console.error('Not implemented.');
				return this;
			}
		})
		var poschanged=new PosChanged({id: 42, newpos: [.1, .2]});
		poschanged.exec();
	});

	it.skip('double new on created class. This has to fail due to the fact that constructor executed with `new` always return `Object`' ,function(){
		var class1=MT.Object.extend({ver: 1});
		var class2=new class1.extend({ver: 2});
		var class3=new class1.extend({ver: 3});
		assert(class3.ver==3)
	})

	it('does instantializing objects of classes allow overridding .impl', function() {
		var cnt={val:0}
		,cnt1={val:0}
		,cnt2={val:0}
		;
		var PluginClass = MT.Object.extend({
			impl: {},
			callbacks: ['enable','disable'],
			enable: (function (cnt) {return function defena() {
				cnt.val++;
				this.impl.enable && this.impl.enable.apply(this, arguments);
			}})(cnt),
		});
		//PluginClass.enable();
		var plugin1 = new PluginClass({
			enable: (function (cnt) {return function defena1() {
				cnt.val++;
			}})(cnt1)
		});
		var plugin2 = new PluginClass({
			enable: (function (cnt) {return function defena2() {
				cnt.val++;
			}})(cnt2)
		});
		plugin1.enable();
		plugin2.enable();
		console.log('cnt.vals', [cnt.val,cnt1.val, cnt2.val]);
		console.log('plugin1');
		console.dir(plugin1);
		console.log('plugin2');
		console.dir(plugin2);
		assert(_.isEqual([cnt.val,cnt1.val, cnt2.val],[2,1,1]), 'execution counters are wrong. fix inheritance');
	})

	it('callable extension: check whether both functions (A and B) will be executed if callbacks property in class is given', function() {
		var Action = MT.Object.extend({
			callbacks: ['exec'],
			impl: {},
			exec: function A(){
				console.info('default', this);
				this.cntr=1;
				return this.impl.exec.apply(this, arguments); //its crucial to understand why there's no this.impl.exec();
			}
		});
		console.log('Action');
		console.dir(Action);
		var PosChanged = Action.extend({
			onlyinPoschanged: {},
			exec: function B(self) {
				this.cntr++;
				console.log(this, 'saving to history...', this.newpos);
				return this;
			}
		});
		var pos=new PosChanged({newpos: [1,1]}).exec();
		assert(pos.cntr==2, 'not all functions were executed');
	});

	it('testing extending object to action and action to position change', function() {
		var Action = MT.Object.extend({exec: function(){console.log('impl.');}});
		console.log('action.proto',MT.Object.__proto__);
		var PosChanged = Action.extend({
			construct: function(data) {
				console.log('saving to history...', this.newpos);
			},
			exec: function(){
				try {
					this.prevpos=MT.Devices[this.id].pos;
					//if(!this.prevpos) delete this.prevpos;
					MT.Devices[this.id].pos=this.newpos;
					//throw -1;
				} catch (e) {
					this.error(e);
				};
				console.log('emit', this.id, this.newpos);
				return this;
			},
			undo: function(){
				try {
					MT.Devices[this.id].pos=this.prevpos;
				} catch (e) {
					this.error(e);
				};
				console.log('emit', this.id, this.prevpos);
			},
			error: function() {
				console.error('customized error in occured in posChanged');
			}
		});
		//posChanged.exec({newpos:[.1,.2]});
		function str(o) {
			return JSON.stringify(o);
		};

		MT.Devices={1337: {}};
		MT.Devices[1337]={};
		console.log('before',str(MT.Devices[1337]));
		var posch=new PosChanged({id: 1337, newpos:[.2,.2]}).exec();
		console.assert(_.isEqual(MT.Devices[1337].pos,[.2,.2]),'transition 1 not recorded');
		var posch=new PosChanged({id: 1337, newpos:[.3,.3], error: function(e) {console.error('individual error in posChanged',e);}}).exec();
		console.assert(_.isEqual(MT.Devices[1337].pos,[.3,.3]),'transition 2 not recorded');
		console.log('after',str(MT.Devices[1337]));
		posch.undo();
		console.assert(_.isEqual(MT.Devices[1337].pos,[.2,.2]),'transition not recorded');
		console.log('after undo',str(MT.Devices[1337]));
		posch.exec();
		console.assert(_.isEqual(MT.Devices[1337].pos,[.3,.3]),'transition not recorded');
		console.log('after un-undo',str(MT.Devices[1337]));
		console.log('e',posch);
		delete MT.Devices;
	})

	it('error handling test', function() {
		var PosChanged = MT.Object.extend({
			construct: function(data) {
				console.log('saving to history...', this.id, this.newpos);
			},
			exec: function() {
				try {
					throw -1;
				} catch (e) {
					console.info("if there's error, its fine.");
					throw "should be catched within test";
				}
				return this;
			}
		});
		var poschanged=new PosChanged({id: 42, newpos: [.1, .2]});
		try {
			poschanged.exec();
		} catch (e) {
			"its ok"
			return;
		}
		assert(false, "it was supposted to throw an exception");
	})

	it('custom and individual error handling test', function() {
		var PosChanged = MT.Object.extend({
			construct: function(data) {
				console.log('saving to history...', this.id, this.newpos);
			},
			exec: function() {
				try {
					throw -1;
				} catch (e) {
					this.error(e);
				}
				return this;
			},
			cnt: 0
		});
		var poschanged=new PosChanged({id: 42, newpos: [.1, .2]}).exec();
		poschanged=new PosChanged({id: 42, newpos: [.1, .2], error: function(e) {console.info('individual error', e, this.cnt++);}}).exec();
		assert.equal(PosChanged.cnt, 0) //ensure that only instance's value changes
		assert.equal(poschanged.cnt, 1)
	})

	it('handling errors in action implementation', function() {
		//MT.Devices={42: {}} //commented out on purpose
		var cntr={v: 0};
		var PosChanged = MT.Object.extend({
			construct: function(data) {
				console.log('saving to history...', this.id, this.newpos);
			},
			exec: function() {
				try {
					this.prevpos=MT.Devices[this.id].pos;
					MT.Devices[this.id].pos=this.newpos;
				} catch (e) {
					this.error(e);
				}
				console.log('emit', this.id, this.newpos, 'prev', this.prevpos);
				return this;
			},
			undo: function() {
				try {
					MT.Devices[this.id].pos=this.prevpos;
				} catch (e) {
					this.error(e);
				}
				console.log('emit', this.id, this.prevpos);
				return this;
			},
			error: (function(cntr){ return function(e) {
				console.info('there was an error', e, 'but do not worry, in this case it was expected.');
				cntr.v++;
			}})(cntr)
		});
		var poschanged=new PosChanged({id: 42, newpos: [.1, .2]}).exec();
		poschanged.exec();
		poschanged=new PosChanged({id: 42, newpos: [.3, .4]});
		poschanged.exec();
		poschanged.undo();
		assert.equal(cntr.v, 4)
	})

	it('inheritance test - is reverting working', function() {
		MT.Devices={42: {}}
		var PosChanged = MT.Object.extend({
			construct: function(data) {
				console.log('saving to history...', this.id, this.newpos);
			},
			exec: function() {
				this.prevpos=MT.Devices[this.id].pos;
				MT.Devices[this.id].pos=this.newpos;
				console.log('emit', this.id, this.newpos, 'prev', this.prevpos);
				return this;
			},
			undo: function() {
				MT.Devices[this.id].pos=this.prevpos;
				console.log('emit', this.id, this.prevpos);
				return this;
			}
		});
		var poschanged=new PosChanged({id: 42, newpos: [.1, .2]}).exec();
		poschanged.exec();
		poschanged=new PosChanged({id: 42, newpos: [.3, .4]});
		poschanged.exec();
		assert(MT.Devices[42].pos[0]===.3);
		assert(MT.Devices[42].pos[1]===.4);
		poschanged.undo();
		console.log(MT.Devices[42].pos);
		assert(MT.Devices[42].pos[0]===.1);
		assert(MT.Devices[42].pos[1]===.2);
	})

	it('inheritance test - is function executing working', function() {
		MT.Devices={42: {}}
		var PosChanged = MT.Object.extend({
			construct: function(data) {
				console.log('saving to history...', this.id, this.newpos);
			},
			exec: function() {
				MT.Devices[this.id].pos=this.newpos;
				console.log('emit', this.id, this.newpos);
				return this;
			}
		});
		var poschanged=new PosChanged({id: 42, newpos: [.1, .2]});
		poschanged.exec();
		assert.equal(MT.Devices[42].pos[0], .1);
		assert.equal(MT.Devices[42].pos[1], .2);
	})

	it('does pubsub error handling work; is pubsub mechanism inheriting global `.error` method? tested by overwriting global error method THIS TEST HAS SIDE EFFECTS AND THERE IS POSSIBILITY THAT IT WILL RUIN OTHER TESTS, use it.skip if needed', function(done) {
		var cnt={val:0};
		console.info('cnt',cnt);
		var backuperror = MT.Events.error;
		MT.Events.error=(function(cnt, done){
			return function(){
				cnt.val++;
				console.info('error found. OK.');
				//done() //uncommenting this line proves that done instance is shared accross other tests and executed multiple times
			};
		})(cnt, done);
		var fnc = function(){
			console.assert(cnt.val==1, 'did not execute');
			console.info('fnc: backuperror', this.backuperror)
			MT.Events.error = this.backuperror;
			done()
		};
		fnc.backuperror=backuperror;
		console.info('global: backuperror', fnc.backuperror)
		setTimeout(_.bind(fnc, fnc) || "bind assigns 1st-arg function to specific 2nd-arg context, or opposite", 50);
		setTimeout(function(){
			MT.pub('test-topic2');
			return "this function forces topic-does-not-exist exception, which should be catched by overriden by us handler"
		}, 50/2);
	})

	it('exchanging errors (exceptions) from other thread (setTimeouts)')
	it('execute prehook')
	it('execute posthook')
	it('execute multiple posthooks and prehooks')
	it('should publish msg')
	it('should receive subscribed msg')

	it.skip('test callbacks overriding array in objects', function() {
		var cnt=1;
		var Class1 = MT.Object.extend({
			callbacks: ['ex']
			, ex: function(){cnt*=2;}
		})
		var Class2 = Class1.extend({
			callbacks: ['ex', 'ex2']
			, ex: function(){cnt*=3;}
			, ex2: function(){cnt*=5;}
		})
		Class2.ex();
		Class2.ex2();
		assert.equal(cnt, 2*3*5);
	})
})
