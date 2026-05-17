import {
  LoopOnce,
  LoopRepeat,
  type AnimationClip,
  type AnimationMixer,
  type AnimationAction,
} from 'three';
import type { AnimSet } from '../types';
import {
  ATTACK_TIME_SCALE,
  IDLE_TIME_SCALE,
  WALK_TIME_SCALE,
} from '#shared/renderer/utils/constants';
import { findClip } from './utils';

export function setupAnimSet(
  mixer: AnimationMixer,
  clips: AnimationClip[],
): AnimSet {
  const idleClip = findClip(clips, 'idle');
  const walkClip = findClip(clips, 'walk');
  const attackClip = findClip(clips, 'attack');

  const idle = idleClip ? mixer.clipAction(idleClip) : null;
  const walk = walkClip ? mixer.clipAction(walkClip) : null;
  const attack = attackClip ? mixer.clipAction(attackClip) : null;
  const idleRest = idleClip ? mixer.clipAction(idleClip.clone()) : null;

  if (idle) {
    idle.setLoop(LoopOnce, 1);
    idle.clampWhenFinished = true;
    idle.timeScale = IDLE_TIME_SCALE;
    idle.weight = 0;
  }
  if (idleRest) {
    idleRest.weight = 1;
    idleRest.play();
    idleRest.paused = true;
    idleRest.time = 0;
  }
  if (walk) {
    walk.setLoop(LoopRepeat, Infinity);
    walk.timeScale = WALK_TIME_SCALE;
    walk.weight = 0;
    walk.play();
  }
  if (attack) {
    attack.setLoop(LoopOnce, 1);
    attack.timeScale = ATTACK_TIME_SCALE;
    attack.clampWhenFinished = true;
    attack.weight = 0;
  }

  const set: AnimSet = {
    idle,
    idleRest,
    walk,
    attack,
    isAttacking: false,
    attackFacing: null,
    idlePlaying: false,
    idleEndedAt: -Infinity,
    lastMovingAt: performance.now(),
  };

  // keeping track of when animations are finished
  mixer.addEventListener('finished', (e) => {
    const action = (e as { action: AnimationAction }).action;
    if (attack && action === attack) {
      set.isAttacking = false;
      set.attackFacing = null;
    }
    if (idle && action === idle) {
      set.idlePlaying = false;
      set.idleEndedAt = performance.now();
    }
  });

  return set;
}
