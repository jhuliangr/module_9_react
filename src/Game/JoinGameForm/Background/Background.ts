import {
  Color,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Texture,
  Timer,
} from 'three';
import { CanvasRenderer } from '#shared/renderer';
import { resources } from '#shared/renderer/resources';
import { Postprocessing } from './Postprocessing';
import { Fireflies } from './fireflies';

const TEXTURE_ASPECT = 314 / 209;
const BG_Z = -4;
const FG_Z = -0;
const PARALLAX_X = 0.05;
const PARALLAX_Y = 0.15;
const LERP = 0.06;
const TILT_RANGE_DEG = 25;

type DeviceOrientationEventStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

export class JoinGameBackground extends CanvasRenderer {
  #disposed = false;
  #targetCamX = 0;
  #targetCamY = 0;
  #planes: { mesh: Mesh; z: number }[] = [];
  #composer: Postprocessing;
  #clock: Timer;
  #fireflies: Fireflies | null = null;

  constructor() {
    super();

    this.#clock = new Timer();
    this.scene.background = new Color('#0a0a0a');
    this.#composer = new Postprocessing({
      gl: this.gl,
      scene: this.scene,
      camera: this.camera,
    });
    this.#initScene();
    this.#initEvents();

    this.#clock.reset();
    this.start();
  }
  async #initScene() {
    if (this.#disposed) return;
    await resources.load();

    this.#addParallaxPlane('main_menu_bg', BG_Z, false);
    this.#addParallaxPlane('main_menu_fg', FG_Z, true);

    this.#fireflies = new Fireflies(700);
    this.scene.add(this.#fireflies);
  }

  #addParallaxPlane(key: string, z: number, transparent: boolean) {
    const tex = resources.get(key) as Texture;
    const mesh = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        map: tex,
        transparent,
        depthWrite: !transparent,
      }),
    );
    mesh.position.z = z;
    this.#planes.push({ mesh, z });
    this.#sizePlane(mesh, z);
    this.scene.add(mesh);
  }

  #sizePlane(mesh: Mesh, z: number) {
    const distance = this.camera.position.z - z;
    const visibleHeight =
      2 * distance * Math.tan((this.camera.fov * Math.PI) / 360);
    const visibleWidth = visibleHeight * this.camera.aspect;
    const margin = 1.1;
    let width: number;
    let height: number;
    if (visibleWidth / visibleHeight > TEXTURE_ASPECT) {
      width = visibleWidth * margin;
      height = width / TEXTURE_ASPECT;
    } else {
      height = visibleHeight * margin;
      width = height * TEXTURE_ASPECT;
    }
    mesh.scale.set(width, height, 1);
  }

  #onMouseMove = (e: MouseEvent) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    this.#targetCamX = nx * PARALLAX_X;
    this.#targetCamY = -ny * PARALLAX_Y;
  };

  #orientationBaseline: { beta: number; gamma: number } | null = null;

  #onOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    if (!this.#orientationBaseline) {
      this.#orientationBaseline = { beta: e.beta, gamma: e.gamma };
      return;
    }
    const dGamma = e.gamma - this.#orientationBaseline.gamma;
    const dBeta = e.beta - this.#orientationBaseline.beta;
    const nx = Math.max(-1, Math.min(1, dGamma / TILT_RANGE_DEG));
    const ny = Math.max(-1, Math.min(1, dBeta / TILT_RANGE_DEG));
    this.#targetCamX = nx * PARALLAX_X;
    this.#targetCamY = -ny * PARALLAX_Y;
  };

  #initOrientation() {
    const Ctor = window.DeviceOrientationEvent as
      | DeviceOrientationEventStatic
      | undefined;
    if (!Ctor) return;
    if (typeof Ctor.requestPermission === 'function') {
      const requestOnGesture = async () => {
        try {
          const result = await Ctor.requestPermission!();
          if (result === 'granted')
            window.addEventListener('deviceorientation', this.#onOrientation);
        } catch {
          /* user denied or unavailable */
        }
      };
      window.addEventListener('touchend', requestOnGesture, { once: true });
      window.addEventListener('click', requestOnGesture, { once: true });
    } else {
      window.addEventListener('deviceorientation', this.#onOrientation);
    }
  }

  protected override onResize(w: number, h: number): void {
    for (const { mesh, z } of this.#planes) this.#sizePlane(mesh, z);
    this.#composer.resize(w, h);
  }

  #initEvents() {
    window.addEventListener('mousemove', this.#onMouseMove);
    this.#initOrientation();
  }

  override dispose(): void {
    this.#disposed = true;
    window.removeEventListener('mousemove', this.#onMouseMove);
    window.removeEventListener('deviceorientation', this.#onOrientation);
    this.#composer.dispose();
    super.dispose();
  }

  protected update(): void {
    this.#clock.update();
    this.camera.position.x +=
      (this.#targetCamX - this.camera.position.x) * LERP;
    this.camera.position.y +=
      (this.#targetCamY - this.camera.position.y) * LERP;
    this.camera.lookAt(0, 0, 0);
    const elapsed = this.#clock.getElapsed();
    this.#fireflies?.update(elapsed);
    this.#composer.render(this.#clock.getDelta());
  }
}
