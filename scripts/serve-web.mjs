// SPDX-License-Identifier: AGPL-3.0-only
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};
export function createWebServer(directory) {
  const root = resolve(directory);
  return createServer(async (req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method || '')) {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        res.end();
        return;
      }
      const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
      const requested = resolve(root, '.' + pathname);
      if (requested !== root && !requested.startsWith(root + sep)) {
        res.writeHead(400);
        res.end();
        return;
      }
      let chosen;
      for (const candidate of [requested, requested + '.html', resolve(requested, 'index.html')]) {
        try {
          if ((await stat(candidate)).isFile()) {
            chosen = candidate;
            break;
          }
        } catch {}
      }
      if (!chosen) {
        if (pathname.startsWith('/api/') || extname(pathname)) {
          res.writeHead(404);
          res.end();
          return;
        }
        chosen = resolve(root, 'index.html');
      }
      const content = await readFile(chosen);
      res.writeHead(200, {
        'Content-Type': mime[extname(chosen)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createWebServer(process.env.PATHWAY_WEB_ROOT || 'apps/mobile/dist');
  server.listen(Number(process.env.PORT || 4173), process.env.HOST || '127.0.0.1', () =>
    console.log('Pathway static web service is listening.'),
  );
}
