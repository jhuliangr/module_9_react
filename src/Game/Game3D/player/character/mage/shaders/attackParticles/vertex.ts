import {
  PARTICLE_LIFE_SEC,
  PARTICLE_STAGGER_SEC,
} from '#shared/renderer/utils/constants';

export default /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute vec3 aVelocity;
  attribute float aSeed;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float life = uTime - aSeed * ${PARTICLE_STAGGER_SEC.toFixed(3)};
    float phase = life / ${PARTICLE_LIFE_SEC.toFixed(3)};
    if (life < 0.0 || phase >= 1.0) {
      gl_PointSize = 0.0;
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0); 
      vAlpha = 0.0;
      vColor = aColor;
      return;
    }
    float speed = 4.0 + aSeed * 6.0;
    float t = 1.0 - pow(1.0 - phase, 3.0);
    vec3 pos = aVelocity * speed * t;
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

    gl_Position = projectionMatrix * mvPos;

    float size = (35.0 + aSeed * 25.0) * (1.0 - phase * 0.7);

    gl_PointSize = size * uPixelRatio / -mvPos.z;
    vColor = aColor;
    vAlpha = 1.0 - phase;
  }
`;
