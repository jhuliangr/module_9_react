import type {
  GetGameServerInfoResponse,
  Skin,
  Weapon,
  Achivement,
} from '#shared/services/game';

export type SettingsStoreState = GetGameServerInfoResponse & {
  selectedCharacter: string;
  selectedSkin: Skin | null;
  unlockedAchivements: Achivement | null;
  selectedWeapon: Weapon | null;
  setSelectedSkin: (skin: Skin) => void;
  setUnlockedAchivements: (achivement: Achivement) => void;
  setSelectedWeapon: (weapon: Weapon) => void;
  setSettingsFromServer: (settings: GetGameServerInfoResponse) => void;
  setSelectedCharacter: (character: string) => void;
};
