export default /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // aiming the center of the particle
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);

    // making the point circular
    float disk = smoothstep(0.5, 0.0, d);
    
    vec3 color = vColor * 8.0;
    
    gl_FragColor = vec4(color, disk * vAlpha);
  }
`;
