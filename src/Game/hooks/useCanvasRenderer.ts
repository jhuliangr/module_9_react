import { useGameStore } from '#shared/stores';
import { clockSync } from '#shared/services/clock-sync';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { characterRegistry } from '../characters';
import { predictionEngine } from '#shared/engine';
import { snapshotInterpolator } from '#shared/engine';
import type { AnimationMap } from './usePlayerAnimations';
import {
  CANVAS_H,
  CANVAS_W,
  SCALE_X,
  SCALE_Y,
  renderAttack,
  renderBackground,
  renderMapBounds,
  renderPickup,
  renderPlayer,
  renderVignette,
} from '../utils';

const WALK_FRAME_MS = 120;
// A single frame above this delta marks the player as "walking" for
// WALK_HOLD_MS — smooths over frames where a server-update gap or
// reconciliation correction briefly produces a sub-threshold delta.
const WALK_MIN_DELTA = 0.3;
const WALK_HOLD_MS = 200;

function lerpAngle(current: number, target: number, t: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return current + diff * t;
}

// If the interpolated position and the latest authoritative position
// differ by more than this, the cause is almost certainly a respawn /
// re-entry after the grace period, not real motion. Snap instead of
// flying across the map. Upper bound on legitimate inter-snapshot
// motion at the server's speed cap (200u/s) over a 150ms throttle is
// ~30 units; this gives comfortable headroom.
const REMOTE_SNAP_THRESHOLD = 80;
// Minimum per-frame position delta (world units) required to update a
// remote player's facing target. Below this, the delta is dominated by
// interpolation noise and reconciliation corrections; feeding it to
// atan2 causes the sprite to flip 180° momentarily (the visible "blink"
// in the facing direction). At our scale a real walking step lands well
// above 1u per frame, so this rejects jitter without losing real motion.
const FACING_MIN_DELTA = 1.0;

