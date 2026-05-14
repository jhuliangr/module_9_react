export default /* glsl */ `
  attribute float aRandom;
  uniform float uTime;
  uniform float uPixelRatio;

  varying float vTwinkle;

  void main() {
    float r = aRandom;
    float phase = r * 6.2831;
    float t = uTime;

    vec3 newPos = position;
    newPos.x += sin(t * (0.25 + r * 0.15) + phase) * 0.35;
    newPos.y += cos(t * (0.18 + r * 0.20) + phase * 1.3) * 0.30
              + sin(t * (0.09 + r * 0.05)) * 0.15;
    newPos.z += 1.0 + sin(t * (0.12 + r * 0.10) + phase * 0.7) * 0.25;

    float twinkle =
      0.4 + 0.6 * (sin(t * (1.2 + r * 2.0) + phase * 3.0) * 0.5 + 0.5);
    vTwinkle = twinkle;

    vec4 mvPos = modelViewMatrix * vec4(newPos, 1.0);
    float size = (4.0 + r * 16.0) * twinkle * uPixelRatio;
    gl_PointSize = size * (1.0 / max(-mvPos.z, 0.1));
    gl_Position = projectionMatrix * mvPos;
  }
`;
