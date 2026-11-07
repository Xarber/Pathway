// SPDX-License-Identifier: AGPL-3.0-only
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
export const token = () => randomBytes(32).toString('base64url');
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function derive(password: string, salt: string, legacy = false) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      legacy
        ? { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
        : { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return 'scrypt-v1:' + salt + ':' + (await derive(password, salt)).toString('hex');
}
export async function passwordMatches(password: string, stored: string) {
  const parts = stored.split(':');
  const legacy = parts.length === 2;
  const salt = legacy ? parts[0] : parts[1],
    expected = legacy ? parts[1] : parts[2];
  if (
    (!legacy && parts[0] !== 'scrypt-v1') ||
    !salt ||
    !expected ||
    !/^[a-f0-9]{128}$/.test(expected)
  )
    return false;
  return timingSafeEqual(await derive(password, salt, legacy), Buffer.from(expected, 'hex'));
}
