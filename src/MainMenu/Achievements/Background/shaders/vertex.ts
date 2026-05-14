export default /* glsl */ `
  #define MAX_RIPPLES 32
  #define RIPPLE_LIFE 2.5
  #define RIPPLE_SPEED 0.35

  uniform vec4 uRipples[MAX_RIPPLES];
  uniform float uTime;
  uniform float uAspect;

  varying vec2 vUv;
  varying float vDisplacement;
  varying float vDispGreen;
  varying float vDispYellow;

  float rippleAt(vec4 r, vec2 uv) {
    if (r.z < 0.0) return 0.0;
    float age = uTime - r.z;
    if (age < 0.0 || age > RIPPLE_LIFE) return 0.0;

    vec2 d = uv - r.xy;
    d.x *= uAspect;
    float dist = length(d);

    float front = RIPPLE_SPEED * age;
    float ringWidth = 0.07 + age * 0.02;
    float ring = exp(-pow((dist - front) / ringWidth, 2.0));

    float wave = sin(dist * 12.0 - age * 7.0);

    float decay = max(0.0, 1.0 - age / RIPPLE_LIFE);
    return wave * ring * decay * decay;
  }

  void main() {
    vec3 pos = position;
    
    float dispG = 0.0;
    float dispY = 0.0;
    for (int i = 0; i < MAX_RIPPLES; i++) {
      vec4 r = uRipples[i];
      float c = rippleAt(r, uv);
      dispG += c * (1.0 - r.w);
      dispY += c * r.w;
    }
    
    float disp = (dispG + dispY) * 0.18;
    pos.z += disp;

    vDisplacement = disp;
    vDispGreen = dispG;
    vDispYellow = dispY;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    vUv = uv;
  }
`;
