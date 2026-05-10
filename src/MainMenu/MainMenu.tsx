import {
  Box,
  Button,
  ErrorComponent,
  LoadingComponent,
} from '#shared/components';
import { useGetGameSettings } from '#shared/hooks';
import { useRendererStore } from '#shared/stores';
import { MainMenuBackground } from './Background';
import { useEffect } from 'react';
import { Link } from 'react-router';

export const MainMenu = () => {
  const setMounted = useRendererStore((s) => s.setMounted);
  useEffect(() => {
    const scene = new MainMenuBackground();
    setMounted(true);
    return () => {
      scene.dispose();
      setMounted(false);
    };
  }, [setMounted]);
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
        <div className="flex flex-col gap-10 md:w-1/3 text-center">
          <div>
            <h1 className="text-primary bg-clip-text bg-white text-shadow-2xs shadow-amber-600 font-bold text-7xl p-3">
              Arena
            </h1>
            <p className="text-dark">Try your best to stay standing</p>
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
