import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  FogExp2,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
} from 'three';
import { CanvasRenderer } from '#shared/renderer';
import { useGameStore } from '#shared/stores';
import { clockSync } from '#shared/services/clock-sync';
import { predictionEngine } from '../engine/predictionEngine';
import { snapshotInterpolator } from '../engine/snapshotInterpolator';
import { WORLD_SIZE } from '../utils';

const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.5;
const CAMERA_DISTANCE = 7;
const WORLD_SCALE = 0.05;
const MOUSE_SENSITIVITY = 0.0025;
const PITCH_MAX = 1.2;
const HEAD_HEIGHT = PLAYER_HEIGHT * 0.85;
const MIN_CAMERA_Y = 0.3;
const PITCH_MIN = Math.asin((MIN_CAMERA_Y - HEAD_HEIGHT) / CAMERA_DISTANCE);
const REMOTE_SNAP_THRESHOLD = 80;

interface PlayerRig {
  group: Mesh;
}

export class Game3DRenderer extends CanvasRenderer {
  #ground: Mesh;
  #rigs: Map<string, PlayerRig> = new Map();
  #lookTarget = new Vector3();
  #camTarget = new Vector3();
  #yaw = 0;
  #pitch = 0.5;

  constructor() {
    super();
    const fogColor = new Color('#0a0a0a');
    this.scene.background = fogColor;
    this.scene.fog = new FogExp2(fogColor, 0.08);

    const worldUnits = WORLD_SIZE * WORLD_SCALE;
    this.#ground = new Mesh(
      new PlaneGeometry(worldUnits, worldUnits),
      new MeshStandardMaterial({ color: 'green' }),
    );
    this.#ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.#ground);

    this.scene.add(new AmbientLight('#ffffff', 0.4));
    const sun = new DirectionalLight('#ffffff', 1.0);
    sun.position.set(10, 20, 10);
    this.scene.add(sun);

    this.camera.position.set(0, HEAD_HEIGHT, CAMERA_DISTANCE);
    this.camera.lookAt(0, HEAD_HEIGHT, 0);

    document.addEventListener('mousemove', this.#onMouseMove);

    this.start();
  }

  requestPointerLock() {
    const canvas = this.gl.domElement;
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  }

  getYaw() {
    return this.#yaw;
  }

  #onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== this.gl.domElement) return;
    this.#yaw -= e.movementX * MOUSE_SENSITIVITY;
    this.#pitch -= -e.movementY * MOUSE_SENSITIVITY;
    if (this.#pitch < PITCH_MIN) this.#pitch = PITCH_MIN;
    if (this.#pitch > PITCH_MAX) this.#pitch = PITCH_MAX;
  };

  #worldToScene(x: number, y: number): { x: number; z: number } {
    const half = (WORLD_SIZE * WORLD_SCALE) / 2;
    return {
      x: x * WORLD_SCALE - half,
      z: y * WORLD_SCALE - half,
    };
  }

  #upsertRig(id: string, color: number): PlayerRig {
    let rig = this.#rigs.get(id);
    if (!rig) {
      const group = new Mesh(
        new BoxGeometry(PLAYER_RADIUS * 2, PLAYER_HEIGHT, PLAYER_RADIUS * 2),
        new MeshStandardMaterial({ color }),
      );
      group.position.y = PLAYER_HEIGHT / 2;
      this.scene.add(group);
      rig = { group };
      this.#rigs.set(id, rig);
    }
    return rig;
  }

  #removeRig(id: string) {
    const rig = this.#rigs.get(id);
    if (!rig) return;
    this.scene.remove(rig.group);
    rig.group.geometry.dispose();
    (rig.group.material as MeshStandardMaterial).dispose();
    this.#rigs.delete(id);
    snapshotInterpolator.drop(id);
  }

  protected override update(): void {
    const { players, myPlayerId } = useGameStore.getState();

    for (const id of this.#rigs.keys()) {
      if (!players[id]) this.#removeRig(id);
    }

    const renderTime = clockSync.getServerTime() - clockSync.getInterpDelay();
    let mePos: { x: number; z: number } | null = null;

    for (const p of Object.values(players)) {
      const isMe = p.id === myPlayerId;
      const rig = this.#upsertRig(p.id, isMe ? 0x4cd2ff : 0xff8a4c);

      let worldPos: { x: number; y: number };
      if (isMe) {
        worldPos = predictionEngine.getLocalRenderedPosition({
          x: p.x,
          y: p.y,
        }) ?? {
          x: p.x,
          y: p.y,
        };
      } else {
        const interpolated = snapshotInterpolator.getRenderPosition(
          p.id,
          renderTime,
          { x: p.x, y: p.y },
        );
        const gap = Math.hypot(p.x - interpolated.x, p.y - interpolated.y);
        worldPos =
          gap > REMOTE_SNAP_THRESHOLD ? { x: p.x, y: p.y } : interpolated;
      }

      const scenePos = this.#worldToScene(worldPos.x, worldPos.y);
      rig.group.position.x = scenePos.x;
      rig.group.position.z = scenePos.z;
      if (isMe) mePos = scenePos;
    }

    if (mePos) {
      const cosP = Math.cos(this.#pitch);
      const offsetX = Math.sin(this.#yaw) * cosP * CAMERA_DISTANCE;
      const offsetY = Math.sin(this.#pitch) * CAMERA_DISTANCE;
      const offsetZ = Math.cos(this.#yaw) * cosP * CAMERA_DISTANCE;

      this.#lookTarget.set(mePos.x, HEAD_HEIGHT, mePos.z);
      this.#camTarget.set(
        mePos.x + offsetX,
        HEAD_HEIGHT + offsetY,
        mePos.z + offsetZ,
      );
      this.camera.position.copy(this.#camTarget);
      this.camera.lookAt(this.#lookTarget);
    }

    this.gl.render(this.scene, this.camera);
  }

  override dispose(): void {
    const canvas = this.gl.domElement;
    document.removeEventListener('mousemove', this.#onMouseMove);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    for (const id of [...this.#rigs.keys()]) this.#removeRig(id);
    super.dispose();
  }
}
