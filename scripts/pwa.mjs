// SPDX-License-Identifier: AGPL-3.0-only
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const dir = 'dist';
const { VERSION, releases } = await import('../packages/shared/src/index.ts');
await writeFile(
  dir + '/release.json',
  JSON.stringify({
    version: VERSION,
    channel: 'development',
    highlights: releases[0].added,
    improvements: releases[0].security,
  }),
);
async function walk(path) {
  const entries = await readdir(path, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) => (e.isDirectory() ? walk(path + '/' + e.name) : [path + '/' + e.name])),
    )
  ).flat();
}
const files = await walk(dir);
const assets = files
  .filter((f) => !f.endsWith('.map') && !f.endsWith('sw.js') && !f.endsWith('release.json'))
  .map((f) => '/' + f.slice(dir.length + 1));
const build = createHash('sha256')
  .update(await readFile(dir + '/index.html'))
  .digest('hex')
  .slice(0, 12);
const sw = `const CACHE='pathway-${build}';const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pathway-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data==='APPLY_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||!ASSETS.includes(url.pathname)&&event.request.mode!=='navigate')return;event.respondWith(event.request.mode==='navigate'?fetch(event.request).catch(()=>caches.match('/index.html')):caches.match(event.request).then(hit=>hit||fetch(event.request)));});`;
await writeFile(dir + '/sw.js', sw);
console.log('PWA assets generated:', assets.length, 'cache', build);
