export default /* glsl */ `
  uniform float uTime;
  uniform float uNoise;

  float hash(vec2 p) {
    p = fract(p * vec2(10, 21));
    p += dot(p, p.yx + 12.19);
    return fract((p.x + p.y) * p.x);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 seed = uv + vec2(fract(uTime * 13.7), fract(uTime * 21.3));
    float n = hash(seed) - 0.8;
    outputColor = vec4(inputColor.rgb + vec3(n) * uNoise, inputColor.a);
  }
`;
