import {
  AmbientLight,
  Color,
  DirectionalLight,
  FogExp2,
  PCFShadowMap,
  WebGLRenderTarget,
} from 'three';
import { CanvasRenderer } from '#shared/renderer';
import { useGameStore } from '#shared/stores';
import { clockSync } from '#shared/services/clock-sync';
import { Ground } from './Ground';
import { OrbitCamera } from './OrbitCamera';
import { Pickups } from './pickups';
import { PlayerRigs } from './player';
import { Walls } from './walls';
import { Postprocessing } from './postprocessing';

const SUN_OFFSET = { x: 10, y: 20, z: 10 };
const FOG_DENSITY = 0.08;
const FOG_INVISIBLE_THRESHOLD = 0.01;
const FOG_FAR_DISTANCE =
  Math.sqrt(-Math.log(FOG_INVISIBLE_THRESHOLD)) / FOG_DENSITY;
const CAMERA_FAR = FOG_FAR_DISTANCE + 1;

export class Game3DRenderer extends CanvasRenderer {
  #ground: Ground;
  #walls: Walls;
  #pickups: Pickups;
  #playerRigs: PlayerRigs;
  #orbitCamera: OrbitCamera;
  #postprocessing: Postprocessing;
  #sun: DirectionalLight;
  #sceneTarget: WebGLRenderTarget;
  #lastFrameTime = performance.now();

  constructor() {
    super();

    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = PCFShadowMap;
    this.gl.shadowMap.autoUpdate = true;

    const fogColor = new Color(0x0a0a0a);
    this.scene.background = fogColor;
    this.scene.fog = new FogExp2(fogColor, FOG_DENSITY);
    this.camera.far = CAMERA_FAR;
    this.camera.updateProjectionMatrix();

    this.scene.add(new AmbientLight(0xffffff, 0.4));
    const sun = new DirectionalLight(0xffffff, 1.0);
    this.#sun = sun;
    sun.position.set(SUN_OFFSET.x, SUN_OFFSET.y, SUN_OFFSET.z);
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    this.scene.add(sun);
    this.scene.add(sun.target);

    this.#ground = new Ground(this.scene);
    this.#walls = new Walls(this.scene);
    this.#pickups = new Pickups(this.scene);
    this.#playerRigs = new PlayerRigs(this.scene);
    this.#orbitCamera = new OrbitCamera(this.camera, this.gl.domElement);
    this.#postprocessing = new Postprocessing({
      gl: this.gl,
      scene: this.scene,
      camera: this.camera,
    });

    const pixelRatio = this.gl.getPixelRatio();
    this.#sceneTarget = new WebGLRenderTarget(
      window.innerWidth * pixelRatio,
      window.innerHeight * pixelRatio,
    );

    this.start();
  }

  protected override onResize(w: number, h: number): void {
    this.#postprocessing.resize(w, h);
    const pixelRatio = this.gl.getPixelRatio();
    this.#sceneTarget.setSize(w * pixelRatio, h * pixelRatio);
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
    this.#walls.update(now);
    this.#pickups.update(pickups, now);
    const mePos = this.#playerRigs.update(
      players,
      myPlayerId,
      dt,
      now,
      renderTime,
    );
    this.#orbitCamera.update(mePos);

    if (mePos) {
      this.#sun.position.set(
        mePos.x + SUN_OFFSET.x,
        SUN_OFFSET.y,
        mePos.z + SUN_OFFSET.z,
      );
      this.#sun.target.position.set(mePos.x, 0, mePos.z);
      this.#sun.target.updateMatrixWorld();
    }
    this.#distortedGlassEffect();

    this.#postprocessing.render();
  }

  #distortedGlassEffect() {
    // Hide the walls, render the scene to a texture, show the walls
    // again, and in their fragment shader sample the previous screen
    // image with a noise-based offset to create a distorted glass effect.
    this.#walls.setVisible(false);
    this.gl.setRenderTarget(this.#sceneTarget);
    this.gl.render(this.scene, this.camera);
    this.gl.setRenderTarget(null);
    this.#walls.setVisible(true);
    this.#walls.setSceneTexture(
      this.#sceneTarget.texture,
      this.#sceneTarget.width,
      this.#sceneTarget.height,
    );
  }

  override dispose(): void {
    this.#orbitCamera.dispose();
    this.#playerRigs.dispose();
    this.#pickups.dispose();
    this.#walls.dispose();
    this.#ground.dispose();
    this.#postprocessing.dispose();
    this.#sceneTarget.dispose();
    super.dispose();
  }
}
