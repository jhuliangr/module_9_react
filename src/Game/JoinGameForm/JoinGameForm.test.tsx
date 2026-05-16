import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// JoinGameBackground constructs a WebGLRenderer, which crashes in jsdom
// because the shared #three canvas only exists in index.html. We stub it
// to a no-op so the form's useEffect runs cleanly.
vi.mock('./Background', () => ({
  JoinGameBackground: class {
    dispose() {}
    setDaggerTarget() {}
  },
}));

import { JoinGameForm } from './JoinGameForm';

describe('JoinGameForm component works as expected', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the Join buttons and name input', () => {
    render(
      <MemoryRouter>
        <JoinGameForm onJoin={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByText('Join')).toBeInTheDocument();
    expect(screen.getByText('Join 3rd Person (beta)')).toBeInTheDocument();
  });

  it('calls onJoin with classic mode when Join is clicked', () => {
    const onJoin = vi.fn();
    render(
      <MemoryRouter>
        <JoinGameForm onJoin={onJoin} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Arthur' },
    });
    fireEvent.click(screen.getByText('Join'));
    expect(onJoin).toHaveBeenCalledWith('Arthur', 'classic');
  });

  it('calls onJoin with third-person mode when the beta button is clicked', () => {
    const onJoin = vi.fn();
    render(
      <MemoryRouter>
        <JoinGameForm onJoin={onJoin} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Arthur' },
    });
    fireEvent.click(screen.getByText('Join 3rd Person (beta)'));
    expect(onJoin).toHaveBeenCalledWith('Arthur', 'third-person');
  });

  it('shows an error toast when submitting without a name', () => {
    const onJoin = vi.fn();
    render(
      <MemoryRouter>
        <JoinGameForm onJoin={onJoin} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Join'));
    expect(
      screen.getByText('Your character must have a name'),
    ).toBeInTheDocument();
    expect(onJoin).not.toHaveBeenCalled();
  });
});
