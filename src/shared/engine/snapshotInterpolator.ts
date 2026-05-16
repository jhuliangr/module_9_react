import type { StateUpdateMessage } from '#shared/services/websocket';

// How many past snapshots to retain per remote player. At 50ms between
// near-zone updates this covers 400ms, well above any reasonable
// interpolation delay (~80–250ms).
const BUFFER_SIZE = 8;
// When no future snapshot is available for renderTime, extrapolate from
// the last two snapshots forward — but never further than this, to
// avoid flinging entities offscreen if a player disconnects mid-move.
const MAX_EXTRAPOLATE_MS = 120;
// If renderTime is older than any retained snapshot (shouldn't happen
// under normal operation), just return the oldest. No-op safety rail.

export type Position = { x: number; y: number };

type Snapshot = {
  t: number; // server time, ms
  x: number;
  y: number;
};

/**
 * Source-engine-style snapshot interpolation for remote players.
 *
 * Each ingested state_update is timestamped with the server's clock
 * (converted via clockSync) and pushed into a per-player ring buffer.
 * During rendering we query `getRenderPosition(id, renderTime)` where
 * `renderTime = serverNow - interpDelay`. This renders remote entities
 * slightly in the past, between two known snapshots, producing
 * continuous motion regardless of update throttling or packet jitter.
 *
 * The local player is NOT handled here — it uses client-side
 * prediction via PredictionEngine.
 */
export class SnapshotInterpolator {
  private buffers: Map<string, Snapshot[]> = new Map();

  reset() {
    this.buffers.clear();
  }

  drop(id: string) {
    this.buffers.delete(id);
  }

  /**
   * Ingest a state_update. Uses the server-stamped time on the message
   * as the authoritative timestamp for this frame of player positions.
   * Falls back to `fallbackServerTime` (the client's best estimate of
   * server time right now) if the server didn't stamp the message.
   *
   * Diffs may be partial: the server only includes fields that changed
   * since its last-sent state for this client. So a player moving
   * purely along one axis sends only that axis, and a stationary
   * player may send no position at all (just `{id}`). In both cases
   * we carry forward the unchanged axis from the last snapshot — this
   * keeps the buffer dense enough to interpolate through and, critically,
   * pins the player in place when they stop (preventing extrapolation
   * from overshooting past the real position).
   */
  ingest(msg: StateUpdateMessage, fallbackServerTime: number) {
    const t = msg.serverTime ?? fallbackServerTime;
    for (const diff of msg.players) {
      let buf = this.buffers.get(diff.id);
      const last = buf && buf.length > 0 ? buf[buf.length - 1] : null;
      const hasX = diff.x !== undefined;
      const hasY = diff.y !== undefined;

      // Resolve the snapshot coordinates. If neither axis is present
      // and we have no prior history for this player, there's nothing
      // to snapshot; skip.
      let x: number;
      let y: number;
      if (hasX && hasY) {
        x = diff.x!;
        y = diff.y!;
      } else if (last) {
        x = hasX ? diff.x! : last.x;
        y = hasY ? diff.y! : last.y;
      } else {
        continue;
      }

      if (!buf) {
        buf = [];
        this.buffers.set(diff.id, buf);
      }
      // Guard against out-of-order packets (rare on WS, but possible
      // if the route flips). Ignore samples older than the newest.
      if (last && t <= last.t) continue;
      buf.push({ t, x, y });
      while (buf.length > BUFFER_SIZE) buf.shift();
    }
  }

  /**
   * Position to draw at `renderTime`. When two snapshots bracket
   * `renderTime`, lerps between them. When renderTime is past the
   * latest snapshot, extrapolates from the last two (capped). Returns
   * `fallback` only when the buffer is empty.
   */
  getRenderPosition(
    id: string,
    renderTime: number,
    fallback: Position,
  ): Position {
    const buf = this.buffers.get(id);
    if (!buf || buf.length === 0) return fallback;
    if (buf.length === 1) return { x: buf[0].x, y: buf[0].y };

    const newest = buf[buf.length - 1];

    // Future / extrapolation zone.
    if (renderTime >= newest.t) {
      const prev = buf[buf.length - 2];
      const dt = newest.t - prev.t;
      if (dt <= 0) return { x: newest.x, y: newest.y };
      const ahead = Math.min(renderTime - newest.t, MAX_EXTRAPOLATE_MS);
      const vx = (newest.x - prev.x) / dt;
      const vy = (newest.y - prev.y) / dt;
      return {
        x: newest.x + vx * ahead,
        y: newest.y + vy * ahead,
      };
    }

    // Interpolation: find bracketing pair.
    for (let i = buf.length - 1; i > 0; i--) {
      const b = buf[i];
      const a = buf[i - 1];
      if (a.t <= renderTime && renderTime <= b.t) {
        const span = b.t - a.t;
        if (span <= 0) return { x: b.x, y: b.y };
        const u = (renderTime - a.t) / span;
        return {
          x: a.x + (b.x - a.x) * u,
          y: a.y + (b.y - a.y) * u,
        };
      }
    }

    // renderTime is older than the oldest retained snapshot. Return
    // the oldest — the only safe choice without inventing history.
    return { x: buf[0].x, y: buf[0].y };
  }

  // --- Test helpers ---

  _getBufferSize(id: string): number {
    return this.buffers.get(id)?.length ?? 0;
  }
}
