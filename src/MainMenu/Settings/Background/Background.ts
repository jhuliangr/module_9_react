import {
  Color,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Timer,
  Vector2,
  Vector4,
} from 'three';
import { CanvasRenderer } from '../../../shared/renderer/canvasRenderer';
import fragShader from './shaders/frag';
import vertexShader from './shaders/vertex';

const PLANE_Z = -2;
const SEGMENTS = 200;
const MOUSE_LERP = 0.08;
const MAX_RIPPLES = 32;
const SPAWN_INTERVAL_MS = 90;
const SPAWN_MIN_DIST = 0.012;

export class SettingsBackground extends CanvasRenderer {
  #disposed = false;
  #clock: Timer;
  #plane: Mesh | null = null;
  #firstMove = true;
  #ripples = Array.from(
    { length: MAX_RIPPLES },
    () => new Vector4(0, 0, -1, 0),
  );
  #rippleCursor = -1;
  #lastSpawnMs = -Infinity;
  #lastSpawnPos = new Vector2(-1, -1);
  #uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new Vector2(0.5, 0.5) },
    uAspect: { value: 1 },
    uColor: { value: new Color('#5e8a3a') },
    uClickColor: { value: new Color('#e0c83b') },
    uNoise: { value: 0.22 },
    uRipples: { value: this.#ripples },
  };
  #targetMouse = new Vector2(0.5, 0.5);
  #currentMouse = new Vector2(0.5, 0.5);

  constructor() {
    super();
    this.#clock = new Timer();
    this.scene.background = new Color('#000000');
    this.gl.setClearColor(new Color('#000000'), 1);
    this.#uniforms.uAspect.value = this.camera.aspect;
    this.#initScene();
    this.#initEvents();
    this.#clock.reset();
    this.start();
  }

  #initScene() {
    if (this.#disposed) return;
    const geometry = new PlaneGeometry(1, 1, SEGMENTS, SEGMENTS);
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader: fragShader,
      transparent: false,
      uniforms: this.#uniforms,
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.z = PLANE_Z;
    this.#plane = mesh;
    this.#sizePlane();
    this.scene.add(mesh);
  }

  #sizePlane() {
    if (!this.#plane) return;
    const distance = this.camera.position.z - PLANE_Z;
    const visibleHeight =
      2 * distance * Math.tan((this.camera.fov * Math.PI) / 360);
    const visibleWidth = visibleHeight * this.camera.aspect;
    this.#plane.scale.set(visibleWidth, visibleHeight, 1);
  }

  #spawnRipple(x: number, y: number, colorMix: number) {
    this.#rippleCursor = (this.#rippleCursor + 1) % MAX_RIPPLES;
    this.#ripples[this.#rippleCursor].set(
      x,
      y,
      this.#clock.getElapsed(),
      colorMix,
    );
  }

  #toUv(e: MouseEvent) {
    return {
      ux: e.clientX / window.innerWidth,
      uy: 1 - e.clientY / window.innerHeight,
    };
  }

  #onMouseMove = (e: MouseEvent) => {
    const { ux, uy } = this.#toUv(e);
    this.#targetMouse.set(ux, uy);
    if (this.#firstMove) {
      this.#currentMouse.copy(this.#targetMouse);
      this.#firstMove = false;
    }
    const now = performance.now();
    const dx = ux - this.#lastSpawnPos.x;
    const dy = uy - this.#lastSpawnPos.y;
    const moved = Math.hypot(dx, dy) > SPAWN_MIN_DIST;
    if (now - this.#lastSpawnMs > SPAWN_INTERVAL_MS && moved) {
      this.#spawnRipple(ux, uy, 0);
      this.#lastSpawnMs = now;
      this.#lastSpawnPos.set(ux, uy);
    }
  };

  #onMouseDown = (e: MouseEvent) => {
    const { ux, uy } = this.#toUv(e);
    this.#spawnRipple(ux, uy, 1);
  };

  protected override onResize(): void {
    this.#sizePlane();
    this.#uniforms.uAspect.value = this.camera.aspect;
  }

  #initEvents() {
    window.addEventListener('mousemove', this.#onMouseMove);
    window.addEventListener('mousedown', this.#onMouseDown);
  }

  override dispose(): void {
    this.#disposed = true;
    window.removeEventListener('mousemove', this.#onMouseMove);
    window.removeEventListener('mousedown', this.#onMouseDown);
    super.dispose();
  }

  protected update(): void {
    this.#clock.update();
    this.#currentMouse.lerp(this.#targetMouse, MOUSE_LERP);
    this.#uniforms.uMouse.value.copy(this.#currentMouse);
    this.#uniforms.uTime.value = this.#clock.getElapsed();
    this.gl.render(this.scene, this.camera);
  }
}
