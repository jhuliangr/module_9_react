import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from 'postprocessing';
import {
  MirroredRepeatWrapping,
  type Camera,
  type Scene,
  type Texture,
  type WebGLRenderer,
} from 'three';
import { resources } from '#shared/renderer/resources';

export class Postprocessing {
  #composer: EffectComposer;

  constructor({
    gl,
    camera,
    scene,
  }: {
    gl: WebGLRenderer;
    scene: Scene;
    camera: Camera;
  }) {
    this.#composer = new EffectComposer(gl, { multisampling: 0 });
    this.#composer.addPass(new RenderPass(scene, camera));

    const bloom = new BloomEffect({
      intensity: 2.0,
      luminanceThreshold: 0.6,
      luminanceSmoothing: 0.3,
      mipmapBlur: true,
      radius: 0.7,
    });
    this.#composer.addPass(new EffectPass(camera, bloom));
    const noise = resources.get('noise_cloudy') as Texture;
    noise.wrapS = MirroredRepeatWrapping;
    noise.wrapT = MirroredRepeatWrapping;
  }

  resize(w: number, h: number) {
    this.#composer.setSize(w, h);
  }

  render() {
    this.#composer.render();
  }

  dispose() {
    this.#composer.dispose();
  }
}
