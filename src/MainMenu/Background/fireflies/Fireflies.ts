import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  Points,
  ShaderMaterial,
} from 'three';
import vertex from './shaders/vertex';
import frag from './shaders/frag';

export class Fireflies extends Points {
  #uniforms = {
    uTime: { value: 0 },
    uPixelRatio: {
      value: Math.min(window.devicePixelRatio, 1.5),
    },
    uColor: { value: new Color('#d8ff8e') },
  };

  constructor(amount: number) {
    super();
    this.#init(amount);
  }

  #init(amount: number) {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(amount * 3);
    const randoms = new Float32Array(amount);

    for (let i = 0; i < amount; i++) {
      positions[i * 3 + 0] = MathUtils.randFloat(-5, 5);
      positions[i * 3 + 1] = MathUtils.randFloat(-3, 3);
      positions[i * 3 + 2] = MathUtils.randFloat(-3, 0.5);
      randoms[i] = Math.random();
    }

    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('aRandom', new BufferAttribute(randoms, 1));

    this.geometry = geometry;
    this.material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: frag,
      uniforms: this.#uniforms,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
  }

  update(elapsed: number) {
    this.#uniforms.uTime.value = elapsed;
  }
}
