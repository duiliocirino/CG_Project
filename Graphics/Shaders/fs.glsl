#version 300 es

precision highp float;

in vec3 fs_pos;
in vec3 fs_norm;
in vec2 fs_uv;

uniform sampler2D u_texture;

uniform vec3 u_directLightDirection;
uniform vec3 u_directLightColor;
uniform vec3 u_ambientLight;

out vec4 color;

void main() {
  vec4 texColor = texture(u_texture, fs_uv);
  vec3 directLightDirNorm = normalize(u_directLightDirection);
  vec3 nNormal = normalize(fs_norm);

  vec3 diffuse = texColor.rgb * u_directLightColor * max(0.0, dot(-directLightDirNorm, nNormal));

  //AMBIENT
  vec3 ambient = texColor.rgb * u_ambientLight;

  color = vec4(clamp(ambient + diffuse, 0.0, 1.0), 1.0);
}