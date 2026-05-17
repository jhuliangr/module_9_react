export default /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uColor;

  void main() {

    float shimmer = 0.8 + 0.2 * sin(uTime * 40.0);
    // Fading the sphere
    float life = 1.0 - uProgress;
    vec3 color = uColor * 1115.0 * shimmer;

    gl_FragColor = vec4(color, life);
  }
`;
