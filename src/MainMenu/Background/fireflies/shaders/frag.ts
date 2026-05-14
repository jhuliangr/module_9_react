export default /* glsl */ `
  uniform vec3 uColor;

  varying float vTwinkle;

  void main() {
    vec2 st = gl_PointCoord - vec2(0.5);
    float d = length(st);
    if (d > 0.5) discard;

    float halo = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.18, 0.0, d);

    float alpha = pow(halo, 1.4);
    vec3 color = uColor + vec3(core * 0.8);

    gl_FragColor = vec4(color, alpha * vTwinkle);
  }
`;
