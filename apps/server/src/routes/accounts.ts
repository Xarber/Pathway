// SPDX-License-Identifier: AGPL-3.0-only
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { hash, token, passwordHash, passwordMatches } from '../auth.js';
import {
  place,
  coordinate,
  transport,
  precision,
  participantStatus,
} from '../../../../packages/shared/src/index.js';
import { coarse, rankMeetingPoints } from '../../../../packages/geospatial/src/index.js';
import { fail, activeStatuses, type RouteContext } from '../context.js';
const idSchema = z.object({ id: z.uuid() });
export function registerAccounts(ctx: RouteContext) {
  const { db, one, now, endpoint, room, openRoom, blocked, snapshot, geo, removeMember } = ctx;
  const registration = z
    .object({
      email: z.email().max(254),
      password: z.string().min(12).max(128),
      name: z.string().trim().min(1).max(80),
      username: z.string().regex(/^[a-z0-9_]{3,30}$/),
    })
    .strict();
  async function newSession(uid: string) {
    const value = token();
    await db.run('INSERT INTO sessions(hash,user_id,expires_at,created_at) VALUES(?,?,?,?)', [
      hash(value),
      uid,
      now() + 7 * 86400000,
      now(),
    ]);
    const p = await one('SELECT id,name,username FROM users WHERE id=?', [uid]);
    return { token: value, profile: p, expiresAt: now() + 7 * 86400000 };
  }
  endpoint(
    'POST',
    '/auth/register',
    async (_uid, b) => {
      const v = registration.parse(b);
      const id = randomUUID();
      await db.run(
        'INSERT INTO users(id,email,username,name,password,created_at) VALUES(?,?,?,?,?,?)',
        [id, v.email.toLowerCase(), v.username, v.name, await passwordHash(v.password), now()],
      );
      return newSession(id);
    },
    false,
  );
  endpoint(
    'POST',
    '/auth/login',
    async (_uid, b) => {
      const v = z
        .object({ email: z.email().max(254), password: z.string().min(1).max(128) })
        .strict()
        .parse(b);
      const u = await one('SELECT * FROM users WHERE email=?', [v.email.toLowerCase()]);
      const stored = u?.password || (await passwordHash('constant dummy password'));
      if (!(await passwordMatches(v.password, stored)) || !u)
        fail(401, 'Invalid email or password');
      return newSession(u.id);
    },
    false,
  );
  endpoint('POST', '/auth/logout', async (_uid, _b, _p, req) => {
    await db.run('DELETE FROM sessions WHERE hash=?', [hash(req.headers.authorization!.slice(7))]);
  });
  endpoint('POST', '/auth/refresh', async (uid, _b, _p, req) => {
    await db.run('DELETE FROM sessions WHERE hash=?', [hash(req.headers.authorization!.slice(7))]);
    return newSession(uid);
  });
  endpoint('GET', '/me', async (uid) =>
    one('SELECT id,name,username FROM users WHERE id=?', [uid]),
  );
  endpoint('GET', '/sessions', async (uid) =>
    (await db.all('SELECT hash,created_at,expires_at FROM sessions WHERE user_id=?', [uid])).map(
      (s) => ({ id: s.hash, createdAt: Number(s.created_at), expiresAt: Number(s.expires_at) }),
    ),
  );
  endpoint('DELETE', '/sessions/:id', async (uid, _b, p) => {
    await db.run('DELETE FROM sessions WHERE hash=? AND user_id=?', [p.id, uid]);
  });
}
