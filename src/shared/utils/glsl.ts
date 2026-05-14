export const hashFunction = /* glsl */ `
  float hash(vec2 p) {
    p = fract(p * vec2(10.0, 21.0));
    p += dot(p, p.yx + 12.19);
    return fract((p.x + p.y) * p.x);
  }
`;
