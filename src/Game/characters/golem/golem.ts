import { characterRegistry } from '../registry';
import type { CharacterDefinition, RenderContext } from '../types';

const PLAYER_RADIUS = 12;
const BLADE_OUTER = 65;

const golem: CharacterDefinition = {
  id: 'golem',
  name: 'Golem',
  attackDurationMs: 200,

  getSpritePath(skinId) {
    return `${import.meta.env.BASE_URL}assets/sprites/golem-${skinId ?? 'default'}-sprite.png`;
  },

  getAttackSoundPath() {
    return `${import.meta.env.BASE_URL}assets/sounds/golem-attack.mp3`;
  },

  getHitSoundPath() {
    return `${import.meta.env.BASE_URL}assets/sounds/golem-hit.mp3`;
  },

  renderAttack(rc: RenderContext) {
    const { ctx, cx, cy, angle, progress } = rc;

    ctx.save();

    // Heavy ground slam — expanding shockwave
    const slamDist = PLAYER_RADIUS + 20;
    const slamX = cx + Math.cos(angle) * slamDist;
    const slamY = cy + Math.sin(angle) * slamDist;
    const waveRadius = 20 + progress * 60;
    const alpha = 0.8 * (1 - progress);

    // Shockwave ring
    ctx.beginPath();
    ctx.arc(slamX, slamY, waveRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(200, 160, 80, ${alpha})`;
    ctx.lineWidth = 4 * (1 - progress * 0.5);
    ctx.stroke();

    // Inner impact
    ctx.beginPath();
    ctx.arc(slamX, slamY, waveRadius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.5})`;
    ctx.fill();

    // Directional impact cone
    const coneSpread = Math.PI / 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(
      cx,
      cy,
      BLADE_OUTER + 15,
      angle - coneSpread / 2,
      angle + coneSpread / 2,
    );
    ctx.closePath();
    ctx.fillStyle = `rgba(180, 140, 60, ${alpha * 0.25})`;
    ctx.fill();

    ctx.restore();
  },
};

characterRegistry.register(golem);
