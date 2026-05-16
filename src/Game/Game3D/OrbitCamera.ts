import { type PerspectiveCamera, Vector3 } from 'three';

const PLAYER_HEIGHT = 1.8;
const CAMERA_DISTANCE = 7;
const MOUSE_SENSITIVITY = 0.0025;
const PITCH_MAX = 1.2;
const HEAD_HEIGHT = PLAYER_HEIGHT * 0.85;
const MIN_CAMERA_Y = 0.3;
const PITCH_MIN = Math.asin((MIN_CAMERA_Y - HEAD_HEIGHT) / CAMERA_DISTANCE);

export class OrbitCamera {
  #camera: PerspectiveCamera;
  #canvas: HTMLCanvasElement;
  #yaw = 0;
  #pitch = 0.5;
  #lookTarget = new Vector3();
  #camTarget = new Vector3();

  constructor(camera: PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.#camera = camera;
    this.#canvas = canvas;
    this.#camera.position.set(0, HEAD_HEIGHT, CAMERA_DISTANCE);
    this.#camera.lookAt(0, HEAD_HEIGHT, 0);
    document.addEventListener('mousemove', this.#onMouseMove);
  }

  requestPointerLock(): void {
    if (document.pointerLockElement !== this.#canvas) {
      this.#canvas.requestPointerLock();
    }
  }

  getYaw(): number {
    return this.#yaw;
  }

  update(target: { x: number; z: number } | null): void {
    if (!target) return;
    const cosP = Math.cos(this.#pitch);
    const offsetX = Math.sin(this.#yaw) * cosP * CAMERA_DISTANCE;
    const offsetY = Math.sin(this.#pitch) * CAMERA_DISTANCE;
    const offsetZ = Math.cos(this.#yaw) * cosP * CAMERA_DISTANCE;
    this.#lookTarget.set(target.x, HEAD_HEIGHT, target.z);
    this.#camTarget.set(
      target.x + offsetX,
      HEAD_HEIGHT + offsetY,
      target.z + offsetZ,
    );
    this.#camera.position.copy(this.#camTarget);
    this.#camera.lookAt(this.#lookTarget);
  }

  dispose(): void {
    document.removeEventListener('mousemove', this.#onMouseMove);
    if (document.pointerLockElement === this.#canvas) {
      document.exitPointerLock();
    }
  }

  #onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== this.#canvas) return;
    this.#yaw -= e.movementX * MOUSE_SENSITIVITY;
    this.#pitch -= -e.movementY * MOUSE_SENSITIVITY;
    if (this.#pitch < PITCH_MIN) this.#pitch = PITCH_MIN;
    if (this.#pitch > PITCH_MAX) this.#pitch = PITCH_MAX;
  };
}
