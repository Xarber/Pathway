// SPDX-License-Identifier: AGPL-3.0-only
// Two isolated browser sessions; synthetic geolocation and test accounts, real HTTP/WS API.
import { chromium, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { extname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../apps/server/src/app.js';
import { database } from '../apps/server/src/db.js';
const root = resolve('apps/mobile/dist');
const folder = await mkdtemp(join(tmpdir(), 'pathway-browser-'));
const { app } = await createApp({ db: await database(join(folder, 'test.sqlite')) });
await app.listen({ host: '127.0.0.1', port: 3001 });
const mime: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};
const staticServer = createServer(async (req, res) => {
  try {
    let path = new URL(req.url || '/', 'http://localhost').pathname;
    path = path === '/' ? '/index.html' : path;
    let file = resolve(root, '.' + path);
    if (!file.startsWith(root + '/')) throw Error();
    let bytes;
    try {
      bytes = await readFile(file);
    } catch {
      if (extname(file)) throw Error();
      file = join(root, 'index.html');
      bytes = await readFile(file);
    }
    res.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise<void>((r) => staticServer.listen(4173, '127.0.0.1', r));
const browser = await chromium.launch({
  headless: true,
  channel: process.env.CI ? undefined : 'chrome',
});
const errors: string[] = [];
const a = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  geolocation: { latitude: 41.89021, longitude: 12.49223 },
  permissions: ['geolocation'],
});
const b = await browser.newContext({
  viewport: { width: 393, height: 852 },
  geolocation: { latitude: 41.8929, longitude: 12.4833 },
  permissions: ['geolocation'],
});
const alice = await a.newPage(),
  bob = await b.newPage();
for (const page of [alice, bob]) {
  page.on('pageerror', (e) => {
    errors.push(e.message);
    console.error('PAGE ERROR', e.message);
  });
  page.on('console', (m) => {
    if (m.type() === 'error') console.error('CONSOLE', m.text());
  });
}
const suffix = Date.now().toString().slice(-7);
await mkdir('artifacts', { recursive: true });
async function register(page: typeof alice, name: string) {
  await page.goto('http://localhost:4173');
  await page.getByRole('textbox', { name: 'Display name', exact: true }).fill('QA ' + name);
  await page
    .getByRole('textbox', { name: 'Username', exact: true })
    .fill(name.toLowerCase() + suffix);
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill(name + suffix + '@example.test');
  await page
    .getByRole('textbox', { name: 'Password', exact: true })
    .fill('test-browser-password-123');
  await page.getByRole('button', { name: 'Let’s get going', exact: true }).click();
  await expect(page.getByText('Hey QA, let’s meet.', { exact: true })).toBeInViewport();
}
try {
  await alice.goto('http://localhost:4173');
  await expect(alice.getByRole('button', { name: 'Let’s get going', exact: true })).toBeVisible();
  await alice.screenshot({ path: 'artifacts/welcome-desktop.png', fullPage: true });
  await register(alice, 'Alice');
  await register(bob, 'Bob');
  await bob.screenshot({ path: 'artifacts/home-mobile.png', fullPage: true });
  await alice.getByRole('button', { name: 'Plan a journey', exact: true }).click();
  await alice
    .getByRole('textbox', { name: 'Destination label', exact: true })
    .fill('QA School meetup');
  await alice.getByRole('textbox', { name: 'Latitude', exact: true }).fill('41.8929');
  await alice.getByRole('textbox', { name: 'Longitude', exact: true }).fill('12.4833');
  await alice.getByRole('button', { name: 'Use these coordinates', exact: true }).click();
  if (process.env.ROUTING_URL) {
    await alice.getByRole('button', { name: 'Preview real route', exact: true }).click();
    await expect(alice.getByText('Valhalla · OpenStreetMap', { exact: false })).toBeVisible({
      timeout: 20000,
    });
  }
  await alice
    .getByRole('textbox', { name: 'Journey title', exact: true })
    .fill('QA School together');
  await alice.getByRole('button', { name: 'Create Journey Room', exact: true }).click();
  await expect(alice.getByText('Your sharing, your choice', { exact: true })).toBeVisible();
  await alice
    .getByRole('textbox', { name: 'Friend’s username (optional)', exact: true })
    .fill('bob' + suffix);
  await alice.getByRole('button', { name: 'Create invitation', exact: true }).click();
  await expect(
    alice.getByRole('textbox', { name: 'Invitation token · expires in 1 hour', exact: true }),
  ).toBeVisible();
  await bob.getByRole('tab', { name: 'Journeys', exact: true }).click();
  await expect(bob.getByRole('button', { name: 'Accept', exact: true })).toBeVisible({
    timeout: 30000,
  });
  await bob.getByRole('button', { name: 'Accept', exact: true }).click();
  await expect(bob.getByText('QA School together', { exact: true })).toBeVisible();
  await expect(alice.getByRole('button', { name: 'QA Bob', exact: true })).toBeVisible();
  await alice.getByRole('button', { name: 'Precise', exact: true }).click();
  await alice.getByRole('button', { name: 'QA Bob', exact: true }).click();
  await alice
    .getByRole('button', { name: 'Enable for selected people · 1 hour', exact: true })
    .click();
  await expect(alice.getByText('Delivering foreground updates', { exact: false })).toBeVisible({
    timeout: 15000,
  });
  await expect(bob.getByText('precise sharing', { exact: false })).toBeVisible({ timeout: 15000 });
  await alice.screenshot({ path: 'artifacts/room-desktop.png', fullPage: true });
  await bob.screenshot({ path: 'artifacts/room-mobile.png', fullPage: true });
  await alice.getByRole('button', { name: 'Stop sharing now', exact: true }).click();
  await expect(alice.getByText('Location sharing is off', { exact: true })).toBeVisible();
  await expect(bob.getByText('precise sharing', { exact: false })).toHaveCount(0);
  const manifest = await alice.evaluate(async () => {
    const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    return fetch(link.href).then((r) => r.json());
  });
  expect(manifest.display).toBe('standalone');
  await alice.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await alice.reload();
  await expect(alice.getByRole('button', { name: 'QA Alice', exact: true })).toBeVisible();
  await a.setOffline(true);
  await alice.reload();
  await expect(alice.getByRole('button', { name: 'QA Alice', exact: true })).toBeVisible();
  await a.setOffline(false);
  await bob.getByRole('button', { name: 'QA Bob', exact: true }).click();
  await expect(bob.getByText('Privacy dashboard', { exact: true })).toBeVisible();
  const version = bob.getByRole('button', { name: 'Pathway 0.1.0', exact: true });
  await version.click();
  await version.click();
  await version.click();
  await expect(bob.getByRole('button', { name: 'Developer Ideas', exact: true })).toBeVisible();
  await bob.getByRole('button', { name: 'Developer Ideas', exact: true }).click();
  await bob.getByRole('textbox', { name: 'Idea title', exact: true }).fill('QA idea persistence');
  await bob.getByRole('button', { name: 'Save idea', exact: true }).click();
  await expect(bob.getByText('QA idea persistence', { exact: true })).toBeVisible();
  await bob.getByRole('button', { name: 'Back to Settings', exact: true }).click();
  await bob.getByRole('tab', { name: 'Home', exact: true }).click();
  await bob.getByRole('button', { name: 'QA Bob', exact: true }).click();
  await expect(bob.getByRole('button', { name: 'Developer Ideas', exact: true })).toHaveCount(0);
  await bob.reload();
  await bob.getByRole('button', { name: 'QA Bob', exact: true }).click();
  const reopened = bob.getByRole('button', { name: 'Pathway 0.1.0', exact: true });
  await reopened.click();
  await reopened.click();
  await reopened.click();
  await bob.getByRole('button', { name: 'Developer Ideas', exact: true }).click();
  await expect(bob.getByText('QA idea persistence', { exact: true })).toBeVisible();
  await bob.screenshot({ path: 'artifacts/ideas-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
  console.log(
    'PASS: two browser accounts → route/room → targeted invitation → acceptance → precise foreground collection → second-client delivery → revoke → position removed; PWA offline reload; Developer Ideas. Synthetic browser GPS, no native device claim.',
  );
} catch (error) {
  await alice.screenshot({ path: 'artifacts/browser-failure.png', fullPage: true });
  console.error('BODY', await alice.locator('body').innerText());
  throw error;
} finally {
  await browser.close();
  await new Promise<void>((r) => staticServer.close(() => r()));
  await app.close();
  await rm(folder, { recursive: true });
}
