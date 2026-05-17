import { resources } from '#shared/renderer/resources';
import type { GLTF } from 'three/examples/jsm/Addons.js';

export function getMageGltf(): GLTF | null {
  return (resources.get('mage') as GLTF | undefined) ?? null;
}
