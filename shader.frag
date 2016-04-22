precision highp float;
varying vec2 texCoord;

uniform float displacement;

uniform sampler2D tex0;
uniform sampler2D tex1;
uniform sampler2D tex2;




vec2 updateSt(in vec2 st, in vec4 last, in vec2 dir, in float amount) {
    return(st + vec2( (last.x + dir.x) * amount, (last.z + dir.y) * amount));
}

void main() {

	float n = 3.0;
	vec2 direction = vec2(0.1, 0.1);
	float dMultiply = 0.05;

	vec4 avg = vec4(0.0);
	vec2 st = texCoord.st;

	vec4 texel0 = texture2D(tex0, st);
	st = updateSt(st, texel0, direction, 1.0*displacement);
	vec4 texel1 = texture2D(tex1, st);
	st = updateSt(st, texel1, direction,2.0*displacement);
	vec4 texel2 = texture2D(tex2, st);
	st = updateSt(st, texel2, direction,3.0*displacement);

  avg = texture2D(tex0, st);
  avg += texture2D(tex1, st);
  avg += texture2D(tex2, st);
  avg = avg / n;


  gl_FragColor = vec4(avg.rgb, 1.0);
  // gl_FragColor = texture2D(tex0, texCoord);
}