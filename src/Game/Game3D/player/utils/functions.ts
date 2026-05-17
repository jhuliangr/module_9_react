import type { Mesh, Points, ShaderMaterial } from 'three';

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface TimedFX {
  startedAt: number;
  material: ShaderMaterial;
}

export function advanceTimedFX(
  obj: Mesh | Points,
  fx: TimedFX,
  durationMs: number,
  now: number,
): number | null {
  if (!obj.visible) return null;
  const elapsed = now - fx.startedAt;
  if (elapsed >= durationMs) {
    obj.visible = false;
    return null;
  }
  fx.material.uniforms.uTime.value = elapsed / 1000;
  return elapsed / durationMs;
}
