import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PredictionEngine, simulateMove } from './predictionEngine';
import type {
  StateUpdateMessage,
  WelcomeMessage,
} from '#shared/services/websocket';

const welcomeAt = (x: number, y: number, serverTime = 1000): WelcomeMessage =>
  ({
    type: 'welcome',
    playerId: 'me',
    player: {
      id: 'me',
      name: 'me',
      x,
      y,
      hp: 100,
      max_hp: 100,
      level: 1,
      xp: 0,
      kills: 0,
      deaths: 0,
      skin: '',
      weapon: '',
      character: 'knight',
    },
    serverTick: 0,
    serverTime,
  }) as WelcomeMessage;

describe('simulateMove', () => {
  it('advances 10 units in the normalized direction', () => {
    const next = simulateMove({ x: 100, y: 100 }, 1, 0);
    expect(next).toEqual({ x: 110, y: 100 });
  });

  it('normalizes diagonal input to a 10-unit step', () => {
    const next = simulateMove({ x: 0, y: 0 }, 1, 1);
    expect(Math.hypot(next.x, next.y)).toBeCloseTo(10, 3);
  });

  it('clamps to world bounds', () => {
    const next = simulateMove({ x: 1995, y: 500 }, 1, 0);
    expect(next.x).toBe(2000);
  });
});

describe('PredictionEngine — client-side prediction', () => {
  let engine: PredictionEngine;
  let now = 0;

  beforeEach(() => {
    engine = new PredictionEngine();
    now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });

  it('applies a predicted move immediately after welcome', () => {
    engine.onWelcome(welcomeAt(100, 100));
    engine.applyLocalMove(1, 0, 1);
    const pos = engine._getPredictedPos();
    expect(pos).toEqual({ x: 110, y: 100 });
    expect(engine._getPendingInputCount()).toBe(1);
  });

  it('does not predict before welcome', () => {
    const result = engine.applyLocalMove(1, 0, 1);
    expect(result).toBeNull();
    expect(engine._getPredictedPos()).toBeNull();
  });

  it('rate-limits predictions to one per 40ms', () => {
    engine.onWelcome(welcomeAt(0, 0));
    engine.applyLocalMove(1, 0, 1);
    // Still 0ms since the first move — second call must be rejected.
    const second = engine.applyLocalMove(1, 0, 2);
    expect(second).toBeNull();
    expect(engine._getPendingInputCount()).toBe(1);
    // After 40ms, the next move is accepted.
    now = 40;
    const third = engine.applyLocalMove(1, 0, 3);
    expect(third).not.toBeNull();
    expect(engine._getPendingInputCount()).toBe(2);
  });
});

describe('PredictionEngine — server reconciliation', () => {
  let engine: PredictionEngine;
  let now = 0;

  beforeEach(() => {
    engine = new PredictionEngine();
    now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });

  it('drops acknowledged pending inputs and replays the rest', () => {
    engine.onWelcome(welcomeAt(0, 0));
    engine.applyLocalMove(1, 0, 1);
    now = 50;
    engine.applyLocalMove(1, 0, 2);
    now = 100;
    engine.applyLocalMove(1, 0, 3);

    // Server acknowledges up through tick 1 and confirms (10, 0) — it has not
    // yet seen ticks 2 and 3, so we replay them on top of the confirmed pos.
    const update: StateUpdateMessage = {
      type: 'state_update',
      players: [{ id: 'me', x: 10, y: 0 }],
      removed: [],
      pickups: [],
      tick: 5,
      serverTime: 1500,
      ackTick: 1,
    };
    engine.onStateUpdate(update);

    expect(engine._getConfirmedPos()).toEqual({ x: 10, y: 0 });
    expect(engine._getPendingInputCount()).toBe(2);
    // 10 (confirmed) + 10 (tick 2 replay) + 10 (tick 3 replay) = 30
    expect(engine._getPredictedPos()).toEqual({ x: 30, y: 0 });
  });

  it('discards all pending inputs when server has ack-ed the latest', () => {
    engine.onWelcome(welcomeAt(0, 0));
    engine.applyLocalMove(1, 0, 1);
    const update: StateUpdateMessage = {
      type: 'state_update',
      players: [{ id: 'me', x: 10, y: 0 }],
      removed: [],
      pickups: [],
      tick: 2,
      serverTime: 1100,
      ackTick: 1,
    };
    engine.onStateUpdate(update);
    expect(engine._getPendingInputCount()).toBe(0);
    expect(engine._getPredictedPos()).toEqual({ x: 10, y: 0 });
  });
});

describe('PredictionEngine — remote players are not tracked', () => {
  it('does not reconcile or record position for non-local players', () => {
    const engine = new PredictionEngine();
    engine.onWelcome(welcomeAt(0, 0));

    engine.onStateUpdate({
      type: 'state_update',
      players: [{ id: 'other', x: 123, y: 456 }],
      removed: [],
      pickups: [],
      tick: 1,
      serverTime: 1000,
    });

    // Local state is untouched by the remote diff.
    expect(engine._getConfirmedPos()).toEqual({ x: 0, y: 0 });
    expect(engine._getPredictedPos()).toEqual({ x: 0, y: 0 });
  });

  it('returns the fallback position for the local player only', () => {
    const engine = new PredictionEngine();
    engine.onWelcome(welcomeAt(100, 200));
    // The engine exposes only the local player's position.
    expect(engine.getLocalRenderedPosition({ x: 0, y: 0 })).toEqual({
      x: 100,
      y: 200,
    });
  });
});
