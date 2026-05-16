export default /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uColor;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float facing = max(0.0, dot(normalize(vNormal), normalize(vViewDir)));
    float rim = pow(1.0 - facing, 1.5);
    float core = pow(facing, 2.0);
    float density = rim + core;
    float shimmer = 0.8 + 0.2 * sin(uTime * 40.0);
    float life = 1.0 - uProgress;
    vec3 color = uColor * 1115.0 * shimmer;
    gl_FragColor = vec4(color, density * life);
  }
`;
