export default /* glsl */ `
  uniform float uTime;
  uniform float uNoise;
  uniform sampler2D uInput;

  varying vec2 vUv;
  
  float hash(vec2 p) {
    p = fract(p * vec2(10, 21));
    p += dot(p, p.yx + 12.19);
    return fract((p.x + p.y) * p.x);
  }

  vec3 linearToSRGB(vec3 c) {
    return mix(
      pow(c, vec3(0.41666)) * 1.055 - vec3(0.055),
      c * 12.92,
      vec3(lessThanEqual(c, vec3(0.0031308)))
    );
  }

  void main() {

    vec4 inputColor = texture2D(uInput, vUv);
    vec2 seed = vUv + vec2(fract(uTime * 13.7), fract(uTime * 21.3));
    float n = hash(seed) - 0.8;
    vec3 color = inputColor.rgb + vec3(n) * uNoise;
    gl_FragColor = vec4(linearToSRGB(color), inputColor.a);

  }
`;
