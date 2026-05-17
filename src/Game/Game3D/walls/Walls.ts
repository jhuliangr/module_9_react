import {
  Mesh,
  MirroredRepeatWrapping,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  type Scene,
  type Texture,
  Vector2,
  DoubleSide,
} from 'three';
import { resources } from '#shared/renderer/resources';
import { WORLD_SCALE } from '../coords';
import { WORLD_SIZE } from '#shared/constants';
import vertex from './shaders/vertex';
import frag from './shaders/frag';

const WALL_HEIGHT = 6;
const WALL_OFFSET = 1.5;

export class Walls {
  #group: Object3D;
  #material: ShaderMaterial;
  #geometry: PlaneGeometry;

  constructor(scene: Scene) {
    const walkableUnits = WORLD_SIZE * WORLD_SCALE;
    const half = walkableUnits / 2;
    const perimeterHalf = half + WALL_OFFSET;

    const noise = resources.get('noise_cloudy') as Texture;
    noise.wrapS = MirroredRepeatWrapping;
    noise.wrapT = MirroredRepeatWrapping;

    this.#geometry = new PlaneGeometry(perimeterHalf * 2, WALL_HEIGHT);
    this.#material = new ShaderMaterial({
      side: DoubleSide,
      vertexShader: vertex,
      fragmentShader: frag,
      uniforms: {
        uInput: { value: null },
        uNoiseTxt: { value: noise },
        uTime: { value: 0 },
        uResolution: { value: new Vector2(1, 1) },
      },
    });

    this.#group = new Object3D();
    // A square
    const placements: [number, number, number][] = [
      [0, -perimeterHalf, 0],
      [0, perimeterHalf, Math.PI],
      [perimeterHalf, 0, -Math.PI / 2],
      [-perimeterHalf, 0, Math.PI / 2],
    ];

    for (const [x, z, rotY] of placements) {
      const wall = new Mesh(this.#geometry, this.#material);
      wall.position.set(x, WALL_HEIGHT / 2, z);
      wall.rotation.y = rotY;
      this.#group.add(wall);
    }

    scene.add(this.#group);
  }

  update(now: number): void {
    // converting to seconds for smoother movement
    this.#material.uniforms.uTime.value = now / 1000;
  }

  setSceneTexture(texture: Texture, width: number, height: number): void {
    this.#material.uniforms.uInput.value = texture;
    this.#material.uniforms.uResolution.value.set(width, height);
  }

  setVisible(visible: boolean): void {
    this.#group.visible = visible;
  }

  dispose(): void {
    this.#group.parent?.remove(this.#group);
    this.#geometry.dispose();
    this.#material.dispose();
  }
}
