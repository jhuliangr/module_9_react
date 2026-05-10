import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  PCFShadowMap,
  Mesh,
} from 'three';
import Stats from 'stats.js';

export abstract class CanvasRenderer {
  protected gl!: WebGLRenderer;
  protected camera!: PerspectiveCamera;
  protected scene!: Scene;
  #stats!: Stats;
  #rafId: number | null = null;
  #disposed: boolean = false;
  #debug = Boolean(import.meta.env.VITE_DEBUG == 1);

  constructor() {
    this.#init();
    this.#initEvents();
  }
  async #init() {
    this.gl = new WebGLRenderer({
      canvas: document.querySelector('#three')!,
      antialias: true,
    });
    this.gl.setSize(window.innerWidth, window.innerHeight);
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = PCFShadowMap;
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new PerspectiveCamera(50, aspect, 0.1, 100);
    this.camera.position.z = 3;
    this.scene = new Scene();

    this.#stats = new Stats();
    if (this.#debug) {
      document.body.appendChild(this.#stats.dom);
    }
  }

  protected update?(): void;

  #animate() {
    if (this.#disposed) return;
    if (this.#debug) {
      this.#stats.begin();
    }
    this.gl.render(this.scene, this.camera);
    this.update?.();
    if (this.#debug) {
      this.#stats.end();
    }
    this.#rafId = window.requestAnimationFrame(this.#animate.bind(this));
  }

  protected start() {
    this.#animate();
  }

  #initEvents() {
    window.addEventListener('resize', this.#resize);
  }

  #resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;

    this.gl.setSize(w, h);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  };
  updateCamera() {
    return this.camera;
  }
  dispose() {
    this.#disposed = true;
    if (this.#rafId !== null) cancelAnimationFrame(this.#rafId);
    window.removeEventListener('resize', this.#resize);
    this.#stats.dom.remove();
    this.gl.clear();
    this.gl.dispose();
    this.scene.traverse((obj) => {
      if ('geometry' in obj) (obj as Mesh).geometry?.dispose();
      const mat = (obj as Mesh).material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
  }
}
