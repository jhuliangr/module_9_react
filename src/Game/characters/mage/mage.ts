import { characterRegistry } from '../registry';
import type {
  CharacterDefinition,
  PlayerRenderContext,
  RenderContext,
} from '../types';

const PLAYER_RADIUS = 12;
const DOT_VISIBLE_MS = 5000;

const mage: CharacterDefinition = {
  id: 'mage',
  name: 'Mage',
  attackDurationMs: 150,

  getSpritePath(skinId) {
    return `${import.meta.env.BASE_URL}assets/sprites/mage-${skinId ?? 'default'}-sprite.png`;
  },

  getAttackSoundPath() {
    return `${import.meta.env.BASE_URL}assets/sounds/mage-attack.mp3`;
  },

  getHitSoundPath() {
    return `${import.meta.env.BASE_URL}assets/sounds/mage-hit.mp3`;
  },

  renderAttack(rc: RenderContext) {
    const { ctx, cx, cy, angle, progress } = rc;

    ctx.save();

    const dist = PLAYER_RADIUS + progress * 80;
    const orbX = cx + Math.cos(angle) * dist;
    const orbY = cy + Math.sin(angle) * dist;
    const orbRadius = 10 * (1 - progress * 0.3);
    const alpha = 0.9 * (1 - progress);

    // Outer glow
    const gradient = ctx.createRadialGradient(
      orbX,
      orbY,
      0,
      orbX,
      orbY,
      orbRadius * 2.5,
    );
    gradient.addColorStop(0, `rgba(180, 100, 255, ${alpha * 0.6})`);
    gradient.addColorStop(1, 'rgba(180, 100, 255, 0)');
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Core orb
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 140, 255, ${alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  },

  renderPlayerEffect(prc: PlayerRenderContext) {
    const { ctx, sx, sy, dotStartTime } = prc;
    if (dotStartTime === null) return;

    const elapsed = performance.now() - dotStartTime;
    if (elapsed >= DOT_VISIBLE_MS) return;

    const pulse = 0.5 + 0.5 * Math.sin((elapsed / 200) * Math.PI);
    const alpha = 0.3 + 0.2 * pulse;
    const radius = 18 + 4 * pulse;

    ctx.save();

    // Pulsing purple ring
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(180, 80, 255, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Orbiting particles
    for (let i = 0; i < 3; i++) {
      const particleAngle =
        (elapsed / 400 + (i * Math.PI * 2) / 3) % (Math.PI * 2);
      const px = sx + Math.cos(particleAngle) * (radius + 3);
      const py = sy + Math.sin(particleAngle) * (radius + 3);
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 120, 255, ${alpha * 0.8})`;
      ctx.fill();
    }

    ctx.restore();
  },
};

characterRegistry.register(mage);
