import { gameSocket } from '#shared/services/websocket';
import { useEffect, useRef } from 'react';
import { predictionEngine } from '../engine/predictionEngine';

// Matches the server's MOVE_MIN_INTERVAL_MS (25ms) with a small cushion
// to absorb RAF jitter at 60Hz without dropping honest inputs. The
// prediction engine applies its own 40ms floor to match the server's
// authoritative step cadence.
const MIN_SEND_INTERVAL_MS = 30;
// While a direction is held, resend the vector at this cadence so the
// server keeps advancing the player. Equal to the prediction engine's
// accept interval — a perfect match means every send produces a step
// both locally and server-side.
const HOLD_REPEAT_MS = 40;

function keysToVector(keys: Set<string>): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy = -1;
  if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy = 1;
  if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx = -1;
  if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx = 1;
  return { dx, dy };
}

/**
 * Event-driven keyboard movement.
 *
 * The pump runs on requestAnimationFrame, but is a no-op unless either:
 *   - the direction vector *changed* since the last send, or
 *   - the direction is held and HOLD_REPEAT_MS has elapsed.
 *
 * Direction changes trigger an immediate send (respecting the server's
 * ~25ms rate limit), cutting the worst-case input latency from ~50ms
 * (old setInterval) to ~1 frame (~16ms at 60Hz).
 */
export function useKeyboardMapping(
  joined: boolean,
  getYaw?: () => number | null | undefined,
) {
  const keysRef = useRef<Set<string>>(new Set());
  const lastSentDx = useRef(0);
  const lastSentDy = useRef(0);
  const lastSentAt = useRef(-Infinity);
  const getYawRef = useRef(getYaw);
  useEffect(() => {
    getYawRef.current = getYaw;
  }, [getYaw]);

  useEffect(() => {
    if (!joined) return;

    let rafId = 0;
    let cancelled = false;

    const pump = () => {
      if (cancelled) return;
      const { dx, dy } = keysToVector(keysRef.current);
      const changed = dx !== lastSentDx.current || dy !== lastSentDy.current;
      const now = performance.now();
      const sinceLast = now - lastSentAt.current;

      if (dx === 0 && dy === 0) {
        // Release: no need to send "stop" — the server treats absence
        // of move messages as no motion. Just clear local state so the
        // next keypress registers as a change.
        lastSentDx.current = 0;
        lastSentDy.current = 0;
      } else if (
        sinceLast >= MIN_SEND_INTERVAL_MS &&
        (changed || sinceLast >= HOLD_REPEAT_MS)
      ) {
        const yaw = getYawRef.current?.();
        let sendDx = dx;
        let sendDy = dy;
        if (yaw != null) {
          const c = Math.cos(yaw);
          const s = Math.sin(yaw);
          sendDx = dx * c + dy * s;
          sendDy = -dx * s + dy * c;
        }
        const tick = gameSocket.nextClientTick();
        predictionEngine.applyLocalMove(sendDx, sendDy, tick);
        gameSocket.move(sendDx, sendDy, tick);
        lastSentDx.current = dx;
        lastSentDy.current = dy;
        lastSentAt.current = now;
      }

      rafId = requestAnimationFrame(pump);
    };

    rafId = requestAnimationFrame(pump);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [joined]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);
}
