// Lerp factor for the per-frame facing rotation. Lower = smoother but
// laggier; 0.2 yields ~5-frame transitions.
export const FACING_LERP = 0.2;
// World-units delta needed before we update a remote rig's facing.
// Below this, the delta is dominated by reconciliation jitter.
export const FACING_MIN_DELTA = 1.0;
// World-units delta needed to count as "moving" for animation gating.
export const WALK_MIN_DELTA = 0.3;
// Tune if the GLTF was authored facing a direction other than three.js's
// default -z forward. The mage was authored facing +z, so +π flips it
// to point along the movement direction instead of toward the camera.
export const MODEL_FACING_OFFSET = Math.PI;
