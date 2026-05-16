import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const mockState = {
  joined: false,
  reconnecting: false,
  join: vi.fn(),
  lost: vi.fn(),
  leave: vi.fn(),
  lastUnlockedAchievement: null,
  clearAchievementNotification: vi.fn(),
};

// JoinGameBackground constructs a WebGLRenderer, which crashes in jsdom
// because the shared #three canvas only exists in index.html. Stubbed
// so the form can mount without exploding.
vi.mock('./JoinGameForm/Background', () => ({
  JoinGameBackground: class {
    dispose() {}
    setDaggerTarget() {}
  },
}));

vi.mock('./hooks', () => ({
  useSocketSubscribe: () => mockState,
  useIsMobile: () => false,
  useKeyboardMapping: () => {},
  useAttackAnimation: () => ({
    attackFlashRef: { current: null },
    cooldownActiveRef: { current: false },
    handleCanvasClick: () => {},
  }),
  useBackgroundImage: () => ({ current: null }),
  useCanvasRenderer: () => {},
  useDeathDetection: () => {},
  useHapticFeedback: () => {},
  useMobileControls: () => ({
    onMoveJoystick: () => {},
    onAttackJoystick: () => {},
    onAttackEnd: () => {},
    attackFlashRef: { current: null },
    cooldownActiveRef: { current: false },
  }),
  useOtherPlayersAttacks: () => ({ current: {} }),
  usePlayerAnimations: () => ({ current: {} }),
  usePlayerSprite: () => ({ current: {} }),
  useSoundEffects: () => ({ playAttackSound: () => {} }),
}));

import { Game } from './Game';

describe('Game component works as expected', () => {
  beforeEach(() => {
    mockState.joined = false;
    mockState.reconnecting = false;
  });

  it('renders the JoinGameForm when not joined', () => {
    render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>,
    );
    expect(screen.getByText('Join')).toBeInTheDocument();
  });

  it('renders a reconnecting indicator when reconnecting', () => {
    mockState.reconnecting = true;
    render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>,
    );
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
  });

  it('renders the canvas when the player has joined', () => {
    mockState.joined = true;
    const { container } = render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>,
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});
