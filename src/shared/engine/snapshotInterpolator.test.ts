import { beforeEach, describe, expect, it } from 'vitest';
import { SnapshotInterpolator } from './snapshotInterpolator';
import type { StateUpdateMessage } from '#shared/services/websocket';

type Fields = { id: string; x?: number; y?: number };

const stateUpdate = (
  serverTime: number,
  players: Fields[],
): StateUpdateMessage => ({
  type: 'state_update',
  players,
  removed: [],
  pickups: [],
  serverTime,
});

describe('SnapshotInterpolator', () => {
  let interp: SnapshotInterpolator;

  beforeEach(() => {
    interp = new SnapshotInterpolator();
  });

  it('returns fallback when no snapshots exist', () => {
    const pos = interp.getRenderPosition('p1', 1000, { x: 5, y: 5 });
    expect(pos).toEqual({ x: 5, y: 5 });
  });

  it('lerps between two snapshots bracketing renderTime', () => {
    interp.ingest(stateUpdate(1000, [{ id: 'p1', x: 0, y: 0 }]), 1000);
    interp.ingest(stateUpdate(1100, [{ id: 'p1', x: 100, y: 0 }]), 1100);
    const pos = interp.getRenderPosition('p1', 1050, { x: 999, y: 999 });
    expect(pos.x).toBeCloseTo(50);
    expect(pos.y).toBeCloseTo(0);
  });

  // Regression: server diffs contain only the fields that changed. A
  // player moving purely along one axis sends just `x` (or just `y`).
  // Previously the interpolator rejected any diff missing either axis,
  // so these players were never buffered and fell through to raw
  // store positions — producing visible per-tick jumps in the near zone.
  it('accepts axial-only diffs by carrying forward the unchanged axis', () => {
    interp.ingest(stateUpdate(1000, [{ id: 'p1', x: 100, y: 50 }]), 1000);
    // Pure horizontal movement: only x in the diff.
    interp.ingest(stateUpdate(1050, [{ id: 'p1', x: 110 }]), 1050);
    interp.ingest(stateUpdate(1100, [{ id: 'p1', x: 120 }]), 1100);

    expect(interp._getBufferSize('p1')).toBe(3);
    const pos = interp.getRenderPosition('p1', 1075, { x: 0, y: 0 });
    expect(pos.x).toBeCloseTo(115);
    expect(pos.y).toBeCloseTo(50); // carried forward
  });

  // Regression: a stationary player's diff is `{id}` with no coords at
  // all. Previously the buffer didn't advance, so renderTime drifted
  // past the newest snapshot and extrapolation kept pushing the player
  // forward at the last known velocity — visibly overshooting the
  // actual stopped position.
  it('pins stationary players at their last position', () => {
    interp.ingest(stateUpdate(1000, [{ id: 'p1', x: 100, y: 50 }]), 1000);
    interp.ingest(stateUpdate(1050, [{ id: 'p1', x: 110, y: 50 }]), 1050);
    // Player stops moving — server diffs carry only the id.
    interp.ingest(stateUpdate(1100, [{ id: 'p1' }]), 1100);
    interp.ingest(stateUpdate(1150, [{ id: 'p1' }]), 1150);

    expect(interp._getBufferSize('p1')).toBe(4);
    // Right after the stop: interpolation between two identical points
    // must return the stopped position, not overshoot.
    const pos = interp.getRenderPosition('p1', 1125, { x: 0, y: 0 });
    expect(pos.x).toBeCloseTo(110);
    expect(pos.y).toBeCloseTo(50);
  });

  it('skips players that appear for the first time with no coords', () => {
    interp.ingest(stateUpdate(1000, [{ id: 'p1' }]), 1000);
    expect(interp._getBufferSize('p1')).toBe(0);
  });

  it('extrapolates briefly past the newest snapshot', () => {
    interp.ingest(stateUpdate(1000, [{ id: 'p1', x: 0, y: 0 }]), 1000);
    interp.ingest(stateUpdate(1050, [{ id: 'p1', x: 10, y: 0 }]), 1050);
    // 30ms past newest, velocity is 10u / 50ms = 0.2 u/ms, so +6 units.
    const pos = interp.getRenderPosition('p1', 1080, { x: 999, y: 999 });
    expect(pos.x).toBeCloseTo(16);
    expect(pos.y).toBeCloseTo(0);
  });

  it('caps extrapolation so a stopped player does not fly away', () => {
    interp.ingest(stateUpdate(1000, [{ id: 'p1', x: 0, y: 0 }]), 1000);
    interp.ingest(stateUpdate(1050, [{ id: 'p1', x: 10, y: 0 }]), 1050);
    // 5 seconds in the future: capped at MAX_EXTRAPOLATE_MS (120).
    const pos = interp.getRenderPosition('p1', 6000, { x: 999, y: 999 });
    // Max drift: 0.2 u/ms * 120 ms = 24 units.
    expect(pos.x).toBeLessThanOrEqual(34);
  });

  it('ignores out-of-order (older) packets', () => {
    interp.ingest(stateUpdate(1000, [{ id: 'p1', x: 0, y: 0 }]), 1000);
    interp.ingest(stateUpdate(1100, [{ id: 'p1', x: 100, y: 0 }]), 1100);
    interp.ingest(stateUpdate(1050, [{ id: 'p1', x: 999, y: 999 }]), 1050);
    expect(interp._getBufferSize('p1')).toBe(2);
  });

  it('drop() removes a player buffer', () => {
    interp.ingest(stateUpdate(1000, [{ id: 'p1', x: 0, y: 0 }]), 1000);
    interp.drop('p1');
    expect(interp._getBufferSize('p1')).toBe(0);
  });
});
