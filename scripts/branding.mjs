// SPDX-License-Identifier: AGPL-3.0-only
import sharp from 'sharp';
import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
const source = await readFile('assets/branding/icon.svg');
await mkdir('apps/mobile/assets', { recursive: true });
for (const [path, size] of [
  ['apps/mobile/assets/icon.png', 1024],
  ['apps/mobile/public/icon-192.png', 192],
  ['apps/mobile/public/icon-512.png', 512],
  ['apps/mobile/public/maskable-512.png', 512],
  ['apps/mobile/public/apple-touch-icon.png', 180],
])
  await sharp(source).resize(size, size).png().toFile(path);
const foreground = source
  .toString()
  .replace(/<g id="background">.*?<\/g>/s, '')
  .replace(/viewBox="0 0 1024 1024"/, 'viewBox="-170 -170 1364 1364"');
await writeFile('assets/branding/foreground.svg', foreground);
await sharp(Buffer.from(foreground)).png().toFile('apps/mobile/assets/adaptive-foreground.png');
const mono = foreground.replace(/fill="#6269F5"/g, 'fill="#000"').replace(/#DDDFFF/g, '#FFF');
await writeFile('assets/branding/monochrome.svg', mono);
await sharp(Buffer.from(mono)).png().toFile('apps/mobile/assets/monochrome.png');
await copyFile('assets/branding/icon.svg', 'apps/mobile/public/icon.svg');
await copyFile('node_modules/leaflet/dist/leaflet.css', 'apps/mobile/public/leaflet.css');
