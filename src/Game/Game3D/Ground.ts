import {
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  type Scene,
  SRGBColorSpace,
  TextureLoader,
} from 'three';
import { WORLD_SCALE } from './coords';
import { WORLD_SIZE } from '#shared/constants';

const GROUND_SEGMENTS = 256;
const GROUND_DISPLACEMENT = 1.5;
const GROUND_TEXTURE_URL = `${import.meta.env.BASE_URL}assets/bg-1.png`;

export class Ground {
  #mesh: Mesh;
  #material: MeshStandardMaterial;

  constructor(scene: Scene) {
    const worldUnits = WORLD_SIZE * WORLD_SCALE;
    this.#material = new MeshStandardMaterial({ color: '#ffffff' });
    this.#mesh = new Mesh(
      new PlaneGeometry(
        worldUnits,
        worldUnits,
        GROUND_SEGMENTS,
        GROUND_SEGMENTS,
      ),
      this.#material,
    );
    this.#mesh.rotation.x = -Math.PI / 2;
    scene.add(this.#mesh);

    new TextureLoader().load(GROUND_TEXTURE_URL, (tex) => {
      tex.colorSpace = SRGBColorSpace;
      tex.wrapS = RepeatWrapping;
      tex.wrapT = RepeatWrapping;
      this.#material.map = tex;
      this.#material.displacementMap = tex;
      this.#material.displacementScale = GROUND_DISPLACEMENT;
      this.#material.bumpMap = tex;
      this.#material.bumpScale = 1.0;
      this.#material.needsUpdate = true;
    });
  }

  dispose(): void {
    this.#mesh.geometry.dispose();
    this.#material.map?.dispose();
    this.#material.dispose();
  }
}
