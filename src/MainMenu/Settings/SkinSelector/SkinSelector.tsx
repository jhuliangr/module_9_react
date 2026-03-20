import { useSettingsStore } from '#shared/stores';

export const SkinSelector: React.FC = () => {
  const skins = useSettingsStore((state) => state.skins);
  return (
    <div className="flex gap-3">
      {skins.map((asd) => (
        <div>{asd.id}</div>
      ))}
    </div>
  );
};
