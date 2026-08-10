import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.resolve(here, '..', 'scripts', 'sw.template.js');

/**
 * Stamps the emitted service worker with a per-build cache name and the
 * real list of emitted assets, so every deploy installs a fresh SW and
 * precaches the new hashed files (offline-first load keeps working).
 */
export function swStamp(): Plugin {
  return {
    name: 'ccc:sw-stamp',
    apply: 'build',
    async writeBundle() {
      const outDir = 'dist';
      const htmlPath = path.resolve(outDir, 'index.html');
      const assetsDir = path.resolve(outDir, 'assets');
      const swPath = path.resolve(outDir, 'sw.js');

      const assetFiles = existsSync(assetsDir)
        ? readdirSync(assetsDir)
            .filter((f) => /\.(js|css)$/.test(f))
            .map((f) => `/assets/${f}`)
        : [];

      const htmlAssets = existsSync(htmlPath)
        ? [...readFileSync(htmlPath, 'utf8').matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(
            (m) => m[1],
          )
        : [];

      const precache = ['/', '/index.html', ...new Set([...assetFiles, ...htmlAssets])];
      const version = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

      try {
        const template = readFileSync(templatePath, 'utf8');
        const output = template
          .replaceAll('__CACHE__', JSON.stringify(`ccc-shell-${version}`))
          .replaceAll('__PRECACHE__', JSON.stringify(precache));
        writeFileSync(swPath, output, 'utf8');
        this.info(`[sw-stamp] wrote ${swPath} with ${precache.length} precached URLs`);
      } catch (err) {
        this.warn(`[sw-stamp] failed to stamp service worker: ${String(err)}`);
      }
    },
  };
}
