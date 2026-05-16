import { characterRegistry } from '../registry';
import type { CharacterDefinition, RenderContext } from '../types';

const PLAYER_RADIUS = 12;

/** Alternates left↔right by detecting when progress resets */
const attackCount: Record<string, number> = {};
const lastProgress: Record<string, number> = {};

const STAB_REACH = 38;
const BLADE_LENGTH = 18;
const SIDE_OFFSET = Math.PI / 6;

const rogue: CharacterDefinition = {
  id: 'rogue',
  name: 'Rogue',
  attackDurationMs: 100,

  getSpritePath(skinId) {
    return `${import.meta.env.BASE_URL}assets/sprites/rogue-${skinId ?? 'default'}-sprite.png`;
  },

  getAttackSoundPath() {
    return `${import.meta.env.BASE_URL}assets/sounds/rogue-attack.mp3`;
  },

  getHitSoundPath() {
    return `${import.meta.env.BASE_URL}assets/sounds/rogue-hit.mp3`;
  },

  renderAttack(rc: RenderContext) {
    const { ctx, cx, cy, angle, progress, attackerId } = rc;

    // Alternate side: detect new attack when progress resets below last seen
    const prev = lastProgress[attackerId] ?? 1;
    lastProgress[attackerId] = progress;
    if (progress < prev) {
      attackCount[attackerId] = (attackCount[attackerId] ?? 0) + 1;
    }
    const isLeft = (attackCount[attackerId] ?? 0) % 2 === 1;

    // Stab thrust: quick extend then retract
    // 0→0.4 extend, 0.4→1.0 retract
    const thrust = progress < 0.4 ? progress / 0.4 : 1 - (progress - 0.4) / 0.6;
    const reach = PLAYER_RADIUS + thrust * STAB_REACH;
    const alpha = 0.85 * (1 - progress * 0.5);

    const sideAngle = isLeft ? angle - SIDE_OFFSET : angle + SIDE_OFFSET;

    // Offset origin perpendicular to attack angle (left or right of center)
    const handOffset = 6;
    const perpAngle = angle + (isLeft ? -Math.PI / 2 : Math.PI / 2);
    const originX = cx + Math.cos(perpAngle) * handOffset;
    const originY = cy + Math.sin(perpAngle) * handOffset;

    const tipX = originX + Math.cos(sideAngle) * (reach + BLADE_LENGTH);
    const tipY = originY + Math.sin(sideAngle) * (reach + BLADE_LENGTH);
    const baseX = originX + Math.cos(sideAngle) * reach;
    const baseY = originY + Math.sin(sideAngle) * reach;

    // Perpendicular for blade width
    const perpX = Math.cos(sideAngle + Math.PI / 2);
    const perpY = Math.sin(sideAngle + Math.PI / 2);
    const bladeWidth = 4.5;

    ctx.save();

    // Blade shape (narrow diamond)
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      baseX + (tipX - baseX) * 0.35 + perpX * bladeWidth,
      baseY + (tipY - baseY) * 0.35 + perpY * bladeWidth,
    );
    ctx.lineTo(baseX, baseY);
    ctx.lineTo(
      baseX + (tipX - baseX) * 0.35 - perpX * bladeWidth,
      baseY + (tipY - baseY) * 0.35 - perpY * bladeWidth,
    );
    ctx.closePath();
    ctx.fillStyle = `rgba(220, 220, 220, ${alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Motion trail line
    ctx.beginPath();
    ctx.moveTo(
      originX + Math.cos(sideAngle) * PLAYER_RADIUS,
      originY + Math.sin(sideAngle) * PLAYER_RADIUS,
    );
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  },
};

characterRegistry.register(rogue);
