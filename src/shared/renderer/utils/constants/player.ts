export const PLAYER_HEIGHT = 1.8;
export const PLAYER_RADIUS = 0.5;
// Gap above which we snap the remote rig to its authoritative position
// instead of interpolating — almost always indicates a respawn rather
// than legitimate motion.
export const REMOTE_SNAP_THRESHOLD = 80;

export const ATTACK_RANGE = (12 + 80) * 0.05;

export const ATTACK_DURATION_MS = 200;
export const ATTACK_Y = PLAYER_HEIGHT + 1.7;
export const ATTACK_START_Z = 0.3;
export const ATTACK_END_Z = ATTACK_RANGE;
