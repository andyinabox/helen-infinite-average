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
var frag = glslify('./shader.frag');

var DATA_URL = 'https://s3.amazonaws.com/helen-images/annotations.json';
var S3_PATH = "https://s3.amazonaws.com/helen-images/images/";

var _textures = [];
var nTextures = 3;
var _data;
var _gl;

var _params = {
	dataIndex: 0
	, displacement: 0.05
}

var texOffset = 0;

shell.on('gl-init', function() {
	gl = shell.gl;
	_gui = new dat.GUI();
	_gui.add(_params, 'displacement', 0, 0.1);

	fetch(DATA_URL).then(parseJSON).then(function(body) {
		_data = body;


		// _gui.add(_params, 'dataIndex', 0, _data.length-1)
		// 	.step(1)
		// 	.listen()
		// 	.onChange(function(v) {
		// 		loadImageId(v);
		// 	});

		loadImageFromData(_data[0]).then(function(imgArr) {
			_textures[0] = createTexture(gl, imgArr);
			loadImageFromData(_data[1]).then(function(imgArr) {
				_textures[1] = createTexture(gl, imgArr);
				loadImageFromData(_data[2]).then(function(imgArr) {
					_textures[2] = createTexture(gl, imgArr);
				});
			});
		})

	});

	shader = createShader(gl, vert, frag);
  shader.attributes.position.location = 0;

});

shell.on('tick', function() {
	texOffset++;
	if(texOffset > _textures.length-1) {
		texOffset = 0;
	}
});

shell.on('gl-render', function(t) {
	var gl = shell.gl;

	if(_textures.length >= nTextures) {

		// bind shader
		shader.bind();
		
		shader.uniforms.displacement = _params.displacement;
		shader.uniforms.tex0 = _textures[Math.abs(0-texOffset)].bind(0);
		shader.uniforms.tex1 = _textures[Math.abs(1-texOffset)].bind(1);
		shader.uniforms.tex2 = _textures[Math.abs(2-texOffset)].bind(2);

		shader.attributes.position.pointer();

		gessoCanvas(gl);

	}

});

shell.on("gl-error", function(e) {
  throw new Error("WebGL not supported :(")
});

function parseJSON(r) {
	return r.json();
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
