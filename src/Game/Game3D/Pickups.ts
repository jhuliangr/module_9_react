import {
  Mesh,
  MeshStandardMaterial,
  Object3D,
  type Scene,
  SphereGeometry,
  SpotLight,
  type Vector3,
} from 'three';
import type { Pickup } from '#shared/services/websocket';
import { worldToScene } from './coords';

const PICKUP_HEIGHT = 1.5;
export const PICKUP_RADIUS = 0.2;
const PICKUP_COLOR = 0x22ff66;
const PICKUP_LIGHT_INTENSITY = 116;
const PICKUP_LIGHT_DISTANCE = 8;
const PICKUP_LIGHT_ANGLE = Math.PI / 2;
const PICKUP_LIGHT_PENUMBRA = 0.5;
const PICKUP_LIGHT_DECAY = 1.5;

interface PickupEntity {
  group: Object3D;
}

export class Pickups {
  #scene: Scene;
  #entities: Map<string, PickupEntity> = new Map();
  #geometry: SphereGeometry;
  #material: MeshStandardMaterial;

  constructor(scene: Scene) {
    this.#scene = scene;
    this.#geometry = new SphereGeometry(PICKUP_RADIUS, 16, 12);
    this.#material = new MeshStandardMaterial({
      color: PICKUP_COLOR,
      emissive: PICKUP_COLOR,
      emissiveIntensity: 1.5,
    });
  }

  update(pickups: Pickup[]): void {
    const ids = new Set(pickups.map((p) => p.id));
    for (const id of this.#entities.keys()) {
      if (!ids.has(id)) this.#remove(id);
    }
    for (const p of pickups) {
      const { x, z } = worldToScene(p.x, p.y);
      this.#upsert(p.id, x, z);
    }
  }

  fillActivePositions(target: Vector3[]): number {
    let count = 0;
    for (const entity of this.#entities.values()) {
      const dst = target[count];
      if (dst) dst.copy(entity.group.position);
      count++;
    }
    return count;
  }

  dispose(): void {
    for (const id of [...this.#entities.keys()]) this.#remove(id);
    this.#geometry.dispose();
    this.#material.dispose();
  }

  #upsert(id: string, x: number, z: number): void {
    let entity = this.#entities.get(id);
    if (!entity) {
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
