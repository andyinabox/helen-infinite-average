precision highp float;
varying vec2 uv;
void main() {
  gl_FragColor = vec4(0.0, uv, 1.0);
}