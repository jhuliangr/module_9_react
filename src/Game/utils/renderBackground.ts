import { WORLD_SIZE } from '#shared/constants';
import { SCALE_X, SCALE_Y } from './canvasConstants';

const WORLD_W = WORLD_SIZE * SCALE_X;
const WORLD_H = WORLD_SIZE * SCALE_Y;

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  bgImage: HTMLImageElement | null,
) {
  if (!bgImage) return;
  ctx.drawImage(bgImage, offsetX, offsetY, WORLD_W, WORLD_H);
}
