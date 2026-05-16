import { useRef, useState } from 'react';
import { useGameStore } from '#shared/stores';
import { JoinGameForm, type JoinMode } from './JoinGameForm/JoinGameForm';
import { Game3D } from './Game3D';
import { Hud } from './Hud';
import { Joystick } from './Joystick';
import {
  useAttackAnimation,
  useBackgroundImage,
  useCanvasRenderer,
  useDeathDetection,
  useHapticFeedback,
  useIsMobile,
  useKeyboardMapping,
  useMobileControls,
  useOtherPlayersAttacks,
  usePlayerAnimations,
  usePlayerSprite,
  useSocketSubscribe,
  useSoundEffects,
} from './hooks';
import { RotateScreen } from './RotateScreen/RotateScreen';

export function Game() {
  const {
    joined,
    reconnecting,
    join,
    lost,
    leave,
    lastUnlockedAchievement,
    clearAchievementNotification,
  } = useSocketSubscribe();

  const isMobile = useIsMobile();
  const [mode, setMode] = useState<JoinMode>('classic');

  const handleJoin = (name: string, selectedMode: JoinMode) => {
    setMode(selectedMode);
    join(name);
  };

  useKeyboardMapping(joined && !isMobile && mode === 'classic');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { myPlayerId, players } = useGameStore();
  const me = myPlayerId ? players[myPlayerId] : null;

  const spriteRef = usePlayerSprite();
  const animationsRef = usePlayerAnimations();
  const bgImageRef = useBackgroundImage();
  const activeAttacksRef = useOtherPlayersAttacks(myPlayerId);
  const { playAttackSound } = useSoundEffects();

  const desktopAttack = useAttackAnimation(
    isMobile ? undefined : playAttackSound,
  );

  const mobileControls = useMobileControls(
    joined && isMobile,
    isMobile ? playAttackSound : undefined,
  );

  const attackFlashRef = isMobile
    ? mobileControls.attackFlashRef
    : desktopAttack.attackFlashRef;
  const cooldownActiveRef = isMobile
    ? mobileControls.cooldownActiveRef
    : desktopAttack.cooldownActiveRef;

  useDeathDetection(me, lost);
  useHapticFeedback();
  useCanvasRenderer(
    canvasRef,
    spriteRef,
    attackFlashRef,
    activeAttacksRef,
    bgImageRef,
    animationsRef,
  );

  if (reconnecting) {
    return (
      <div className="flex items-center justify-center gap-3 p-4 bg-secondary rounded-md mx-auto">
        <p className="text-white">Reconnecting...</p>
      </div>
    );
  }

  if (!joined) return <JoinGameForm onJoin={handleJoin} />;

  if (mode === 'third-person') {
    return <Game3D leave={leave} />;
  }

  return (
    <>
      <RotateScreen isMobile={isMobile} />
      <div
        className="relative mx-auto"
        style={
          isMobile
            ? { width: '100vw', height: '100dvh', overflow: 'hidden' }
            : { maxWidth: '800px', maxHeight: '600px', overflow: 'hidden' }
        }
      >
        <Hud
          leave={leave}
          cooldownActiveRef={cooldownActiveRef}
          lastUnlockedAchievement={lastUnlockedAchievement}
          onDismissAchievement={clearAchievementNotification}
          isMobile={isMobile}
        />
        <canvas
          width={800}
          height={600}
          style={
            isMobile
              ? {
                  border: 'outset black',
                  height: '100%',
                  objectFit: 'contain',
                  touchAction: 'none',
                }
              : { border: 'outset black' }
          }
          onClick={isMobile ? undefined : desktopAttack.handleCanvasClick}
          ref={canvasRef}
          onContextMenu={(e) => e.preventDefault()}
          className={`mx-auto rounded ${isMobile ? '' : 'cursor-crosshair'}`}
        />
        {isMobile && (
          <>
            <Joystick side="left" onMove={mobileControls.onMoveJoystick} />
            <Joystick
              side="right"
              deadzone={0.3}
              onStart={mobileControls.onAttackStart}
              onMove={mobileControls.onAttackJoystick}
              onEnd={mobileControls.onAttackEnd}
            />
          </>
        )}
      </div>
    </>
  );
}
