export default /* glsl */ `
  uniform sampler2D uMap;
  uniform float uHasMap;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uBrightness;
  uniform vec3 uScanColor;
  uniform float uScanIntensity;
  uniform float uScanWidth;
  uniform float uScanSpeed;
  uniform float uScanRange;
  uniform float uScanCenter;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vec4 base = mix(vec4(uColor, 1.0), texture2D(uMap, vUv), uHasMap);
    vec3 col = base.rgb * uBrightness;

    float scanY = uScanCenter + mod(uTime * uScanSpeed, uScanRange) - uScanRange * 0.5;
    float dist = abs(vWorldPosition.y - scanY);
    float band = 1.0 - smoothstep(0.0, uScanWidth, dist);
    col += uScanColor * band * uScanIntensity;

    gl_FragColor = vec4(col, base.a);
  }
`;
