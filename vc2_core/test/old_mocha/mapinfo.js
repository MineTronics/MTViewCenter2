var require=require('../../../build/vc2/static/require.js').require //this is the only absolute path you need to give

console.log(process.cwd())

var assert = console.assert = require('assert');

define('angular', [], function() {
	return {};
})

define('angular', [], function() {
	return {controller: function(){}};
})

define('jquery', [], function() {
	return {
		ajax: function() {
			var fs = require('fs');
			var txt = fs.readFileSync('test/old_mocha/mapinfo.json').toString();

			var ret = {
				always: function(cb) {
					cb(null, JSON.parse(txt));
					return this;
				}
			}
			ret.done=ret.fail=ret.always;
			return ret;
		}
	}
})

var VC2_api = {
	drawing: {

	}
}

require('mt_pubsub')
var MT = require('mt_core')
MT=require('mt_plugin')

define('scenejs', [], function() {
	return {engine: {}, SceneJS_events: {a: {}}};
})

define('map-drawing', [], function() {
	return VC2_api;
})

require('mt_plug_mapinfo')

var _ = require('underscore')

describe('devinfo fetcher', function () {

	var mapinfo=MT.Plugin.find('mt/map-info');

	it('parse data', function (done) {
		assert(MT.Plugin.find('mt/map-info').fetch) //this plugin was registered
		MT.Plugin.find('mt/map-info').fetch(function(xhr, resp) {
			assert(typeof resp == 'object')
			assert.equal(Object.keys(resp).length, 2, "resp does not have MT.nodes nor MT.edges");
			done()
		})
	});

	it('should call createNode for every entry in mapinfo', function () {
		//simulates //console.log(angular.injector(['drawing']).get('drawingService').scene);
		mapinfo.fetch(function(xhr, resp) {
			VC2_api.drawing.createNode = function() {
				arguments[5]()
			};
			var cnt=0;
			resp['MT.nodes'].map(function(e,i) {
				// function createNode(node_id, x, y, z, layerId, callback)
				VC2_api.drawing.createNode(i, e.x, e.y, e.z, "layerID", function() {cnt++})
			})
			assert.equal(cnt, resp['MT.nodes'].length)
		})
	});

	it('should call createEdge for every entry in mapinfo', function () {
		mapinfo.fetch(function(xhr, resp) {
			VC2_api.drawing.createEdge = function() {
				arguments[5]()
			};
			var cnt=0;
			resp['MT.edges'].map(function(e,i) {
				// function createEdge(edge_id, id1, id2, size, layerId, callback)
				VC2_api.drawing.createEdge(i, e.from, e.to, 13, "layerID", function() {cnt++})
			})
			assert.equal(cnt, resp['MT.edges'].length)
		})
	});

});
