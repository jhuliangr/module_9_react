import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
} from 'three';
import { DOT_PARTICLE_COUNT, DOT_PARTICLE_PALETTE } from '../constants';
import vertex from './shaders/vertex';
import frag from './shaders/frag';

export interface DotParticles {
  points: Points;
  material: ShaderMaterial;
  startedAt: number;
}

export function createDotParticles(): DotParticles {
  const positions = new Float32Array(DOT_PARTICLE_COUNT * 3);
  const velocities = new Float32Array(DOT_PARTICLE_COUNT * 3);
  const seeds = new Float32Array(DOT_PARTICLE_COUNT);
  const colors = new Float32Array(DOT_PARTICLE_COUNT * 3);

  for (let i = 0; i < DOT_PARTICLE_COUNT; i++) {
    const u = Math.random() * 2 - 1; // uniform on a sphere
    const phi = Math.random() * Math.PI * 2;
    const sinTheta = Math.sqrt(1 - u * u);
    velocities[i * 3] = sinTheta * Math.cos(phi);
    velocities[i * 3 + 1] = sinTheta * Math.sin(phi);
    velocities[i * 3 + 2] = u;

    seeds[i] = Math.random();

    const c = DOT_PARTICLE_PALETTE[i % DOT_PARTICLE_PALETTE.length];
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
    vertexShader: vertex,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const points = new Points(geometry, material);
  points.visible = false;
  points.frustumCulled = false;

  return { points, material, startedAt: 0 };
}
