import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveServerConfig } from '../src/lib/server-config';

test('production uses the configured HTTPS origin and rejects unsafe or absent configuration', () => {
  assert.deepEqual(resolveServerConfig('https://pathway.xcenter.it/', true), {
    origin: 'https://pathway.xcenter.it',
    canSwitch: false,
  });
  for (const value of [
    undefined,
    'invalid',
    'http://pathway.xcenter.it',
    'https://localhost',
    'https://user:password@example.org',
    'https://example.org/api',
  ]) {
    assert.deepEqual(resolveServerConfig(value, true), { origin: '', canSwitch: false });
  }
});

test('unconfigured development retains the localhost default and instance controls', () => {
  assert.deepEqual(resolveServerConfig(undefined, false), {
    origin: 'http://localhost:3001',
    canSwitch: true,
  });
});
