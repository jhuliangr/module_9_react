import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSettingsStore } from '#shared/stores';
import { SkinSelector } from './SkinSelector';

describe('SkinSelector component works as expected', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      skins: [
        { id: 'skin_default', name: 'Default Skin', unlockCondition: null },
        {
          id: 'skin_locked',
          name: 'Locked Skin',
          unlockCondition: { type: 'kills', value: 10 },
        },
      ],
      selectedSkin: null,
      selectedCharacter: 'knight',
    });
  });

  it('renders one image per skin', () => {
    render(<SkinSelector />);
    if (import.meta.env.VITE_SHOW_INCOMPLETE_SPRITES === '1') {
      expect(screen.getAllByRole('img')).toHaveLength(2);
    }
  });

  it('updates the selected skin when clicking an unlocked skin', () => {
    render(<SkinSelector />);
    fireEvent.click(screen.getByAltText('Default Skin'));
    expect(useSettingsStore.getState().selectedSkin?.id).toBe('skin_default');
  });

  it('does not select a skin that is still locked', () => {
    render(<SkinSelector />);
    if (import.meta.env.VITE_SHOW_INCOMPLETE_SPRITES === '1') {
      fireEvent.click(screen.getByAltText('Locked Skin'));
      expect(useSettingsStore.getState().selectedSkin).toBeNull();
    }
  });
});
