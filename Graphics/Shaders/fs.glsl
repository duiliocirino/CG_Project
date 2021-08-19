#version 300 es

  precision mediump float;

  in vec3 fs_pos;
  in vec3 fs_norm;
  in vec2 fs_uv;

  uniform sampler2D u_texture;

  out vec4 color;

  void main() {
  	color = texture(u_texture, fs_uv);
  }