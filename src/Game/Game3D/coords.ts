import { WORLD_SIZE } from '#shared/constants';

export const WORLD_SCALE = 0.05;

export function worldToScene(x: number, y: number): { x: number; z: number } {
  const half = (WORLD_SIZE * WORLD_SCALE) / 2;
  return {
    x: x * WORLD_SCALE - half,
    z: y * WORLD_SCALE - half,
  };
}
