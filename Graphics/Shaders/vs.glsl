#version 300 es

in vec4 a_position;
uniform mat4 matrix;

void main() {
    gl_Position = matrix * a_position;
}
