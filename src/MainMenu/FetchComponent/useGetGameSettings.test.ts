import { renderHook } from '@testing-library/react';
import { createElement, Suspense } from 'react';
import { describe, it, vi } from 'vitest';
import { useGetGameSettings } from './useGetGameSettings';

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

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(Suspense, { fallback: null }, children);

describe('Hook useGetGameSettings works as expected', () => {
  it('Works', async () => {
    renderHook(() => useGetGameSettings(), { wrapper });
  });
});
