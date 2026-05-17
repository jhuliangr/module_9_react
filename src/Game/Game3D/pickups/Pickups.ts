import {
  Color,
  Mesh,
  MirroredRepeatWrapping,
  Object3D,
  type Scene,
  ShaderMaterial,
  SphereGeometry,
  SpotLight,
  type Texture,
} from 'three';
import type { Pickup } from '#shared/services/websocket';
import { resources } from '#shared/renderer/resources';
import { worldToScene } from '../coords';
import frag from './shaders/frag';
import vertex from './shaders/vertex';

const PICKUP_HEIGHT = 1.5;
const PICKUP_RADIUS = 0.2;
const PICKUP_COLOR = 0x22ff66;
const PICKUP_LIGHT_INTENSITY = 116;
const PICKUP_LIGHT_DISTANCE = 8;
const PICKUP_LIGHT_ANGLE = Math.PI / 2;
const PICKUP_LIGHT_PENUMBRA = 0.5;
const PICKUP_LIGHT_DECAY = 1.5;

export class Pickups {
  #scene: Scene;
  // It's named entities because I want to do some item dropping in the future.
  #entities: Map<string, { group: Object3D }> = new Map();
  #geometry: SphereGeometry;
  #material: ShaderMaterial;

  constructor(scene: Scene) {
    this.#scene = scene;
    this.#geometry = new SphereGeometry(PICKUP_RADIUS, 48, 32);

    // Loading the texture for applying displacement in the sphere
    const noise = resources.get('noise_cloudy') as Texture;
    noise.wrapS = MirroredRepeatWrapping;
    noise.wrapT = MirroredRepeatWrapping;

    this.#material = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(PICKUP_COLOR) },
        uNoiseTxt: { value: noise },
      },
      vertexShader: vertex,
      fragmentShader: frag,
    });
  }

  update(pickups: Pickup[], now: number): void {
    // Turning time to seconds
    this.#material.uniforms.uTime.value = now / 1000;

    const ids = new Set(pickups.map((p) => p.id));
    // removing taken pickups from the visible area
    for (const id of this.#entities.keys()) {
      if (!ids.has(id)) this.#remove(id);
    }
    // displaying pickups in their respective map positions
    for (const p of pickups) {
      const { x, z } = worldToScene(p.x, p.y);
      this.#upsert(p.id, x, z);
    }
  }

  dispose(): void {
    for (const id of [...this.#entities.keys()]) this.#remove(id);
    this.#geometry.dispose();
    this.#material.dispose();
  }

  #upsert(id: string, x: number, z: number): void {
    let entity = this.#entities.get(id);
    if (!entity) {
      // I'm using a group because it makes it easier to set their position together
      const group = new Object3D();
      const mesh = new Mesh(this.#geometry, this.#material);
      const light = new SpotLight(
        PICKUP_COLOR,
        PICKUP_LIGHT_INTENSITY,
        PICKUP_LIGHT_DISTANCE,
        PICKUP_LIGHT_ANGLE,
        PICKUP_LIGHT_PENUMBRA,
        PICKUP_LIGHT_DECAY,
      );
      // Auxiliar for the light direction to be the floor
      const target = new Object3D();
      target.position.set(0, -1, 0);
      light.target = target;
      group.add(mesh, light, target);
      this.#scene.add(group);
      entity = { group };
      this.#entities.set(id, entity);
    }
    entity.group.position.set(x, PICKUP_HEIGHT, z);
  }

  #remove(id: string): void {
    const entity = this.#entities.get(id);
    if (!entity) return;
    this.#scene.remove(entity.group);
    this.#entities.delete(id);
  }
}
