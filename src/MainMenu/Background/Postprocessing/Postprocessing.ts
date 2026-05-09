import {
  DepthOfFieldEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from 'postprocessing';
import { type Camera, type Scene, type WebGLRenderer } from 'three';
import { NoiseEffect } from './NoiseEffect';

export class Postprocessing {
  #gl;
  #composer: EffectComposer;
  #scene: Scene;
  #camera: Camera;
  #dof: DepthOfFieldEffect;
  #crt: NoiseEffect;

  constructor({
    gl,
    camera,
    scene,
  }: {
    gl: WebGLRenderer;
    scene: Scene;
    camera: Camera;
  }) {
    this.#gl = gl;
    this.#scene = scene;
    this.#camera = camera;

    const composer = new EffectComposer(this.#gl, {
      multisampling: Math.min(4, this.#gl.capabilities.maxSamples ?? 0),
    });
    this.#composer = composer;
    const rp = new RenderPass(this.#scene, this.#camera);
    this.#composer.addPass(rp);

    this.#dof = new DepthOfFieldEffect(this.#camera, {
      bokehScale: 0.7,
      focusRange: 1,
    });

    this.#crt = new NoiseEffect({ noise: 0.18 });

    const ep = new EffectPass(this.#camera, this.#dof);
    const ep1 = new EffectPass(this.#camera, this.#crt);
    this.#composer.addPass(ep);
    this.#composer.addPass(ep1);

    this.#initUI();
  }

  resize(w: number, h: number) {
    this.#composer.setSize(w, h);
  }

  render() {
    this.#composer.render();
  }
  #initUI() {
    window.addEventListener('mousemove', () => {
      // get mouse coords
      // const x = (e.clientX / window.innerWidth) * 2.0 - 1;
      // const y = ((e.clientY / window.innerHeight) * 2.0 - 1) * -1;
      // this.#cae.offset.x = x * -0.1;
      // this.#cae.offset.y = y * -0.1;
      // this.#pe.granularity = Math.abs(x) * 10;
    });
  }
}
