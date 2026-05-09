/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SPRITE_MANIFEST_ID = 'virtual:sprite-manifest';
const RESOLVED_SPRITE_MANIFEST_ID = '\0' + SPRITE_MANIFEST_ID;

/**
 * Scans `public/assets/sprites/<character>-animations/<anim>-<n>.png` and
 * exposes a virtual module whose default export is a manifest of frame
 * counts per character and animation. Consumed by usePlayerAnimations to
 * drive the loader exactly — no runtime probe-until-404, no hardcoded
 * per-character constants.
 */
function spriteManifestPlugin(spritesDir: string): Plugin {
  return {
    name: 'sprite-manifest',
    resolveId(id) {
      if (id === SPRITE_MANIFEST_ID) return RESOLVED_SPRITE_MANIFEST_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_SPRITE_MANIFEST_ID) return null;
      const manifest = buildSpriteManifest(spritesDir);
      return `export default ${JSON.stringify(manifest)};`;
    },
    handleHotUpdate({ file, server }) {
      // Invalidate when a sprite frame is added/removed during dev so
      // the hook reloads with the updated counts.
      if (!file.startsWith(spritesDir)) return;
      if (!file.endsWith('.png')) return;
      const mod = server.moduleGraph.getModuleById(RESOLVED_SPRITE_MANIFEST_ID);
      if (mod) server.moduleGraph.invalidateModule(mod);
      server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}

function buildSpriteManifest(
  spritesDir: string,
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  if (!existsSync(spritesDir)) return result;

  for (const entry of readdirSync(spritesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const charMatch = entry.name.match(/^(.+)-animations$/);
    if (!charMatch) continue;
    const [, characterId] = charMatch;
    const anims: Record<string, number> = {};

    const files = readdirSync(resolve(spritesDir, entry.name));
    for (const file of files) {
      const frameMatch = file.match(/^(.+)-(\d+)\.png$/);
      if (!frameMatch) continue;
      const [, animName, frameStr] = frameMatch;
      const frame = parseInt(frameStr, 10);
      anims[animName] = Math.max(anims[animName] ?? 0, frame);
    }
    result[characterId] = anims;
  }
  return result;
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    spriteManifestPlugin(resolve(__dirname, 'public/assets/sprites')),
  ],
  base: process.env.BASE_URL,
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
    setupFiles: resolve(__dirname, './src/test/setup.ts'),
    exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/e2e/**'],
  },
});
