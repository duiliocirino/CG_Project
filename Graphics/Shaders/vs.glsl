#version 300 es

#define POSITION_LOCATION 0
#define NORMAL_LOCATION 1
#define UV_LOCATION 2

layout(location = POSITION_LOCATION) in vec3 in_pos;
layout(location = NORMAL_LOCATION) in vec3 in_norm;
layout(location = UV_LOCATION) in vec2 in_uv;

uniform mat4 matrix; //wvp matrix
uniform mat4 pMatrix;
uniform mat4 nMatrix;

out vec3 fs_pos;
out vec3 fs_norm;
out vec2 fs_uv;

void main() {
	fs_uv = in_uv;
	fs_norm = mat3(nMatrix) * in_norm;
	fs_pos = (pMatrix * vec4(in_pos, 1.0)).xyz;

	gl_Position = matrix * vec4(in_pos, 1);
}