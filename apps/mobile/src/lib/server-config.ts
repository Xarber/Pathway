// SPDX-License-Identifier: AGPL-3.0-only
export function resolveServerConfig(value: string | undefined, production: boolean) {
  const candidate = value?.trim();
  if (!production) {
    return { origin: candidate || 'http://localhost:3001', canSwitch: !candidate };
  }
  try {
    const url = new URL(candidate || '');
    if (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      !['localhost', '127.0.0.1', '[::1]', '10.0.2.2'].includes(url.hostname)
    )
      return { origin: url.origin, canSwitch: false };
  } catch {
    // Malformed configuration uses the same unavailable state as a missing origin.
  }
  return { origin: '', canSwitch: false };
}