export function useCanvasRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  spriteRef: RefObject<Record<string, HTMLImageElement>>,
  attackFlashRef: RefObject<{ angle: number; startTime: number } | null>,
  activeAttacksRef: RefObject<
    Record<string, { angle: number; startTime: number }>
  >,
  bgImageRef: RefObject<HTMLImageElement | null>,
  animationsRef?: RefObject<AnimationMap>,
) {
  const prevPositions = useRef<Record<string, { x: number; y: number }>>({});
  const lastRenderedRemote = useRef<Record<string, { x: number; y: number }>>(
    {},
  );
  const targetFacingAngles = useRef<Record<string, number>>({});
  const facingAngles = useRef<Record<string, number>>({});
  const hitTimesRef = useRef<Record<string, number>>({});
  const dotPlayersRef = useRef<Record<string, number>>({});
  const lastMovingAtRef = useRef<Record<string, number>>({});
  const lastCombatRef = useRef<object | null>(null);

  useEffect(() => {
    let rafId: number;
    let ctx: CanvasRenderingContext2D | null = null;

    const loop = () => {
      // Reset ctx whenever the canvas element changes (e.g. after remount)
      const canvas = canvasRef.current;
      if (ctx?.canvas !== canvas) {
        ctx = canvas ? canvas.getContext('2d') : null;
      }

      if (ctx) {
        const { players, myPlayerId, lastCombatEvent, pickups } =
          useGameStore.getState();
        const meAuthoritative = myPlayerId ? players[myPlayerId] : null;

        // Track hit events and DoT effects
        if (lastCombatEvent !== lastCombatRef.current) {
          if (lastCombatEvent) {
            hitTimesRef.current[lastCombatEvent.defenderId] = performance.now();
            if (lastCombatEvent.attackerId === 'dot') {
              dotPlayersRef.current[lastCombatEvent.defenderId] =
                performance.now();
            }
          }
          lastCombatRef.current = lastCombatEvent;
        }

        // Resolve on-screen position for every player:
        //  - local player: client-predicted + smoothed toward the latest
        //    reconciled position.
        //  - others: snapshot interpolation — we render `interpDelay`
        //    milliseconds in the past between two known server
        //    snapshots. That produces continuous motion at the real
        //    per-entity speed, independent of tick throttling or
        //    packet jitter. `interpDelay` adapts to measured jitter
        //    via clockSync.
        const renderTime =
          clockSync.getServerTime() - clockSync.getInterpDelay();
        const renderedPositions: Record<string, { x: number; y: number }> = {};
        Object.values(players).forEach((p) => {
          if (p.id === myPlayerId) {
            renderedPositions[p.id] = predictionEngine.getLocalRenderedPosition(
              { x: p.x, y: p.y },
            ) ?? {
              x: p.x,
              y: p.y,
            };
            return;
          }
          const interpolated = snapshotInterpolator.getRenderPosition(
            p.id,
            renderTime,
            { x: p.x, y: p.y },
          );
          // Snap guard: if the authoritative store position differs
          // wildly from what we just interpolated, it's almost
          // certainly a respawn. Jump rather than glide.
          const authoritative = { x: p.x, y: p.y };
          const gap = Math.hypot(
            authoritative.x - interpolated.x,
            authoritative.y - interpolated.y,
          );
          const next =
            gap > REMOTE_SNAP_THRESHOLD ? authoritative : interpolated;
          lastRenderedRemote.current[p.id] = next;
          renderedPositions[p.id] = next;
        });

        // Drop interpolation state for players no longer in the store.
        for (const id of Object.keys(lastRenderedRemote.current)) {
          if (!players[id]) {
            delete lastRenderedRemote.current[id];
            snapshotInterpolator.drop(id);
          }
        }

        const mePos = meAuthoritative
          ? renderedPositions[meAuthoritative.id]
          : null;

        if (meAuthoritative && mePos) {
          ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

          const offsetX = CANVAS_W / 2 - mePos.x * SCALE_X;
          const offsetY = CANVAS_H / 2 - mePos.y * SCALE_Y;

          renderBackground(ctx, offsetX, offsetY, bgImageRef.current);
          renderMapBounds(ctx, offsetX, offsetY);

          const pulseNow = performance.now();
          pickups.forEach((pickup) => {
            renderPickup(ctx!, pickup, offsetX, offsetY, pulseNow);
          });

          // Update target facing angles. For the local player we use the
          // last input direction tracked by the prediction engine — the
          // rendered position delta flips 180° under reconciliation
          // corrections and causes a visible "blink" in the sprite angle.
          // For remote players we use the position delta but reject tiny
          // magnitudes (interpolation noise) via FACING_MIN_DELTA.
          const localInputAngle = predictionEngine.getLastInputAngle();
          const motionNow = performance.now();
          Object.values(players).forEach((p) => {
            const pos = renderedPositions[p.id];
            const prev = prevPositions.current[p.id];
            if (prev) {
              const ddx = pos.x - prev.x;
              const ddy = pos.y - prev.y;
              const mag = Math.hypot(ddx, ddy);
              if (mag > WALK_MIN_DELTA) {
                lastMovingAtRef.current[p.id] = motionNow;
              }
              if (p.id !== myPlayerId && mag > FACING_MIN_DELTA) {
                targetFacingAngles.current[p.id] = Math.atan2(ddy, ddx);
              }
            }
            if (p.id === myPlayerId && localInputAngle !== null) {
              targetFacingAngles.current[p.id] = localInputAngle;
            }
            prevPositions.current[p.id] = { x: pos.x, y: pos.y };
          });

          // Snap own sprite toward attack direction
          if (attackFlashRef.current && myPlayerId) {
            targetFacingAngles.current[myPlayerId] =
              attackFlashRef.current.angle;
          }

          // Smooth interpolation toward target angle
          Object.keys(targetFacingAngles.current).forEach((id) => {
            const target = targetFacingAngles.current[id];
            const current = facingAngles.current[id] ?? target;
            facingAngles.current[id] = lerpAngle(current, target, 0.2);
          });

          // Clean up expired DoT markers (5 seconds)
          const now = performance.now();
          for (const id of Object.keys(dotPlayersRef.current)) {
            if (now - dotPlayersRef.current[id] > 5000) {
              delete dotPlayersRef.current[id];
            }
          }

          ctx.font = '11px sans-serif';
          const animNow = performance.now();
          Object.values(players).forEach((p) => {
            const pos = renderedPositions[p.id];
            const animations = animationsRef?.current?.[p.character];

            let animationFrame: HTMLImageElement | null = null;
            if (animations) {
              const attack =
                p.id === myPlayerId
                  ? (attackFlashRef.current ?? null)
                  : (activeAttacksRef.current[p.id] ?? null);
              const attackFrames = animations.attack;
              const walkFrames = animations.walk;
              const charDef = characterRegistry.get(p.character);

              if (attack && attackFrames && attackFrames.length > 0) {
                const elapsed =
                  p.id === myPlayerId
                    ? performance.now() - attack.startTime
                    : Date.now() - attack.startTime;
                const progress = Math.min(
                  elapsed / charDef.attackDurationMs,
                  1,
                );
                const idx = Math.min(
                  Math.floor(progress * attackFrames.length),
                  attackFrames.length - 1,
                );
                animationFrame = attackFrames[idx];
              } else if (walkFrames && walkFrames.length > 0) {
                const lastMovingAt = lastMovingAtRef.current[p.id];
                const moving =
                  lastMovingAt !== undefined &&
                  animNow - lastMovingAt < WALK_HOLD_MS;
                if (moving) {
                  const idx =
                    Math.floor(animNow / WALK_FRAME_MS) % walkFrames.length;
                  animationFrame = walkFrames[idx];
                }
              }
            }

            renderPlayer(
              { ...p, x: pos.x, y: pos.y },
              ctx!,
              offsetX,
              offsetY,
              myPlayerId!,
              spriteRef.current,
              facingAngles.current[p.id] ?? Math.PI / 2,
              hitTimesRef.current[p.id] ?? null,
              dotPlayersRef.current[p.id] ?? null,
              animationFrame,
            );
          });

          // My own attack flash
          const flash = attackFlashRef.current;
          if (flash) {
            const myCharacter = meAuthoritative.character ?? 'knight';
            const charDef = characterRegistry.get(myCharacter);
            const progress = Math.min(
              (performance.now() - flash.startTime) / charDef.attackDurationMs,
              1,
            );
            renderAttack(
              ctx,
              flash.angle,
              progress,
              400,
              300,
              myCharacter,
              myPlayerId!,
            );
          }

          // Other players' attacks
          Object.entries(activeAttacksRef.current).forEach(
            ([attackerId, { angle, startTime }]) => {
              const attacker = players[attackerId];
              if (!attacker) return;
              const attackerPos = renderedPositions[attackerId];
              const sx = attackerPos.x * SCALE_X + offsetX;
              const sy = attackerPos.y * SCALE_Y + offsetY;
              const attackerChar = attacker.character ?? 'knight';
              const charDef = characterRegistry.get(attackerChar);
              const progress = Math.min(
                (Date.now() - startTime) / charDef.attackDurationMs,
                1,
              );
              renderAttack(
                ctx!,
                angle,
                progress,
                sx,
                sy,
                attackerChar,
                attackerId,
              );
            },
          );

          renderVignette(ctx);
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
