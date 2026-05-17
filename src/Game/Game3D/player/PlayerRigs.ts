import { MeshStandardMaterial, Vector3, type Scene } from 'three';
import type { AttackEffect, AttackParticles, PlayerRig } from './types';
import { prepareMageTemplate } from './character';
import type { Player } from '#shared/services/websocket';
import { snapshotInterpolator } from '#shared/engine';
import { predictionEngine } from '#shared/engine';
import { advanceTimedFX, lerp } from './utils';
import { worldToScene } from '../coords';
import {
  ANIM_BLEND_LERP,
  ATTACK_DURATION_MS,
  ATTACK_END_Z,
  ATTACK_START_Z,
  ATTACK_Y,
  DOT_PARTICLE_TOTAL_MS,
  FACING_LERP,
  FACING_MIN_DELTA,
  IDLE_DELAY_MS,
  MODEL_FACING_OFFSET,
  PARTICLE_TOTAL_MS,
  REMOTE_SNAP_THRESHOLD,
  WALK_MIN_DELTA,
} from '#shared/renderer/utils/constants';
import { buildRig } from './character';

const TWO_PI = Math.PI * 2;

interface WorldPos {
  x: number;
  y: number;
}

export class PlayerRigs {
  #scene: Scene;
  #rigs: Map<string, PlayerRig> = new Map();
  #tempVec = new Vector3();
  #tempWorldPos: WorldPos = { x: 0, y: 0 };

  constructor(scene: Scene) {
    this.#scene = scene;
    prepareMageTemplate();
  }

  update(
    players: Record<string, Player>,
    myPlayerId: string | null,
    dt: number,
    now: number,
    renderTime: number,
  ): { x: number; z: number } | null {
    // Play animations of players
    for (const rig of this.#rigs.values()) rig.mixer?.update(dt);

    // Remove players
    for (const id of [...this.#rigs.keys()]) {
      if (!players[id]) this.#removeRig(id);
    }

    let myPos: { x: number; z: number } | null = null;

    for (const p of Object.values(players)) {
      const isMe = p.id === myPlayerId;
      const rig = this.#upsertRig(
        p.id,
        p.character,
        isMe ? 0x4cd2ff : 0xff8a4c,
      );

      const worldPos = this.#resolveWorldPos(p, isMe, renderTime);
      const scenePos = worldToScene(worldPos.x, worldPos.y);
      rig.group.position.x = scenePos.x;
      rig.group.position.z = scenePos.z;
      if (isMe) myPos = scenePos;

      const moveMag = this.#updateFacingTarget(rig, worldPos, isMe);
      this.#updateAnim(rig, moveMag, now);
      this.#applyFacing(rig);
      this.#updateAttackEffect(rig, now);
      this.#updateAttackParticles(rig, now);
      this.#updateDotParticles(rig, now);
    }

    return myPos;
  }

  triggerAttack(playerId: string, angle: number): void {
    const rig = this.#rigs.get(playerId);
    const attack = rig?.anim?.attack;
    if (!rig || !rig.anim || !attack) return;
    rig.anim.isAttacking = true;
    rig.anim.attackFacing = -angle - Math.PI / 2 + MODEL_FACING_OFFSET;
    attack.reset().play();
    const now = performance.now();
    this.#snapshotAttackContainer(rig, angle);
    if (rig.attackEffect) this.#resetAttackEffect(rig.attackEffect, now);
    if (rig.attackParticles)
      this.#resetAttackParticles(rig.attackParticles, now);
  }

  triggerDot(playerId: string): void {
    const rig = this.#rigs.get(playerId);
    if (!rig?.dotParticles) return;
    rig.dotParticles.startedAt = performance.now();
    rig.dotParticles.points.visible = true;
    rig.dotParticles.material.uniforms.uTime.value = 0;
  }

  dispose(): void {
    for (const id of [...this.#rigs.keys()]) this.#removeRig(id);
  }

  #snapshotAttackContainer(rig: PlayerRig, angle: number): void {
    if (!rig.attackContainer) return;
    rig.group.getWorldPosition(this.#tempVec);
    rig.attackContainer.position.set(
      this.#tempVec.x,
      this.#tempVec.y + ATTACK_Y,
      this.#tempVec.z,
    );
    rig.attackContainer.rotation.y = Math.PI / 2 - angle;
  }

  #resetAttackEffect(fx: AttackEffect, now: number): void {
    fx.startedAt = now;
    fx.mesh.visible = true;
    fx.mesh.position.set(0, 0, ATTACK_START_Z);
  }

  #resetAttackParticles(fx: AttackParticles, now: number): void {
    fx.startedAt = now;
    fx.points.visible = true;
    fx.material.uniforms.uTime.value = 0;
  }

  #resolveWorldPos(p: Player, isMe: boolean, renderTime: number): WorldPos {
    const out = this.#tempWorldPos;
    if (isMe) {
      const pred = predictionEngine.getLocalRenderedPosition({
        x: p.x,
        y: p.y,
      });
      // Set prediction or server position
      out.x = pred?.x ?? p.x;
      out.y = pred?.y ?? p.y;
      return out;
    }
    // use interpolator for other players's positions
    const interpolated = snapshotInterpolator.getRenderPosition(
      p.id,
      renderTime,
      { x: p.x, y: p.y },
    );
    const gap = Math.hypot(p.x - interpolated.x, p.y - interpolated.y);
    if (gap > REMOTE_SNAP_THRESHOLD) {
      out.x = p.x;
      out.y = p.y;
    } else {
      out.x = interpolated.x;
      out.y = interpolated.y;
    }
    return out;
  }

