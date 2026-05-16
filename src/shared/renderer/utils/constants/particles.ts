import { PLAYER_HEIGHT } from './player';

// Mage attack burst: forward-biased cone of azure/green/white particles.
export const PARTICLE_COUNT = 120;
export const PARTICLE_LIFE_SEC = 0.8;
export const PARTICLE_STAGGER_SEC = 0.15;
export const PARTICLE_TOTAL_MS =
  (PARTICLE_LIFE_SEC + PARTICLE_STAGGER_SEC) * 1000;
export const PARTICLE_PALETTE: ReadonlyArray<
  readonly [number, number, number]
> = [
  [0.3, 0.6, 1.0], // azure blue
  [0.4, 1.0, 0.7], // mint green
  [1.0, 1.0, 1.0], // white
];

// Purple burst that pulses out from the defender when a DoT tick lands.
export const DOT_PARTICLE_COUNT = 80;
export const DOT_PARTICLE_LIFE_SEC = 0.7;
export const DOT_PARTICLE_STAGGER_SEC = 0.1;
export const DOT_PARTICLE_TOTAL_MS =
  (DOT_PARTICLE_LIFE_SEC + DOT_PARTICLE_STAGGER_SEC) * 1000;
export const DOT_PARTICLE_PALETTE: ReadonlyArray<
  readonly [number, number, number]
> = [
  [0.7, 0.3, 1.0], // mid purple
  [0.95, 0.5, 1.0], // light orchid
  [0.5, 0.0, 0.9], // deep violet
];
export const DOT_PARTICLE_Y = PLAYER_HEIGHT * 0.6 + 1.5;
