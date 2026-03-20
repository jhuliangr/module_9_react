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
    <div className="flex gap-3 bg-gray-200 rounded-xl">
      {skins.map((skin) => (
        <img
          key={skin.id}
          src={`/assets/${selectedCharacter.toLowerCase()}-${skin.id.replace('skin_', '')}-skin.png`}
          alt={skin.name}
          className={cn(
            'w-36 cursor-pointer hover:opacity-80 transition-all duration-200 rounded-lg',
            {
              'blur-sm cursor-not-allowed': skin.unlockCondition !== null,
              'border-2': selectedSkin?.id === skin.id,
            },
          )}
          onClick={() => handleSelectSkin(skin)}
        />
      ))}
    </div>
  );
};
