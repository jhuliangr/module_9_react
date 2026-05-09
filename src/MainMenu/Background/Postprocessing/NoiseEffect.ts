import { BlendFunction, Effect } from 'postprocessing';
import { Uniform, type WebGLRenderer, type WebGLRenderTarget } from 'three';
import fragShader from './shaders/frag';

export interface NoiseOptions {
  noise?: number;
}

export class NoiseEffect extends Effect {
  constructor({ noise }: NoiseOptions = {}) {
    super('NoiseEffect', fragShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ['uTime', new Uniform(0)],
        ['uNoise', new Uniform(noise)],
      ]),
    });
  }

  override update(
    _renderer: WebGLRenderer,
    _input: WebGLRenderTarget,
    deltaTime: number,
  ) {
    const u = this.uniforms.get('uTime');
    if (u) u.value += deltaTime;
  }
}
