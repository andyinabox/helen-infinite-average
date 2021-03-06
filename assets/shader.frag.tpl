precision highp float;
varying vec2 texCoord;

uniform float displacement;

<% _.forEach(iterator, function(n) { %>
uniform sampler2D tex<%= n %>;
<% }); %>

const float n = <%= iterator.length.toFixed(1) %>;

vec2 updateSt(in vec2 st, in vec4 last, in vec2 dir, in float amount) {
    return(st + vec2( (last.x + dir.x) * amount, (last.z + dir.y) * amount));
}

void main() {

	vec2 direction = vec2(0.1, 0.1);

	vec4 avg = vec4(0.0);
	vec2 st = texCoord.st;

<% _.forEach(iterator, function(n) { %>
	vec4 texel<%= n %> = texture2D(tex<%= n %>, st);
	st = updateSt(st, texel<%= n %>, direction, <%= parseFloat(n).toFixed(1) %>*displacement);
<% }); %>

<% _.forEach(iterator, function(n) { %>
  avg += texture2D(tex<%= n %>, st);
<% }); %>
  avg = avg / n;

  gl_FragColor = vec4(avg.rgb, 1.0);
}