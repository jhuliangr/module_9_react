import type { PlayerRig } from '../types';
import { buildBoxRig } from './default';
import { buildMageRig } from './mage';
import { getMageGltf } from './utils';

export function buildRig(character: string, color: number): PlayerRig {
  // For now I'm only validating if it is the mage the selected character
  const mageGltf = character === 'mage' ? getMageGltf() : null;
  if (mageGltf) return buildMageRig(mageGltf);
  return buildBoxRig(character, color);
}
