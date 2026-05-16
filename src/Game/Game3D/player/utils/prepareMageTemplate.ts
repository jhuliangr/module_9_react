import { Color, Mesh, MeshStandardMaterial } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { resources } from '#shared/renderer/resources';
import { MAGE_ORB_COLOR } from '../character/mage/mage';

export function getMageGltf(): GLTF | null {
  return (resources.get('mage') as GLTF | undefined) ?? null;
}

export function prepareMageTemplate(): void {
  const gltf = getMageGltf();
  if (!gltf) return;

  const root = gltf.scene.getObjectByName('orb');
  if (!root) return;

  root.traverse((child) => {
    const m = child as Mesh;
    if (!m.isMesh) return;

    const mats = Array.isArray(m.material) ? m.material : [m.material];

    for (const mat of mats) {
      if (!('emissive' in mat)) continue;
      const std = mat as MeshStandardMaterial;
      std.emissive = new Color(MAGE_ORB_COLOR);
      std.emissiveIntensity = 6;
      std.emissiveMap = null;
      std.needsUpdate = true;
    }
  });
}
