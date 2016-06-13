var require=require('../mtjs/require.js').require //this is the only absolute path you need to give

console.log(process.cwd())

describe('require-testing', function () {
	it('should load modules', function (done) {
		var a1=define('test',[],function(core){
			core=core||{};
			core.lol=1;
			return core
		});
		console.log(a1)
		var a3=define('test2',['test'],function(core){
			core=core||{};
			core.lol=2;
			done();
			return core;
		});
		var a2=require(['test2'], function(core){
			console.log('initialzied correctly with', core)
		})
		console.log(a3)

	});

	it('load module correctly from module; see mv_plug_vc_showfps loading fps-stats lib')
	it('should undef modules')
});
