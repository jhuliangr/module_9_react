import {
  Mesh,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  PlaneGeometry,
  type Scene,
  SRGBColorSpace,
  TextureLoader,
} from 'three';
import { WORLD_SCALE } from './coords';
import { WORLD_SIZE } from '#shared/constants';

const GROUND_SEGMENTS = 128;
const GROUND_DISPLACEMENT = 1.5;
const GROUND_EXTEND_FACTOR = 2;
const GROUND_TEXTURE_URL = `${import.meta.env.BASE_URL}assets/bg-1.png`;

export class Ground {
  #mesh: Mesh;
  #material: MeshStandardMaterial;

  constructor(scene: Scene) {
    const extendedUnits = WORLD_SIZE * WORLD_SCALE * GROUND_EXTEND_FACTOR;
    const geometry = new PlaneGeometry(
      extendedUnits,
      extendedUnits,
      GROUND_SEGMENTS,
      GROUND_SEGMENTS,
    );
    this.#material = new MeshStandardMaterial({ color: '#ffffff' });
    this.#mesh = new Mesh(geometry, this.#material);
    this.#mesh.rotation.x = -Math.PI / 2;
    this.#mesh.receiveShadow = true;
    scene.add(this.#mesh);

    new TextureLoader().load(GROUND_TEXTURE_URL, (tex) => {
      tex.colorSpace = SRGBColorSpace;
      tex.wrapS = MirroredRepeatWrapping;
      tex.wrapT = MirroredRepeatWrapping;
      tex.repeat.set(GROUND_EXTEND_FACTOR, GROUND_EXTEND_FACTOR);
      this.#material.displacementMap = tex;
      this.#material.displacementScale = GROUND_DISPLACEMENT;
      this.#material.bumpMap = tex;
      this.#material.bumpScale = 1.0;
      this.#material.map = tex;
      this.#material.needsUpdate = true;
    });
  }

  dispose(): void {
    this.#mesh.geometry.dispose();
    this.#material.map?.dispose();
    this.#material.dispose();
  }
}
