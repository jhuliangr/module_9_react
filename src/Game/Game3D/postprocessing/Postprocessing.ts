import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
} from 'postprocessing';
import { type Camera, type Scene, type WebGLRenderer } from 'three';

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
    const smaa = new SMAAEffect({ preset: SMAAPreset.HIGH });
    this.#composer.addPass(new EffectPass(camera, bloom, smaa));
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
