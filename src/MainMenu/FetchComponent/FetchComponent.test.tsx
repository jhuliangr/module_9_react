import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FetchSettingsComponent } from './FetchComponent';
import { useGetGameSettings } from './useGetGameSettings';

vi.mock('./useGetGameSettings', () => ({
  useGetGameSettings: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(useGetGameSettings).mockReturnValue({
    error: false,
    loading: true,
  });
});

describe('FetchComponent works as expected', () => {
  it('works', () => {
    render(<FetchSettingsComponent />);
  });
  it('Calls the hook', () => {
    expect(useGetGameSettings).toHaveBeenCalled();
  });
  it('renders loading component', () => {
    render(<FetchSettingsComponent />);
    expect(screen.getByTitle('Loading...')).toBeDefined();
  });
});
