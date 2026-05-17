import { Color, Mesh, MeshStandardMaterial } from 'three';
import { MAGE_ORB_COLOR } from './constants';
import { getMageGltf } from '..';

export function prepareMageTemplate(): void {
  const gltf = getMageGltf();
  if (!gltf) return;

  const root = gltf.scene.getObjectByName('orb');
  if (!root) return;

  root.traverse((child) => {
    const m = child as Mesh;
    if (!m.isMesh) return;
    const mat = m.material;

    // Setting a reference to the material with it's type assigned for typescript not to complain
    const std = mat as MeshStandardMaterial;
    std.emissive = new Color(MAGE_ORB_COLOR);
    std.emissiveIntensity = 6;
    std.emissiveMap = null;
    std.needsUpdate = true;
  });
}
