import { hashFunction } from '#shared/utils';

export default /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uClickColor;
  uniform vec2 uMouse;
  uniform float uAspect;
  uniform float uTime;
  uniform float uNoise;

  varying vec2 vUv;
  varying float vDisplacement;
  varying float vDispGreen;
  varying float vDispYellow;

  ${hashFunction}

  void main() {
    vec3 col = vec3(0.0);

    vec2 dm = vUv - uMouse;
    dm.x *= uAspect;
    float distMouse = length(dm);
    float halo = exp(-distMouse * 18.0);

    float magnitude = abs(vDisplacement);
    float crest = smoothstep(0.005, 0.06, magnitude);
    float rim = smoothstep(0.0, 0.015, magnitude) -
                smoothstep(0.015, 0.05, magnitude);

    float glow = halo * 0.15 + crest * 0.55 + rim * 0.2;

    float yellowness = abs(vDispYellow) /
                       (abs(vDispGreen) + abs(vDispYellow) + 0.0001);
    vec3 mixedColor = mix(uColor, uClickColor, yellowness);

    col += mixedColor * glow;

    vec2 seed = vUv + vec2(fract(uTime * 13.7), fract(uTime * 21.3));
    float n = hash(seed) - 0.5;
    col += vec3(n) * uNoise;

    gl_FragColor = vec4(col, 1.0);
  }
`;
