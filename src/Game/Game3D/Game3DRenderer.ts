import { AmbientLight, Color, DirectionalLight, FogExp2 } from 'three';
import { CanvasRenderer } from '#shared/renderer';
import { useGameStore } from '#shared/stores';
import { clockSync } from '#shared/services/clock-sync';
import { Ground } from './Ground';
import { OrbitCamera } from './OrbitCamera';
import { Pickups } from './Pickups';
import { PlayerRigs } from './player';
import { Postprocessing } from './postprocessing';

export class Game3DRenderer extends CanvasRenderer {
  #ground: Ground;
  #pickups: Pickups;
  #playerRigs: PlayerRigs;
  #orbitCamera: OrbitCamera;
  #postprocessing: Postprocessing;
  #lastFrameTime = performance.now();

  constructor() {
    super();

    const fogColor = new Color('#0a0a0a');
    this.scene.background = fogColor;
    this.scene.fog = new FogExp2(fogColor, 0.08);

    this.scene.add(new AmbientLight('#ffffff', 0.4));
    const sun = new DirectionalLight('#ffffff', 1.0);
    sun.position.set(10, 20, 10);
    this.scene.add(sun);

    this.#ground = new Ground(this.scene);
    this.#pickups = new Pickups(this.scene);
    this.#playerRigs = new PlayerRigs(this.scene);
    this.#orbitCamera = new OrbitCamera(this.camera, this.gl.domElement);
    this.#postprocessing = new Postprocessing({
      gl: this.gl,
      scene: this.scene,
      camera: this.camera,
    });

    this.start();
  }

  protected override onResize(w: number, h: number): void {
    this.#postprocessing.resize(w, h);
  }

  requestPointerLock(): void {
    this.#orbitCamera.requestPointerLock();
  }

  getYaw(): number {
    return this.#orbitCamera.getYaw();
  }

  triggerAttack(playerId: string, angle: number): void {
    this.#playerRigs.triggerAttack(playerId, angle);
  }

  triggerDot(playerId: string): void {
    this.#playerRigs.triggerDot(playerId);
  }

  protected override update(): void {
    const now = performance.now();
    const dt = (now - this.#lastFrameTime) / 1000;
    this.#lastFrameTime = now;
    const renderTime = clockSync.getServerTime() - clockSync.getInterpDelay();

    const { players, myPlayerId, pickups } = useGameStore.getState();
    this.#pickups.update(pickups);
    const mePos = this.#playerRigs.update(
      players,
      myPlayerId,
      dt,
      now,
      renderTime,
    );
    this.#orbitCamera.update(mePos);

    this.#postprocessing.render();
  }

  override dispose(): void {
    this.#orbitCamera.dispose();
    this.#playerRigs.dispose();
    this.#pickups.dispose();
    this.#ground.dispose();
    this.#postprocessing.dispose();
    super.dispose();
  }
}
