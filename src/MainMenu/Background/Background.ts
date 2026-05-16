import {
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Texture,
  Timer,
  Vector3,
  type Object3DEventMap,
} from 'three';
import { CanvasRenderer } from '#shared/renderer';
import { resources } from '#shared/renderer/resources';
import type { GLTF } from 'three/examples/jsm/Addons.js';
import { Postprocessing } from './Postprocessing';
import fragShader from './shaders/frag';
import vertexShader from './shaders/vertex';
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

export class MainMenuBackground extends CanvasRenderer {
  #disposed = false;
  #targetCamX = 0;
  #targetCamY = 0;
  #planes: { mesh: Mesh; z: number }[] = [];
  #composer: Postprocessing;
  #clock: Timer;
  #daggerMesh: Group<Object3DEventMap> | null = null;
  #daggerUniforms: { uTime: { value: number } } | null = null;
  #daggerTarget: HTMLElement | null = null;
  #unprojectVec = new Vector3();
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

    const { scene: rogueDagger } = resources.get('rogue_dagger') as GLTF;
    this.#daggerMesh = rogueDagger;
    this.#daggerMesh.scale.set(0.2, 0.2, 0.2);
    this.#daggerMesh.position.set(0.03, 0.14, 0);
    this.#daggerMesh.rotation.set(1, 0, 1.57);

    const sharedUniforms = {
      uTime: { value: 0 },
      uBrightness: { value: 1.0 },
      uScanColor: { value: new Color('#9ed8ff') },
      uScanIntensity: { value: 1.0 },
      uScanWidth: { value: 0.06 },
      uScanSpeed: { value: 0.4 },
      uScanRange: { value: 0.8 },
      uScanCenter: { value: this.#daggerMesh.position.y },
    };
    this.#daggerUniforms = sharedUniforms;

    const materialCache = new Map<string, ShaderMaterial>();
    this.#daggerMesh.traverse((obj) => {
      const m = obj as Mesh;
      if (!m.isMesh) return;
      if (!m.userData.originalMaterial) {
        m.userData.originalMaterial = m.material;
      }
      const orig = m.userData.originalMaterial as {
        map?: Texture | null;
        color?: Color;
      };
      const key = `${orig?.map?.uuid ?? 'none'}:${orig?.color?.getHexString() ?? 'fff'}`;
      let mat = materialCache.get(key);
      if (!mat) {
        mat = new ShaderMaterial({
          vertexShader,
          fragmentShader: fragShader,
          transparent: true,
          uniforms: {
            ...sharedUniforms,
            uMap: { value: orig?.map ?? null },
            uHasMap: { value: orig?.map ? 1.0 : 0.0 },
            uColor: {
              value: orig?.color ?? new Color(0xffffff),
            },
          },
        });
        materialCache.set(key, mat);
      }
      m.material = mat;
    });

    this.#fireflies = new Fireflies(700);
    this.scene.add(this.#daggerMesh, this.#fireflies);
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
  setDaggerTarget(el: HTMLElement | null) {
    this.#daggerTarget = el;
  }

  #syncDaggerToTarget(): void {
    if (!this.#daggerMesh || !this.#daggerTarget) return;
    const rect = this.#daggerTarget.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    // Normalize to 0-1
    const ndcX = ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1;
    const ndcY = -(((rect.top + rect.height / 2) / window.innerHeight) * 2 - 1);

    const v = this.#unprojectVec.set(ndcX, ndcY, 0.5).unproject(this.camera);
    v.sub(this.camera.position);
    if (Math.abs(v.z) < 1e-6) return;
    const t = -this.camera.position.z / v.z;
    this.#daggerMesh.position.set(
      this.camera.position.x + v.x * t,
      this.camera.position.y + v.y * t,
      0,
    );
  }

  protected update(): void {
    this.#clock.update();
    this.camera.position.x +=
      (this.#targetCamX - this.camera.position.x) * LERP;
    this.camera.position.y +=
      (this.#targetCamY - this.camera.position.y) * LERP;
    this.camera.lookAt(0, 0, 0);
    this.#syncDaggerToTarget();
    const elapsed = this.#clock.getElapsed();
    if (this.#daggerUniforms) this.#daggerUniforms.uTime.value = elapsed;
    this.#fireflies?.update(elapsed);
    this.#composer.render(this.#clock.getDelta());
  }
}