  #updateFacingTarget(
    rig: PlayerRig,
    worldPos: WorldPos,
    isMe: boolean,
  ): number {
    const prev = rig.prevWorldPos;
    const ddx = prev ? worldPos.x - prev.x : 0;
    const ddy = prev ? worldPos.y - prev.y : 0;
    const moveMag = prev ? Math.hypot(ddx, ddy) : 0;

    if (rig.anim?.isAttacking && rig.anim.attackFacing !== null) {
      rig.targetFacing = rig.anim.attackFacing;
    } else if (isMe) {
      const inputAngle = predictionEngine.getLastInputAngle();
      if (inputAngle !== null) {
        rig.targetFacing = -inputAngle - Math.PI / 2 + MODEL_FACING_OFFSET;
      }
    } else if (moveMag > FACING_MIN_DELTA) {
      const angle = Math.atan2(ddy, ddx);
      rig.targetFacing = -angle - Math.PI / 2 + MODEL_FACING_OFFSET;
    }

    if (prev) {
      prev.x = worldPos.x;
      prev.y = worldPos.y;
    } else {
      rig.prevWorldPos = { x: worldPos.x, y: worldPos.y };
    }
    return moveMag;
  }

  #applyFacing(rig: PlayerRig): void {
    if (rig.targetFacing === null) return;

    const target = rig.targetFacing;
    const current = rig.currentFacing ?? target;
    let diff = target - current;
    if (diff > Math.PI) diff -= TWO_PI;
    else if (diff < -Math.PI) diff += TWO_PI;
    const next = current + diff * FACING_LERP;
    rig.currentFacing = next;
    rig.group.rotation.y = next;
  }

  #updateAnim(rig: PlayerRig, moveMag: number, now: number): void {
    if (!rig.anim) return;
    const anim = rig.anim;
    const { idle, idleRest, walk, attack, isAttacking } = anim;
    const moving = moveMag > WALK_MIN_DELTA;

    if (moving) {
      anim.lastMovingAt = now;
      if (anim.idlePlaying) {
        anim.idlePlaying = false;
        anim.idleEndedAt = now;
      }
    }

    let idleBucket = 0;
    let walkTarget = 0;
    let attackTarget = 0;
    if (isAttacking) {
      attackTarget = 1;
    } else if (moving) {
      walkTarget = 1;
    } else {
      idleBucket = 1;
      // if the player does't moves in IDLE_DELAY_MS then play idle animation
      if (idle && !anim.idlePlaying) {
        const since = now - Math.max(anim.lastMovingAt, anim.idleEndedAt);
        if (since >= IDLE_DELAY_MS) {
          idle.reset();
          idle.play();
          anim.idlePlaying = true;
        }
      }
    }

    const idleActiveTarget = anim.idlePlaying ? idleBucket : 0;
    const idleRestTarget = anim.idlePlaying ? 0 : idleBucket;

    // Make soft transitions between animations
    if (idle) {
      idle.weight = lerp(idle.weight, idleActiveTarget, ANIM_BLEND_LERP);
    }
    if (idleRest) {
      idleRest.weight = lerp(idleRest.weight, idleRestTarget, ANIM_BLEND_LERP);
    }
    if (walk) walk.weight = lerp(walk.weight, walkTarget, ANIM_BLEND_LERP);
    if (attack) {
      attack.weight = lerp(attack.weight, attackTarget, ANIM_BLEND_LERP);
    }
  }

  #updateAttackEffect(rig: PlayerRig, now: number): void {
    const fx = rig.attackEffect;
    if (!fx) return;
    const progress = advanceTimedFX(fx.mesh, fx, ATTACK_DURATION_MS, now);
    if (progress === null) return;
    fx.mesh.position.z =
      ATTACK_START_Z + (ATTACK_END_Z - ATTACK_START_Z) * progress;
    fx.material.uniforms.uProgress.value = progress;
  }

  #updateAttackParticles(rig: PlayerRig, now: number): void {
    const fx = rig.attackParticles;
    if (!fx) return;
    advanceTimedFX(fx.points, fx, PARTICLE_TOTAL_MS, now);
  }

  #updateDotParticles(rig: PlayerRig, now: number): void {
    const fx = rig.dotParticles;
    if (!fx) return;
    advanceTimedFX(fx.points, fx, DOT_PARTICLE_TOTAL_MS, now);
  }

  #upsertRig(id: string, character: string, color: number): PlayerRig {
    const existing = this.#rigs.get(id);
    const needsUpgrade = existing && character === 'mage' && !existing.hasModel;

    if (existing && !needsUpgrade) return existing;

    if (existing) {
      const x = existing.group.position.x;
      const z = existing.group.position.z;
      // replace rig
      this.#disposeRig(existing);
      const rig = buildRig(character, color);
      rig.group.position.set(x, rig.group.position.y, z);
      this.#scene.add(rig.group);
      if (rig.attackContainer) this.#scene.add(rig.attackContainer);
      this.#rigs.set(id, rig);
      return rig;
    }

    // create from scratch
    const rig = buildRig(character, color);
    this.#scene.add(rig.group);
    if (rig.attackContainer) this.#scene.add(rig.attackContainer);
    this.#rigs.set(id, rig);
    return rig;
  }

  #disposeRig(rig: PlayerRig): void {
    this.#scene.remove(rig.group);
    if (rig.attackContainer) this.#scene.remove(rig.attackContainer);

    if (rig.ownedMesh) {
      rig.ownedMesh.geometry.dispose();
      const mat = rig.ownedMesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else (mat as MeshStandardMaterial).dispose();
    }
    // Prevent memory leaks
    rig.attackEffect?.mesh.geometry.dispose();
    rig.attackEffect?.material.dispose();
    rig.attackParticles?.points.geometry.dispose();
    rig.attackParticles?.material.dispose();
    rig.dotParticles?.points.geometry.dispose();
    rig.dotParticles?.material.dispose();
  }

  #removeRig(id: string): void {
    const rig = this.#rigs.get(id);
    if (!rig) return;
    this.#disposeRig(rig);
    this.#rigs.delete(id);
    snapshotInterpolator.drop(id);
  }
}
