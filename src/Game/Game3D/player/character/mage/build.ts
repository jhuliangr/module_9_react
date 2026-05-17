import type { GLTF } from 'three/examples/jsm/Addons.js';
import type { AnimSet, AttackEffect, PlayerRig } from '../../types';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { AnimationMixer, Mesh, Object3D, SphereGeometry } from 'three';
import { setupAnimSet } from '../../animations';
import { createAttackMaterial, createAttackParticles } from './attack';
import { createDotParticles } from '#shared/renderer/utils/particles';
import {
  DOT_PARTICLE_Y,
  PLAYER_HEIGHT,
} from '#shared/renderer/utils/constants';

export const MAGE_SCALE = 0.5;

export function buildMageRig(mageGltf: GLTF): PlayerRig {
  const model = clone(mageGltf.scene);
  model.scale.setScalar(MAGE_SCALE);
  model.position.y = PLAYER_HEIGHT / 2 - 0.9;
  // make every component of the model to cast Shadow
  model.traverse((child) => {
    if ((child as Mesh).isMesh) {
      child.castShadow = true;
    }
  });

  const group = new Object3D();
  group.add(model);

  let mixer: AnimationMixer | null = null;
  let anim: AnimSet | null = null;

  // Assign animations to model
  if (mageGltf.animations.length > 0) {
    mixer = new AnimationMixer(model);
    anim = setupAnimSet(mixer, mageGltf.animations);
  }

  const attackMaterial = createAttackMaterial();
  const attackMesh = new Mesh(new SphereGeometry(0.5, 24, 24), attackMaterial);
  // The attack must only be visible when triggered
  attackMesh.visible = false;
  const attackEffect: AttackEffect = {
    mesh: attackMesh,
    material: attackMaterial,
    startedAt: 0,
  };

  const attackParticles = createAttackParticles();

  const attackContainer = new Object3D();
  attackContainer.add(attackMesh, attackParticles.points);

  // Particles for the Damage on Time of the mage attack
  const dotParticles = createDotParticles();
  dotParticles.points.position.set(0, DOT_PARTICLE_Y, 0);
  group.add(dotParticles.points);

  return {
    group,
    character: 'mage',
    hasModel: true,
    ownedMesh: null,
    mixer,
    anim,
    attackContainer,
    attackEffect,
    attackParticles,
    dotParticles,
    prevWorldPos: null,
    targetFacing: null,
    currentFacing: null,
  };
}
