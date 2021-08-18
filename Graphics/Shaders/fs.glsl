#version 300 es
// Fragment shaders requires the float
// precision. mediump is a good default.
// It means "medium precision"
precision mediump float;
// Output for the Fragment Shader = colour of the pixel
out vec4 outColor;
void main() {
    // Set the output to a constant
    outColor = vec4(0.0,0.4,0.0, 1);
}