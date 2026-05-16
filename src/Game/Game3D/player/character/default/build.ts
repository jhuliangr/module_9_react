import type { PlayerRig } from '../../types';
import { buildMageRig } from '../../character/mage/build';
import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { getMageGltf } from '../../utils';
import { createDotParticles } from '#shared/renderer/utils/particles';
import {
  DOT_PARTICLE_Y,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
} from '#shared/renderer/utils/constants';

export function buildRig(character: string, color: number): PlayerRig {
  const mageGltf = character === 'mage' ? getMageGltf() : null;
  if (mageGltf) return buildMageRig(mageGltf);
  return buildBoxRig(character, color);
}

function buildBoxRig(character: string, color: number): PlayerRig {
  const mesh = new Mesh(
    new BoxGeometry(PLAYER_RADIUS * 2, PLAYER_HEIGHT, PLAYER_RADIUS * 2),
    new MeshStandardMaterial({ color }),
  );
  mesh.position.y = PLAYER_HEIGHT;
  const group = new Object3D();
  group.add(mesh);

  const dotParticles = createDotParticles();
  dotParticles.points.position.set(0, DOT_PARTICLE_Y, 0);
  group.add(dotParticles.points);

  return {
    group,
    character,
    hasModel: false,
    ownedMesh: mesh,
    mixer: null,
    anim: null,
    attackContainer: null,
    attackEffect: null,
    attackParticles: null,
    dotParticles,
    prevWorldPos: null,
    targetFacing: null,
    currentFacing: null,
  };
}
