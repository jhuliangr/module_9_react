import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useSettingsStore } from '#shared/stores';
import { Achievements } from './Achievements';

vi.mock('./Background', () => ({
  AchivementsBackground: class {
    dispose() {}
  },
}));

describe('Achievements component works as expected', () => {
  beforeEach(() => {
    useSettingsStore.setState({ achievements: [], unlockedAchievementIds: [] });
  });

  it('renders the Achievements title', () => {
    render(
      <MemoryRouter>
        <Achievements />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: 'Achievements' }),
    ).toBeInTheDocument();
  });

  it('shows a message when there are no achievements', () => {
    render(
      <MemoryRouter>
        <Achievements />
      </MemoryRouter>,
    );
    expect(screen.getByText('No achievements available')).toBeInTheDocument();
  });

  it('renders each available achievement', () => {
    useSettingsStore.setState({
      achievements: [
        {
          id: 'a1',
          name: 'Rising Star',
          condition: { type: 'level', value: 2 },
        },
        {
          id: 'a2',
          name: 'Slayer',
          condition: { type: 'kills', value: 5 },
        },
      ],
      unlockedAchievementIds: ['a1'],
    });
    render(
      <MemoryRouter>
        <Achievements />
      </MemoryRouter>,
    );
    expect(screen.getByText('Rising Star')).toBeInTheDocument();
    expect(screen.getByText('Slayer')).toBeInTheDocument();
  });
});
