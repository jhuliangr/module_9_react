import type { PlayerRig } from '../../types';
import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { createDotParticles } from '#shared/renderer/utils/particles';
import {
  DOT_PARTICLE_Y,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
} from '#shared/renderer/utils/constants';

// Generic placeholder for not created characters (A cube :D)
export function buildBoxRig(character: string, color: number): PlayerRig {
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
