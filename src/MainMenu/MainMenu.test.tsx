import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MainMenu } from './MainMenu';

vi.mock('#shared/utils/api-client', () => ({
  apiClient: {
    gameService: {
      getGameServerInfo: vi.fn().mockResolvedValue({
        achievements: [],
        skins: [],
        weapons: [],
      }),
    },
  },
}));

vi.mock('./Background', () => ({
  MainMenuBackground: class {
    dispose() {}
    setDaggerTarget() {}
  },
}));

describe('MainMenu component works as expected', () => {
  it('works', () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>,
    );
  });
  it('shows the button for playing', async () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Play/)).toBeInTheDocument();
  });
  it('shows the button for settings', async () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Settings/)).toBeInTheDocument();
  });
});
