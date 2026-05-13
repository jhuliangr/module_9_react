import {
  Box,
  Button,
  ErrorComponent,
  LoadingComponent,
} from '#shared/components';
import { useGetGameSettings } from '#shared/hooks';
import { useRendererStore } from '#shared/stores';
import { MainMenuBackground } from './Background';
import { useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router';

export const MainMenu = () => {
  const setMounted = useRendererStore((s) => s.setMounted);
  const sceneRef = useRef<MainMenuBackground | null>(null);
  useEffect(() => {
    const scene = new MainMenuBackground();
    sceneRef.current = scene;
    setMounted(true);
    return () => {
      scene.dispose();
      sceneRef.current = null;
      setMounted(false);
    };
  }, [setMounted]);
  const subtitleRef = useCallback((el: HTMLParagraphElement | null) => {
    sceneRef.current?.setDaggerTarget(el);
  }, []);
  const { loading, error } = useGetGameSettings();
  return (
    <div className="flex items-center justify-center flex-1">
      {loading || error ? (
        loading ? (
          <LoadingComponent />
        ) : (
          <ErrorComponent />
        )
      ) : (
        <div className="flex flex-col gap-10 md:w-1/3 text-center select-none">
          <div>
            <h1 className="text-primary font-bold text-7xl p-3 [text-shadow:0_1px_2px_rgb(0_0_0/0.95),0_0_8px_rgb(0_0_0/0.8)]">
              Arena
            </h1>
            <p
              ref={subtitleRef}
              className="text-white/90 [text-shadow:0_1px_2px_rgb(0_0_0/0.95),0_0_8px_rgb(0_0_0/0.8)]"
            >
              Try your best to stay standing
            </p>
          </div>
          <Box>
            <Link to="/play">
              <Button>Play</Button>
            </Link>

            <Link to="/achievements">
              <Button>Achievements</Button>
            </Link>

            <Link to="/settings">
              <Button>Settings</Button>
            </Link>
          </Box>
        </div>
      )}
    </div>
  );
};
