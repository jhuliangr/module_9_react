import { create } from 'zustand';
import { resources } from '#shared/renderer/resources';

interface RendererStoreState {
  ready: boolean;
  mounted: boolean;
  setMounted: (value: boolean) => void;
}

export const useRendererStore = create<RendererStoreState>((set) => {
  resources
    .load()
    .then(() => set({ ready: true }))
    .catch(() => {});
  return {
    ready: false,
    mounted: false,
    setMounted: (value) => set({ mounted: value }),
  };
});
