import {
  DOT_PARTICLE_LIFE_SEC,
  DOT_PARTICLE_STAGGER_SEC,
} from '../../constants';

export default /* glsl */ `
  attribute vec3 aVelocity;
  attribute float aSeed;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float life = uTime - aSeed * ${DOT_PARTICLE_STAGGER_SEC.toFixed(3)};
    float phase = life / ${DOT_PARTICLE_LIFE_SEC.toFixed(3)};
    if (life < 0.0 || phase >= 1.0) {
      gl_PointSize = 0.0;
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      vAlpha = 0.0;
      vColor = aColor;
      return;
    }
    float speed = 1.2 + aSeed * 1.8;
    vec3 pos = aVelocity * speed * phase;
    pos.y -= phase * phase * 0.8;
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

    gl_Position = projectionMatrix * mvPos;

    float size = (28.0 + aSeed * 22.0) * (1.0 - phase * 0.5);
    
    gl_PointSize = size * uPixelRatio / -mvPos.z;

    vColor = aColor;
    vAlpha = 1.0 - phase;
  }
`;
