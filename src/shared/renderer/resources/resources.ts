import {
  SRGBColorSpace,
  Texture,
  TextureLoader,
  type TextureEventMap,
} from 'three';
import {
  GLTFLoader,
  type GLTF,
} from 'three/examples/jsm/loaders/GLTFLoader.js';

const ASSETS = [
  {
    key: 'rogue_dagger',
    type: 'gltf',
    path: `${import.meta.env.BASE_URL}assets/webgl/3D_models/rogue_dagger/scene.gltf`,
  },
  {
    key: 'main_menu_bg',
    type: 'texture',
    path: `${import.meta.env.BASE_URL}assets/webgl/textures/background.png`,
  },
  {
    key: 'main_menu_fg',
    type: 'texture',
    path: `${import.meta.env.BASE_URL}assets/webgl/textures/first_plane.png`,
  },
];

export class Resources {
  #resources: Map<string, GLTF | Texture<HTMLImageElement, TextureEventMap>>;
  #loaders: {
    gltf: GLTFLoader;
    textureLoader: TextureLoader;
  };
  #loadPromise: Promise<void> | null = null;
  constructor() {
    this.#resources = new Map();
    this.#loaders = {
      gltf: new GLTFLoader(),
      textureLoader: new TextureLoader(),
    };
  }
  load(): Promise<void> {
    if (this.#loadPromise) return this.#loadPromise;
    const promises = ASSETS.map((asset) => {
      if (asset.type === 'gltf') {
        return new Promise<void>((res, rej) => {
          this.#loaders.gltf.load(
            asset.path,
            (model) => {
              this.#resources.set(asset.key, model);
              res();
            },
            undefined,
            (err) => rej(new Error(`Failed to load ${asset.path}: ${err}`)),
          );
        });
      } else if (asset.type === 'texture') {
        return new Promise<void>((res, rej) => {
          this.#loaders.textureLoader.load(
            asset.path,
            (texture) => {
              texture.colorSpace = SRGBColorSpace;
              this.#resources.set(asset.key, texture);
              res();
            },
            undefined,
            (err) => rej(new Error(`Failed to load ${asset.path}: ${err}`)),
          );
        });
      }
      return Promise.resolve();
    });
    this.#loadPromise = Promise.all(promises).then(() => undefined);
    return this.#loadPromise;
  }

  get(model: string) {
    return this.#resources.get(model);
  }
}
