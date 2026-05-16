import { Button } from '#shared/components';
import { resources } from '#shared/renderer/resources';
import { gameSocket } from '#shared/services/websocket';
import {
  useGameStore,
  useRendererStore,
  useSettingsStore,
} from '#shared/stores';
import { useEffect, useRef, useState } from 'react';
import { Game3DRenderer } from './Game3DRenderer';
import { useKeyboardMapping, useSoundEffects } from '../hooks';

interface Game3DProps {
  leave: () => void;
}

export const Game3D = ({ leave }: Game3DProps) => {
  const setMounted = useRendererStore((s) => s.setMounted);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const rendererRef = useRef<Game3DRenderer | null>(null);
  const lastAttackTimeRef = useRef(0);
  const [ready, setReady] = useState(false);
  const { playAttackSound } = useSoundEffects();

  useEffect(() => {
    if (!ready) return;
    const onClick = () => {
      if (!document.pointerLockElement) return;
      const r = rendererRef.current;
      if (!r || !myPlayerId) return;
      const stats = useSettingsStore.getState().getSelectedCharacterStats();
      const now = performance.now();
      if (
        stats.cooldown_ms > 0 &&
        now - lastAttackTimeRef.current < stats.cooldown_ms
      ) {
        return;
      }
      lastAttackTimeRef.current = now;
      const angle = -r.getYaw() - Math.PI / 2;
      gameSocket.attack(angle, gameSocket.nextClientTick());
      r.triggerAttack(myPlayerId, angle);
      const me = useGameStore.getState().players[myPlayerId];
      if (me?.character) playAttackSound(me.character);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [ready, myPlayerId, playAttackSound]);

  useEffect(() => {
    if (!ready) return;
    const unsub = gameSocket.onMessage((msg) => {
      if (msg.type !== 'combat_event') return;
      const r = rendererRef.current;
      if (!r) return;
      const { attackerId, defenderId } = msg;
      if (attackerId === 'dot') {
        r.triggerDot(defenderId);
      } else if (attackerId !== myPlayerId) {
        const { players } = useGameStore.getState();
        const attacker = players[attackerId];
        const defender = players[defenderId];
        if (attacker && defender) {
          const angle = Math.atan2(
            defender.y - attacker.y,
            defender.x - attacker.x,
          );
          r.triggerAttack(attackerId, angle);
        }
      }
    });
    return unsub;
  }, [ready, myPlayerId]);

  useEffect(() => {
    let cancelled = false;
    resources.load().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const renderer = new Game3DRenderer();
    rendererRef.current = renderer;
    setMounted(true);
    return () => {
      renderer.dispose();
      rendererRef.current = null;
      setMounted(false);
    };
  }, [ready, setMounted]);

  useKeyboardMapping(ready, () => rendererRef.current?.getYaw());

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <p className="text-white/80 text-lg">Loading 3D assets…</p>
      </div>
    );
  }

  return (
    <div
      className="fixed top-0 left-0 w-dvw h-dvh cursor-crosshair"
      onClick={() => rendererRef.current?.requestPointerLock()}
    >
      <div
        className="absolute top-3 left-3 flex gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="secondary" onClick={leave}>
          Leave
        </Button>
        <span className="px-3 py-1 rounded-md bg-secondary text-white/80 text-sm">
          3rd Person (beta)
        </span>
      </div>
    </div>
  );
};
