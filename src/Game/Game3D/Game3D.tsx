import { Button } from '#shared/components';
import { useRendererStore } from '#shared/stores';
import { useEffect, useRef } from 'react';
import { Game3DRenderer } from './Game3DRenderer';
import { useKeyboardMapping } from '../hooks';

interface Game3DProps {
  leave: () => void;
}

export const Game3D = ({ leave }: Game3DProps) => {
  const setMounted = useRendererStore((s) => s.setMounted);
  const rendererRef = useRef<Game3DRenderer | null>(null);
  useEffect(() => {
    const renderer = new Game3DRenderer();
    rendererRef.current = renderer;
    setMounted(true);
    return () => {
      renderer.dispose();
      rendererRef.current = null;
      setMounted(false);
    };
  }, [setMounted]);
  useKeyboardMapping(true, () => rendererRef.current?.getYaw());

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
