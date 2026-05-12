import type { Skin } from '#shared/services/game';
import { useSettingsStore } from '#shared/stores';
import { cn } from '#shared/utils';

export const SkinSelector: React.FC = () => {
  const skins = useSettingsStore((state) => state.skins);
  const selectedSkin = useSettingsStore((state) => state.selectedSkin);
  const setSelectedSkin = useSettingsStore((state) => state.setSelectedSkin);
  const selectedCharacter = useSettingsStore(
    (state) => state.selectedCharacter,
  );
  const handleSelectSkin = (skin: Skin) => {
    if (skin.unlockCondition === null) {
      setSelectedSkin(skin);
    }
  };
  return (
    <div className="md:flex gap-3 rounded-xl">
      {skins
        .filter(
          (s) =>
            import.meta.env.VITE_SHOW_INCOMPLETE_SPRITES === '1' ||
            s.id === 'skin_default',
        )
        .map((skin) => (
          <img
            key={skin.id}
            src={`${import.meta.env.BASE_URL}assets/${selectedCharacter.toLowerCase()}-${skin.id.replace('skin_', '')}-skin.png`}
            alt={skin.name}
            className={cn(
              'w-36 cursor-pointer hover:opacity-80 transition-all duration-200 rounded-lg',
              {
                'blur-sm cursor-not-allowed md:block hidden':
                  skin.unlockCondition !== null,
                'border-2': selectedSkin?.id === skin.id,
              },
            )}
            onClick={() => handleSelectSkin(skin)}
          />
        ))}
    </div>
  );
};
