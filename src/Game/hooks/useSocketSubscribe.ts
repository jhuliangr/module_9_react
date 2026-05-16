import {
  gameSocket,
  type CombatEventMessage,
  type KickedMessage,
  type PongMessage,
  type StateUpdateMessage,
  type WelcomeMessage,
} from '#shared/services/websocket';
import { clockSync } from '#shared/services/clock-sync';
import { useGameStore, useSettingsStore } from '#shared/stores';
import type { Achivement } from '#shared/services/game';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { predictionEngine } from '#shared/engine';
import { snapshotInterpolator } from '#shared/engine';

const PLAYER_ID_KEY = 'multiplayer.playerId';

function loadStoredPlayerId(): string | undefined {
  try {
    return localStorage.getItem(PLAYER_ID_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function storePlayerId(id: string) {
  try {
    localStorage.setItem(PLAYER_ID_KEY, id);
  } catch {
    /* storage unavailable — best effort */
  }
}

function clearStoredPlayerId() {
  try {
    localStorage.removeItem(PLAYER_ID_KEY);
  } catch {
    /* storage unavailable — best effort */
  }
}

function checkAchievements(kills: number, level: number): Achivement | null {
  const { achievements, unlockedAchievementIds, unlockAchievement } =
    useSettingsStore.getState();
  const conditionChecks: Record<string, number> = { kills, level };
  for (const ach of achievements) {
    if (unlockedAchievementIds.includes(ach.id)) continue;
    const playerValue = conditionChecks[ach.condition.type];
    if (playerValue !== undefined && playerValue >= ach.condition.value) {
      const isNew = unlockAchievement(ach.id);
      if (isNew) return ach;
    }
  }
  return null;
}

export function useSocketSubscribe() {
  const [joined, setJoined] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [lastUnlockedAchievement, setLastUnlockedAchievement] =
    useState<Achivement | null>(null);
  const { setMyPlayerId, applyStateUpdate, setCombatEvent, setPickups, reset } =
    useGameStore();
  const navigate = useNavigate();
  const playerNameRef = useRef<string | null>(null);
  const lastKillerNameRef = useRef<string | null>(null);
  // Remembers every attacker's name the first time we see them in a
  // combat_event for ourselves. DoT ticks that arrive after the mage
  // walks out of visibility range would otherwise fall back to
  // "a player" because `players[sourceId]` is no longer populated.
  const attackerNamesRef = useRef<Record<string, string>>({});
  // Mirror of `lost` so the state_update handler inside the mount-only
  // effect can call it without being retriggered when the callback
  // identity changes.
  const lostRef = useRef<() => void>(() => {});

  useEffect(() => {
    gameSocket.connect();
    clockSync.start(gameSocket);

    const unsubMessage = gameSocket.onMessage((msg) => {
      switch (msg.type) {
        case 'welcome': {
          const welcome = msg as WelcomeMessage;
          reset();
          predictionEngine.reset();
          snapshotInterpolator.reset();
          attackerNamesRef.current = {};
          gameSocket.resetClientTick();
          setMyPlayerId(welcome.playerId);
          storePlayerId(welcome.playerId);
          applyStateUpdate([welcome.player]);
          predictionEngine.onWelcome(welcome);
          setJoined(true);
          setReconnecting(false);
          break;
        }
        case 'state_update': {
          const update = msg as StateUpdateMessage;
          const myId = useGameStore.getState().myPlayerId;
          // Server-side removal of the local player = we've died.
          // This is the only reliable death signal for DoT kills: the
          // server removes the player inside process_dots *after* the
          // tick's state_update was already broadcast, so the previous
          // frame still showed us with positive HP. The next tick's
          // state_update drops us from `players` and lists us in
          // `removed`. Melee kills happen to broadcast hp=0 first, but
          // relying on this is more robust and handles future paths
          // (server kick, timeout, etc.) uniformly.
          if (myId && update.removed.includes(myId)) {
            lostRef.current();
            break;
          }
          applyStateUpdate(update.players);
          setPickups(update.pickups);
          predictionEngine.onStateUpdate(update);
          snapshotInterpolator.ingest(update, clockSync.getServerTime());
          const me = myId ? useGameStore.getState().players[myId] : null;
          if (me) {
            const unlocked = checkAchievements(me.kills, me.level);
            if (unlocked) setLastUnlockedAchievement(unlocked);
          }
          break;
        }
        case 'pong': {
          clockSync.onPong(msg as PongMessage);
          break;
        }
        case 'died': {
          // Server signals that the player was removed from the game
          // (DoT kill, melee kill, or any future server-driven death).
          // The server stops sending state_updates after removal, so
          // this is the only reliable signal for deaths whose killing
          // blow wasn't broadcast with hp=0.
          lostRef.current();
          break;
        }
        case 'combat_event': {
          const event = msg as CombatEventMessage;
          setCombatEvent(event);
          const myId = useGameStore.getState().myPlayerId;
          if (myId && event.defenderId === myId) {
            // Credit the real applier for DoT ticks via `sourceId`
            // when the server provided one. Falls back to the generic
            // label only for environmental / unsourced DoTs.
            const attributionId =
              event.attackerId === 'dot'
                ? (event.sourceId ?? null)
                : event.attackerId;
            if (attributionId) {
              const live = useGameStore.getState().players[attributionId]?.name;
              if (live) attackerNamesRef.current[attributionId] = live;
              lastKillerNameRef.current =
                attackerNamesRef.current[attributionId] ?? 'a player';
            } else {
              lastKillerNameRef.current = 'damage effect';
            }
          }
          break;
        }
        case 'kicked': {
          const kicked = msg as KickedMessage;
          console.warn(
            'Session taken over by another connection:',
            kicked.reason,
          );
          playerNameRef.current = null;
          clearStoredPlayerId();
          reset();
          predictionEngine.reset();
          snapshotInterpolator.reset();
          clockSync.reset();
          setJoined(false);
          setReconnecting(false);
          gameSocket.disconnect();
          gameSocket.connect();
          clockSync.start(gameSocket);
          navigate('/play', {
            replace: true,
            state: { kicked: kicked.reason },
          });
          break;
        }
      }
    });

    const unsubClose = gameSocket.onClose(() => {
      if (playerNameRef.current) {
        setReconnecting(true);
        const myId = useGameStore.getState().myPlayerId ?? loadStoredPlayerId();
        reset();
        predictionEngine.reset();
        snapshotInterpolator.reset();
        const { selectedCharacter } = useSettingsStore.getState();
        gameSocket.join(
          playerNameRef.current,
          myId ?? undefined,
          selectedCharacter,
        );
      }
    });

    const unsubReconnectFail = gameSocket.onReconnectFail(() => {
      setReconnecting(false);
      reset();
      setJoined(false);
      navigate('/play', { replace: true });
    });

    return () => {
      unsubMessage();
      unsubClose();
      unsubReconnectFail();
      clockSync.stop();
      gameSocket.disconnect();
    };
  }, [
    setCombatEvent,
    setMyPlayerId,
    applyStateUpdate,
    setPickups,
    reset,
    navigate,
  ]);

  const join = useCallback((name: string) => {
    playerNameRef.current = name;
    const { selectedCharacter } = useSettingsStore.getState();
    const storedId = loadStoredPlayerId();
    gameSocket.join(name, storedId, selectedCharacter);
  }, []);

  const leave = useCallback(() => {
    playerNameRef.current = null;
    clearStoredPlayerId();
    gameSocket.disconnect();
    gameSocket.connect();
    reset();
    setJoined(false);
    navigate('/play', {
      replace: true,
    });
  }, [reset, navigate]);

  const lost = useCallback(() => {
    // Idempotency guard. Two death signals can race: useDeathDetection
    // firing from a state_update with hp=0, and our in-handler check
    // picking up the `removed` list on the following tick. Without
    // this we'd disconnect/reconnect twice and navigate twice.
    if (useGameStore.getState().myPlayerId === null) return;
    const killerName = lastKillerNameRef.current;
    lastKillerNameRef.current = null;
    playerNameRef.current = null;
    clearStoredPlayerId();
    gameSocket.disconnect();
    gameSocket.connect();
    reset();
    predictionEngine.reset();
    snapshotInterpolator.reset();
    setJoined(false);
    navigate('/game-over', {
      replace: true,
      state: { killerName },
    });
  }, [reset, navigate]);

  // Keep the ref aligned with the latest lost() so the message-handler
  // closure (captured once at mount) always calls the current impl.
  // `lost` is memoized on stable deps, so this effect runs at most on
  // mount — but keeping it in an effect is the correct React shape.
  useEffect(() => {
    lostRef.current = lost;
  }, [lost]);

  return {
    joined,
    reconnecting,
    join,
    leave,
    lost,
    lastUnlockedAchievement,
    clearAchievementNotification: () => setLastUnlockedAchievement(null),
  };
}
