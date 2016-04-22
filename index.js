var shell = require('gl-now')();
var createShader = require('gl-shader');
var createTexture = require('gl-texture2d');
var gessoCanvas = require('a-big-triangle');
var glslify = require('glslify');
var RSVP = require('rsvp');
var getPixels = require("get-pixels");

// this is a polyfill that gets attached to browser global
require('whatwg-fetch');
var fetch = window.fetch;

var vert = glslify('./shader.vert');
var frag = glslify('./shader.frag');

var DATA_URL = 'https://s3.amazonaws.com/helen-images/annotations.json';
var S3_PATH = "https://s3.amazonaws.com/helen-images/images/";

var texture;
var _data;
var id = 0;

function loadImageId(gl, id) {
	console.log('loadImageId', id);
	loadImageFromData(_data[id]).then(function(imgArr){
		// set texture from ndarray
		if(!texture) {
			texture = createTexture(gl, imgArr);
		} else {
			texture.setPixels(imgArr);
		}
		// loadImageId(gl, id+1);
	});
}

shell.on('gl-init', function() {
	var gl = shell.gl;

	fetch(DATA_URL).then(parseJSON).then(function(body) {
		_data = body;
		loadImageId(gl, id);

		// window.setInterval(function() {
		// 	id++;
		// 	loadImageId(gl, id);
		// }, 1000);
	});

	shader = createShader(gl, vert, frag);
  shader.attributes.position.location = 0;

});

shell.on('gl-render', function(t) {
	var gl = shell.gl;

	if(texture) {

		// bind shader
		shader.bind();
		
		shader.uniforms.texture = texture.bind();

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
