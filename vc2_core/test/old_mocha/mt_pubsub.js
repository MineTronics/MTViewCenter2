var require=require('../mtjs/require.js').require //this is the only absolute path you need to give

console.log(process.cwd())

var c=console;

var assert = console.assert = require('assert');

var MT = require('mt_core')
var _ = require('underscore')

describe('mt/pubsub', function () {

	it('pubsub test - does it work', function(done) {
		var cnt={val:0};
		MT.sub('test-topic', (function(cnt) {return function(){
			console.log('exec test topic ',cnt)
			cnt.val++;
		};})(cnt));
		MT.pub('test-topic');
		setTimeout(function(){
			assert.equal(cnt.val, 1, 'did not execute');
			done()
		}.bind(this),10); //double testing, even from another thread
		assert.equal(cnt.val, 1, 'did not execute');
	})

	it('does accept array of arguments', function() {
		 MT.sub('topic2', function(data) {
		 	assert.equal(data.val, 1, "arguments passed via properties were not parsed correctly");
		 })

		 MT.pub('topic2', {val: 1})
	})

	it('does accept properties object', function() {
		 MT.sub('topic', function(firstarg, secondarg) {
		 	assert.equal(firstarg, 'first arg')
		 	assert.equal(secondarg, 'second arg')
		 })
		 MT.pub('topic', ['first arg', 'second arg'])
	})

})
