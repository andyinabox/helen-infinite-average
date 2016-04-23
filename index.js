var _ = require('lodash');
var shell = require('gl-now')();
var createShader = require('gl-shader');
var createTexture = require('gl-texture2d');
var gessoCanvas = require('a-big-triangle');
var glslify = require('glslify');
var RSVP = require('rsvp');
var getPixels = require("get-pixels");
var dat = require('exdat');

// this is a polyfill that gets attached to browser global
require('whatwg-fetch');
var fetch = window.fetch;

var vert = glslify('./shader.vert');
// var frag = glslify('./shader.frag');

var DATA_URL = 'https://s3.amazonaws.com/helen-images/annotations.json';
var S3_PATH = "https://s3.amazonaws.com/helen-images/images/";

var _textures = [];
var nTextures = 3;
var _data;
var _gl;

var _params = {
	dataIndex: 0
	, nTextures: 3
	, displacement: 0.05
}

var texOffset = 0;

shell.on('gl-init', function() {
	gl = shell.gl;
	_gui = new dat.GUI();
	_gui.add(_params, 'nTextures', 0, 10)
		.step(1)
		.onChange(function() {

		});
	_gui.add(_params, 'displacement', 0, 0.1);

	fetch('./shader.frag.template').then(parseTemplate).then(function(text) {
		var tpl = _.template(text);
		var data = { iterator: createNArray(3) };
		var compiled = tpl(data);
		console.log('template', data, compiled);
	});

	fetch(DATA_URL).then(parseJSON).then(function(body) {
		_data = body;


		// _gui.add(_params, 'dataIndex', 0, _data.length-1)
		// 	.step(1)
		// 	.listen()
		// 	.onChange(function(v) {
		// 		loadImageId(v);
		// 	});
		
		for (var i=0; i<_params.nTextures; i++) {
			loadImageFromData(_data[i]).then(function(imgArr) {
				console.log('create texture', i);
				// @todo: this will add images out of order currently
				_textures.push(createTexture(gl, imgArr));
				// console.log('texture', i, _textures[i]);
			});
		}

	});

	shader = createShader(gl, vert, generateFrag(_params.nTextures));
  shader.attributes.position.location = 0;

});

shell.on('tick', function() {
	texOffset++;
	// console.log(texOffset);
	if(texOffset >= _params.nTextures) {
		texOffset = 0;
	}
});

shell.on('gl-render', function(t) {
	var gl = shell.gl;

	if(_textures.length >= _params.nTextures) {

		// bind shader
		shader.bind();
		
		shader.uniforms.displacement = _params.displacement;

		for(var i = 0; i < _params.nTextures; i++) {
			shader.uniforms['tex'+i] = _textures[Math.abs(texOffset-i)].bind(i);			
		}

		shader.attributes.position.pointer();

		gessoCanvas(gl);

	}

});

shell.on("gl-error", function(e) {
  throw new Error("WebGL not supported :(")
});

function parseJSON(response) {
	return response.json();
}

function parseTemplate(response) {
	return response.text();
}

function generateFrag(n) {
	return glslify('./shader.frag');
}

function loadImageId(id) {
	console.log('loadImageId', id);
	rloadImageFromData(_data[id]).then(function(imgArr){
			_texture = createTexture(shell.gl, imgArr);
	});
}

function loadImageFromData(item) {
	var path = S3_PATH+item[0][0];
	return loadImageArray(path);
}

// resolves with an ndarray
function loadImageArray(path) {
	return new RSVP.Promise(function(resolve, reject) {
		getPixels(path, function(err, pix) {
			if(err) {
				reject(err);
			} else {
				resolve(pix);
			}
		});
	});	
}

function createNArray(n) {
	var arr = [];
	for(var i = 0; i < n; i++) {
		arr.push(i+'');
	}
	return arr;
}
