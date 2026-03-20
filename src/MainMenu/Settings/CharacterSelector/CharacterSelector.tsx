import { AVAILABLE_CHARACTERS } from '#shared/constants';
import { useSettingsStore } from '#shared/stores';
import { cn } from '#shared/utils';

export const CharacterSelector: React.FC = () => {
  const selectedCharacter = useSettingsStore(
    (state) => state.selectedCharacter,
  );
  const setSelectedCharacter = useSettingsStore(
    (state) => state.setSelectedCharacter,
  );
  return (
    <div className="flex justify-around gap-3">
      {AVAILABLE_CHARACTERS.map((character, i) => (
        <div
          className={cn(
            'font-bold text-xl border-2 p-2 rounded-full cursor-pointer',
            {
              'border-black bg-lime-100': selectedCharacter === character,
            },
          )}
          key={`${character}_${i}`}
          onClick={() => setSelectedCharacter(character)}
        >
          {character}
        </div>
      ))}
    </div>
  );
};
