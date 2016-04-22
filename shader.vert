attribute vec2 position;
varying vec2 texCoord;
varying vec2 uv;
void main() {
  uv = position;
  gl_Position = vec4(position, 0.0, 1.0);
	texCoord = vec2(0.0,1.0)+vec2(0.5,-0.5) * (position + 1.0);
}	