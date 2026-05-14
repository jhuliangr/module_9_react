import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useSettingsStore } from '#shared/stores';
import { Settings } from './Settings';

vi.mock('./Background', () => ({
  SettingsBackground: class {
    dispose() {}
  },
}));

describe('Settings component works as expected', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      characters: [],
      skins: [],
      selectedCharacter: 'knight',
      selectedSkin: null,
    });
  });

  it('renders the Settings title', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows the Back button', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('points the Back button to the root route', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    const backLink = screen.getByText('Back').closest('a');
    expect(backLink).toHaveAttribute('href', '/');
  });
});
