var shell = require('gl-now')();
var createShader = require('gl-shader');
var gessoCanvas = require('a-big-triangle');
var glslify = require('glslify');

var vert = glslify('./shader.vert');
var frag = glslify('./shader.frag');

shell.on('gl-init', function() {
	var gl = shell.gl;

	shader = createShader(gl, vert, frag);
});

shell.on('gl-render', function(t) {
	var gl = shell.gl;

	// bind shader
	shader.bind();

	// still not totally sure what this does
	shader.attributes.position.pointer();

	// draw big triangle
	gessoCanvas(gl);
});

shell.on("gl-error", function(e) {
  throw new Error("WebGL not supported :(")
});