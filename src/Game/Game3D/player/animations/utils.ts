import type { AnimationClip } from 'three';

// Util for getting the animations
export function findClip(
  clips: AnimationClip[],
  keyword: string,
): AnimationClip | null {
  const k = keyword.toLowerCase();
  return clips.find((c) => c.name.toLowerCase().includes(k)) ?? null;
}
