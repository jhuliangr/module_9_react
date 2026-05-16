import type {
  AnimationAction,
  AnimationMixer,
  Mesh,
  Object3D,
  Points,
  ShaderMaterial,
} from 'three';
import type { DotParticles } from '#shared/renderer/utils/particles';

export interface AnimSet {
  idle: AnimationAction | null;
  idleRest: AnimationAction | null;
  walk: AnimationAction | null;
  attack: AnimationAction | null;
  isAttacking: boolean;
  attackFacing: number | null;
  idlePlaying: boolean;
  idleEndedAt: number;
  lastMovingAt: number;
}

export interface AttackEffect {
  mesh: Mesh;
  material: ShaderMaterial;
  startedAt: number;
}

export interface AttackParticles {
  points: Points;
  material: ShaderMaterial;
  startedAt: number;
}

export interface PlayerRig {
  group: Object3D;
  character: string;
  hasModel: boolean;
  ownedMesh: Mesh | null;
  mixer: AnimationMixer | null;
  anim: AnimSet | null;
  attackContainer: Object3D | null;
  attackEffect: AttackEffect | null;
  attackParticles: AttackParticles | null;
  dotParticles: DotParticles | null;
  prevWorldPos: { x: number; y: number } | null;
  targetFacing: number | null;
  currentFacing: number | null;
}
