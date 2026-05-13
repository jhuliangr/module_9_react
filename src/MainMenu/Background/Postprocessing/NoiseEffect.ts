import { ShaderMaterial } from 'three';
import fragShader from './shaders/frag';
import vertexShader from './shaders/vertex';

export interface NoiseOptions {
  noise?: number;
}

export class NoiseEffect extends ShaderMaterial {
  constructor(noise: number) {
    super({
      vertexShader: vertexShader,
      fragmentShader: fragShader,
      uniforms: {
        uTime: { value: 0 },
        uNoise: { value: noise },
      },
    });
  }
  update(deltaTime: number) {
    this.uniforms.uTime.value += deltaTime;
  }
}
