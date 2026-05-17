import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  ShaderMaterial,
} from 'three';
import type { AttackParticles } from '../../types';
import attackMatFShader from './shaders/attackMaterial/frag';
import attackPartVShader from './shaders/attackParticles/vertex';
import attackPartFShader from './shaders/attackParticles/frag';
import { MAGE_ORB_COLOR } from './constants';
import {
  PARTICLE_COUNT,
  PARTICLE_PALETTE,
} from '#shared/renderer/utils/constants';

export function createAttackMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColor: { value: new Color(MAGE_ORB_COLOR) },
    },
    // No vertex shader required because i'm only working with uniforms
    fragmentShader: attackMatFShader,
    transparent: true,
    depthWrite: false,
  });
}

export function createAttackParticles(): AttackParticles {
  const positions = new Float32Array(PARTICLE_COUNT * 3); // placeholder
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const seeds = new Float32Array(PARTICLE_COUNT);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Multiplying for PI * 2 for a circle
    const rand = Math.random() * Math.PI * 2;
    const cosTheta = 0.55 + Math.random() * 0.45;
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);

    // Different velocities because it looks better
    velocities[i * 3] = sinTheta * Math.cos(rand);
    velocities[i * 3 + 1] = sinTheta * Math.sin(rand);
    velocities[i * 3 + 2] = cosTheta;

    // the random number but from 0 - 1
    seeds[i] = rand % 1;

    const c = PARTICLE_PALETTE[i % PARTICLE_PALETTE.length];
    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aVelocity', new BufferAttribute(velocities, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
  geometry.setAttribute('aColor', new BufferAttribute(colors, 3));

  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: window.devicePixelRatio },
    },
    vertexShader: attackPartVShader,
    fragmentShader: attackPartFShader,
    transparent: true,
    depthWrite: false,
  });

  const points = new Points(geometry, material);
  points.visible = false;
  points.frustumCulled = false;

  return { points, material, startedAt: 0 };
}
