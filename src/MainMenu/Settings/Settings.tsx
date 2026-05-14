import { Link } from 'react-router';
import { useEffect } from 'react';
import { CharacterSelector } from './CharacterSelector';
import { SkinSelector } from './SkinSelector';
import { SettingsBackground } from './Background';
import { Button } from '#shared/components';
import { useRendererStore } from '#shared/stores';

export const Settings: React.FC = () => {
  const setMounted = useRendererStore((s) => s.setMounted);
  useEffect(() => {
    const scene = new SettingsBackground();
    setMounted(true);
    return () => {
      scene.dispose();
      setMounted(false);
    };
  }, [setMounted]);

  return (
    <div className="flex-1 flex items-center justify-around flex-col gap-5">
      <title>Settings | Game</title>
      <div className="flex flex-col items-center justify-between gap-5 md:pt-0 pt-10">
        <div className="flex justify-between items-center w-full px-5">
          <Link to="/">
            <Button>Back</Button>
          </Link>
          <div className="text-3xl text-white/70 font-bold">Settings</div>
          <div></div>
        </div>
        <CharacterSelector />
      </div>
      <SkinSelector />
    </div>
  );
};
