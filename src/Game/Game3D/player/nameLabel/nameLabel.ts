import { PLAYER_HEIGHT } from '#shared/renderer/utils/constants';
import { CanvasTexture, LinearFilter, Sprite, SpriteMaterial } from 'three';

const NAME_LABEL_Y = PLAYER_HEIGHT + 2;
const NAME_LABEL_WIDTH = 2;
const NAME_LABEL_HEIGHT = 0.5;

export function disposeNameLabel(sprite: Sprite): void {
  const material = sprite.material as SpriteMaterial;
  material.map?.dispose();
  material.dispose();
}

export function createNameLabel(name: string): Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.strokeText(name, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;

  const material = new SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
  });

  const sprite = new Sprite(material);
  sprite.scale.set(NAME_LABEL_WIDTH, NAME_LABEL_HEIGHT, 1);
  sprite.position.y = NAME_LABEL_Y;
  return sprite;
}
