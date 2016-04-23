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
var fragTemplate;
// var frag = glslify('./shader.frag');

var DATA_URL = 'https://s3.amazonaws.com/helen-images/annotations.json';
var S3_PATH = "https://s3.amazonaws.com/helen-images/images/";

var _textures = [];
var nTextures = 3;
var _data;
var _gl;

var _params = {
	dataIndex: 0
	, nTextures: 10
	, displacement: 0.001
}

var texOffset = 0;


var fragTplLoaded = fetch('./assets/shader.frag.tpl').then(parseTemplate).then(function(text) {
	fragTemplate = _.template(text);
});

var dataLoaded = fetch(DATA_URL).then(parseJSON).then(function(body) {
	_data = body;

	
	for (var i=0; i<_params.nTextures; i++) {
		loadImageFromData(_data[i]).then(function(imgArr) {
			// @todo: this will add images out of order currently
			_textures.push(createTexture(gl, imgArr));
		});
	}

});

shell.on('gl-init', function() {
	gl = shell.gl;
	_gui = new dat.GUI();
	// _gui.add(_params, 'nTextures', 0, 10).step(1)
	_gui.add(_params, 'displacement', 0, 0.1);

	fragTplLoaded.then(function(){
		// console.log('fragTplLoaded');
		dataLoaded.then(function() {
			// console.log('dataLoaded');
			shader = createShader(gl, vert, generateFrag(_params.nTextures));
			shader.attributes.position.location = 0;	
		});
	})

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

	if(_textures.length >= _params.nTextures && shader) {

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
	var frag = fragTemplate({ iterator: createNArray(n) });
	// console.log(frag);
	return frag; // glslify(frag, {inline: true});
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
