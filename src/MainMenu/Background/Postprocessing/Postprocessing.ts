import {
  DepthOfFieldEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  ShaderPass,
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
      multisampling: 0,
    });
    this.#composer = composer;
    const rp = new RenderPass(this.#scene, this.#camera);
    this.#composer.addPass(rp);

    this.#dof = new DepthOfFieldEffect(this.#camera, {
      // bokehScale: 0.7,
      focusRange: 1,
      resolutionScale: 0.5,
    });

    this.#crt = new NoiseEffect(0.18);

    const ep = new EffectPass(this.#camera, this.#dof);
    const ep1 = new ShaderPass(this.#crt, 'uInput');
    this.#composer.addPass(ep);
    this.#composer.addPass(ep1);
  }

  resize(w: number, h: number) {
    this.#composer.setSize(w, h);
  }

  render(deltaTime: number) {
    this.#crt.update(deltaTime);
    this.#composer.render();
  }
}
