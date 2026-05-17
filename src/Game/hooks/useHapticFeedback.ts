import {
  gameSocket,
  type CombatEventMessage,
} from '#shared/services/websocket';
import { useGameStore } from '#shared/stores';
import { useEffect } from 'react';

// Short pulse — enough for the user to feel a confirm without becoming
// annoying. 30ms is roughly a "tap" on most Android devices.
const HIT_VIBRATION_MS = 30;
// Floor between consecutive vibrations. DoT ticks and rapid hit chains
// would otherwise trigger a continuous buzz. 80ms keeps each event
// individually perceivable while coalescing bursts.
const MIN_INTERVAL_MS = 80;

function supportsVibration(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  );
}

/**
 * Fires a short vibration whenever the local player takes damage.
 *
 * `navigator.vibrate` is a no-op on iOS Safari and desktop browsers,
 * so this hook is safe to mount unconditionally — it only produces
 * output where the platform supports haptics (primarily Android).
 */
export function useHapticFeedback() {
  useEffect(() => {
    if (!supportsVibration()) return;

    let lastVibrateAt = 0;

    const unsub = gameSocket.onMessage((msg) => {
      if (msg.type !== 'combat_event') return;
      const { defenderId } = msg as CombatEventMessage;
      const { myPlayerId } = useGameStore.getState();
      if (defenderId !== myPlayerId) return;

      const now = performance.now();
      if (now - lastVibrateAt < MIN_INTERVAL_MS) return;
      lastVibrateAt = now;
      navigator.vibrate(HIT_VIBRATION_MS);
    });

    return () => {
      unsub();
      if (lastVibrateAt > 0 && supportsVibration()) navigator.vibrate(0);
    };
  }, []);
}
