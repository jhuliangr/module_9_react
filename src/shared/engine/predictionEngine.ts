import { WORLD_SIZE } from '#shared/constants';
import type {
  StateUpdateMessage,
  WelcomeMessage,
} from '#shared/services/websocket';

// Mirrors server physics: 200 u/s cap at 50ms tick = 10 units per accepted move.
const MOVE_STEP = 10;
// Server accepts at most one move every 40ms (see ws_handler MOVE_MIN_INTERVAL_MS).
const MIN_MOVE_INTERVAL_MS = 40;
// Per-frame lerp factor when easing the displayed local position toward
// the reconciled prediction. Trades a tiny bit of input latency for
// significantly smoother on-screen motion: rate-limit drops, discrete
// 10-unit steps, and micro-reconciliations all get rounded into a
// continuous glide instead of frame-by-frame pops.
const SMOOTH_CORRECTION = 0.5;
// If the reconciliation error exceeds this, snap instead of easing (likely a
// teleport/spawn, not mispredicted input).
const SNAP_THRESHOLD = 40;

export type Position = { x: number; y: number };

type PendingInput = {
  tick: number;
  dx: number;
  dy: number;
};

export function clampToWorld(pos: Position): Position {
  return {
    x: Math.max(0, Math.min(WORLD_SIZE, pos.x)),
    y: Math.max(0, Math.min(WORLD_SIZE, pos.y)),
  };
}

export function simulateMove(pos: Position, dx: number, dy: number): Position {
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return pos;
  const stepX = (dx / mag) * MOVE_STEP;
  const stepY = (dy / mag) * MOVE_STEP;
  return clampToWorld({ x: pos.x + stepX, y: pos.y + stepY });
}

/**
 * Owns client-side prediction and server reconciliation for the LOCAL player
 * only. Remote players are rendered directly from the authoritative store
 * positions — no interpolation or snapshot buffering is performed here.
 */
export class PredictionEngine {
  private myId: string | null = null;
  private pendingInputs: PendingInput[] = [];
  // Latest server-confirmed position for local player (baseline for replay).
  private confirmedPos: Position | null = null;
  // Result of replaying pending inputs over confirmedPos — what the player
  // conceptually *is* at this moment.
  private predictedPos: Position | null = null;
  // What the renderer actually draws — eased toward predictedPos to absorb
  // corrections without snapping.
  private displayedPos: Position | null = null;
  private lastLocalMoveAt = -Infinity;
  // Angle of the most recent non-zero input. This is the player's *intent*
  // and is the correct source for the local sprite's facing direction:
  // unlike the rendered-position delta, it never flips when reconciliation
  // eases the displayed position a pixel or two backwards.
  private lastInputAngle: number | null = null;

  reset() {
    this.myId = null;
    this.pendingInputs = [];
    this.confirmedPos = null;
    this.predictedPos = null;
    this.displayedPos = null;
    this.lastLocalMoveAt = -Infinity;
    this.lastInputAngle = null;
  }

  onWelcome(msg: WelcomeMessage) {
    this.myId = msg.playerId;
    this.pendingInputs = [];
    const pos = { x: msg.player.x, y: msg.player.y };
    this.confirmedPos = pos;
    this.predictedPos = { ...pos };
    this.displayedPos = { ...pos };
  }

  /**
   * Apply a move locally (client-side prediction). Safe to call even before
   * a welcome has been received — in that case prediction is a no-op but the
   * caller should still send the move to the server.
   *
   * Returns the predicted position when prediction was applied, or null when
   * it was skipped (no direction / no confirmed baseline / rate-limited).
   */
  applyLocalMove(dx: number, dy: number, clientTick: number): Position | null {
    if (dx === 0 && dy === 0) return null;
    // Track intent even if the input is rate-limited or the predicted
    // baseline isn't ready — the facing should still reflect the last
    // direction the player asked for.
    this.lastInputAngle = Math.atan2(dy, dx);
    if (this.predictedPos === null) return null;

    const now = performance.now();
    if (now - this.lastLocalMoveAt < MIN_MOVE_INTERVAL_MS) return null;
    this.lastLocalMoveAt = now;

    this.pendingInputs.push({ tick: clientTick, dx, dy });
    this.predictedPos = simulateMove(this.predictedPos, dx, dy);
    return { ...this.predictedPos };
  }

  getLastInputAngle(): number | null {
    return this.lastInputAngle;
  }

  onStateUpdate(msg: StateUpdateMessage) {
    if (this.myId === null) return;
    const myDiff = msg.players.find((p) => p.id === this.myId);
    if (!myDiff || (myDiff.x === undefined && myDiff.y === undefined)) return;

    const confirmed: Position = {
      x: myDiff.x ?? this.confirmedPos?.x ?? 0,
      y: myDiff.y ?? this.confirmedPos?.y ?? 0,
    };
    this.confirmedPos = confirmed;

    if (typeof msg.ackTick === 'number') {
      this.pendingInputs = this.pendingInputs.filter(
        (i) => i.tick > msg.ackTick!,
      );
    }

    // Replay any unacknowledged inputs on top of the confirmed position.
    let replayed: Position = { ...confirmed };
    for (const input of this.pendingInputs) {
      replayed = simulateMove(replayed, input.dx, input.dy);
    }
    this.predictedPos = replayed;

    if (this.displayedPos === null) {
      this.displayedPos = { ...replayed };
    } else {
      // If the mismatch is large (e.g. respawn/teleport), snap instead.
      const dx = replayed.x - this.displayedPos.x;
      const dy = replayed.y - this.displayedPos.y;
      if (Math.hypot(dx, dy) > SNAP_THRESHOLD) {
        this.displayedPos = { ...replayed };
      }
      // Otherwise rely on getLocalRenderedPosition() to ease toward predictedPos.
    }
  }

  /**
   * Called from the render loop each frame. Returns the position the renderer
   * should draw the local player at (predicted + smoothed). Returns `fallback`
   * when no welcome has been received yet.
   */
  getLocalRenderedPosition(fallback: Position | null = null): Position | null {
    if (this.predictedPos === null) return fallback;
    if (this.displayedPos === null) {
      this.displayedPos = { ...this.predictedPos };
    } else {
      this.displayedPos = {
        x:
          this.displayedPos.x +
          (this.predictedPos.x - this.displayedPos.x) * SMOOTH_CORRECTION,
        y:
          this.displayedPos.y +
          (this.predictedPos.y - this.displayedPos.y) * SMOOTH_CORRECTION,
      };
    }
    return { ...this.displayedPos };
  }

  getMyId() {
    return this.myId;
  }

  // --- Test helpers (exposed for deterministic unit tests) ---

  _getPendingInputCount() {
    return this.pendingInputs.length;
  }
  _getPredictedPos() {
    return this.predictedPos ? { ...this.predictedPos } : null;
  }
  _getConfirmedPos() {
    return this.confirmedPos ? { ...this.confirmedPos } : null;
  }
}
