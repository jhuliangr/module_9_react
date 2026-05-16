import { gameSocket } from '#shared/services/websocket';
import { useSettingsStore } from '#shared/stores';
import { useCallback, useEffect, useRef } from 'react';
import { characterRegistry } from '../characters';
import { predictionEngine } from '#shared/engine';

// Matches server MOVE_MIN_INTERVAL_MS (25ms) with a small cushion for
// RAF scheduling jitter. Direction changes bypass the hold-repeat
// interval as long as this floor has elapsed.
const MIN_SEND_INTERVAL_MS = 30;
// Cadence at which a held joystick direction is re-sent. Equal to the
// prediction engine's accept interval.
const HOLD_REPEAT_MS = 40;
const DEADZONE = 0.2;
export const ATTACK_DEADZONE = 0.3;
const MIN_ATTACK_INTERVAL_MS = 200;
const DEFAULT_FACING_ANGLE = Math.PI / 2;

export function useMobileControls(
  joined: boolean,
  onAttack?: (characterId: string) => void,
) {
  const moveDx = useRef(0);
  const moveDy = useRef(0);
  const lastSentDx = useRef(0);
  const lastSentDy = useRef(0);
  const lastSentAt = useRef(-Infinity);

  const attackFlashRef = useRef<{ angle: number; startTime: number } | null>(
    null,
  );
  const lastAttackTimeRef = useRef(0);
  const cooldownActiveRef = useRef(false);
  const attackActiveRef = useRef(false);

  const onMoveJoystick = useCallback((dx: number, dy: number) => {
    moveDx.current = dx;
    moveDy.current = dy;
  }, []);

  const tryAttack = useCallback(
    (angle: number) => {
      const now = performance.now();
      if (now - lastAttackTimeRef.current < MIN_ATTACK_INTERVAL_MS) return;

      const stats = useSettingsStore.getState().getSelectedCharacterStats();
      if (
        stats.cooldown_ms > 0 &&
        now - lastAttackTimeRef.current < stats.cooldown_ms
      ) {
        return;
      }

      const selectedChar = useSettingsStore.getState().selectedCharacter;
      const charDef = characterRegistry.get(selectedChar);

      lastAttackTimeRef.current = now;
      gameSocket.attack(angle, gameSocket.nextClientTick());
      onAttack?.(selectedChar);
      attackFlashRef.current = { angle, startTime: now };

      if (stats.cooldown_ms > 0) {
        cooldownActiveRef.current = true;
        setTimeout(() => {
          cooldownActiveRef.current = false;
        }, stats.cooldown_ms);
      }

      setTimeout(() => {
        attackFlashRef.current = null;
      }, charDef.attackDurationMs + 80);
    },
    [onAttack],
  );

  const onAttackStart = useCallback(() => {
    attackActiveRef.current = true;
    const facing = predictionEngine.getLastInputAngle() ?? DEFAULT_FACING_ANGLE;
    tryAttack(facing);
  }, [tryAttack]);

  const onAttackJoystick = useCallback(
    (dx: number, dy: number) => {
      if (!attackActiveRef.current) return;
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      if (magnitude < ATTACK_DEADZONE) return;
      tryAttack(Math.atan2(dy, dx));
    },
    [tryAttack],
  );

  const onAttackEnd = useCallback(() => {
    attackActiveRef.current = false;
  }, []);

  useEffect(() => {
    if (!joined) return;

    let rafId = 0;
    let cancelled = false;

    const pump = () => {
      if (cancelled) return;
      const dx = moveDx.current;
      const dy = moveDy.current;
      const normDx = dx > DEADZONE ? 1 : dx < -DEADZONE ? -1 : 0;
      const normDy = dy > DEADZONE ? 1 : dy < -DEADZONE ? -1 : 0;
      const now = performance.now();
      const sinceLast = now - lastSentAt.current;

      if (normDx === 0 && normDy === 0) {
        lastSentDx.current = 0;
        lastSentDy.current = 0;
      } else {
        const changed =
          normDx !== lastSentDx.current || normDy !== lastSentDy.current;
        if (
          sinceLast >= MIN_SEND_INTERVAL_MS &&
          (changed || sinceLast >= HOLD_REPEAT_MS)
        ) {
          const tick = gameSocket.nextClientTick();
          predictionEngine.applyLocalMove(normDx, normDy, tick);
          gameSocket.move(normDx, normDy, tick);
          lastSentDx.current = normDx;
          lastSentDy.current = normDy;
          lastSentAt.current = now;
        }
      }

      rafId = requestAnimationFrame(pump);
    };

    rafId = requestAnimationFrame(pump);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [joined]);

  return {
    onMoveJoystick,
    onAttackStart,
    onAttackJoystick,
    onAttackEnd,
    attackFlashRef,
    cooldownActiveRef,
  };
}
