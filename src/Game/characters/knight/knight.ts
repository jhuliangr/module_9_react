import { characterRegistry } from '../registry';
import type { CharacterDefinition, RenderContext } from '../types';

const PLAYER_RADIUS = 12;
const BLADE_OUTER = 65;
const SPREAD = Math.PI / 4;
const BLADE_WIDTH = Math.PI / 12;

const knight: CharacterDefinition = {
  id: 'knight',
  name: 'Knight',
  attackDurationMs: 150,

  getSpritePath(skinId) {
    return `${import.meta.env.BASE_URL}assets/sprites/knight-${skinId ?? 'default'}-sprite.png`;
  },

  getAttackSoundPath() {
    return `${import.meta.env.BASE_URL}assets/sounds/knight-attack.mp3`;
  },

  getHitSoundPath() {
    return `${import.meta.env.BASE_URL}assets/sounds/knight-hit.mp3`;
  },

  renderAttack(rc: RenderContext) {
    const { ctx, cx, cy, angle, progress } = rc;
    const sweptAngle = progress * SPREAD * 2;
    if (sweptAngle < 0.01) return;

    const startAngle = angle - SPREAD;
    const currentAngle = startAngle + sweptAngle;
    const bladeWidth = Math.min(BLADE_WIDTH, sweptAngle);

    ctx.save();

    const trailAlpha = 0.32 * (1 - progress * 0.5);
    ctx.beginPath();
    ctx.arc(cx, cy, BLADE_OUTER, startAngle, currentAngle);
    ctx.arc(cx, cy, PLAYER_RADIUS, currentAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = `rgba(160, 210, 255, ${trailAlpha})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, BLADE_OUTER, currentAngle - bladeWidth, currentAngle);
    ctx.arc(
      cx,
      cy,
      PLAYER_RADIUS,
      currentAngle,
      currentAngle - bladeWidth,
      true,
    );
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 245, 180, 0.85)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, BLADE_OUTER, currentAngle - bladeWidth, currentAngle);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
  },
};

characterRegistry.register(knight);
