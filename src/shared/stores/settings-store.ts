import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SettingsStoreState } from './types/SettingsStoreState';

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set, get) => ({
      selectedCharacter: 'Knight',
      selectedSkin: null,
      unlockedAchivements: null,
      selectedWeapon: null,
      achievements: [],
      gameRules: {
        attackRange: 0,
        baseHp: 0,
        baseSwordDamage: 0,
        speed: 0,
        tickMs: 0,
        xpPerKill: 0,
      },
      skins: [],
      weapons: [],
      setSettingsFromServer: (settings) =>
        set({
          achievements: settings.achievements,
          gameRules: settings.gameRules,
          skins: settings.skins,
          weapons: settings.weapons,
        }),
      setSelectedSkin: (skin) =>
        set({
          selectedSkin: skin,
        }),
      setSelectedWeapon: (weapon) =>
        set({
          selectedWeapon: weapon,
        }),
      setUnlockedAchivements: (newAchivement) => {
        const achivements = get().achievements;
        if (achivements.some((ach) => ach.id === newAchivement.id)) {
          return;
        }
        set({
          achievements: [...achivements, newAchivement],
        });
      },
      setSelectedCharacter: (character) =>
        set({
          selectedCharacter: character,
        }),
    }),
    {
      name: 'settings-storage',
    },
  ),
);
