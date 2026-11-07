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
export function registerSocial(ctx: RouteContext) {
  const { db, one, now, endpoint, room, openRoom, blocked, snapshot, geo, removeMember } = ctx;
  endpoint('GET', '/users/search', async (uid, _b, _p, req) => {
    const { q } = z.object({ q: z.string().regex(/^[a-z0-9_]{3,30}$/) }).parse(req.query);
    const out = [];
    for (const u of await db.all(
      'SELECT id,name,username FROM users WHERE username LIKE ? AND id<>? LIMIT 10',
      [q + '%', uid],
    ))
      if (!(await blocked(uid, u.id))) out.push(u);
    return out;
  });
  endpoint('GET', '/friends', async (uid) => {
    const result = [];
    for (const f of await db.all(
      'SELECT f.*,u.name,u.username FROM friendships f JOIN users u ON u.id=CASE WHEN f.sender_id=? THEN f.target_id ELSE f.sender_id END WHERE f.sender_id=? OR f.target_id=?',
      [uid, uid, uid],
    ))
      if (!(await blocked(uid, f.sender_id === uid ? f.target_id : f.sender_id))) result.push(f);
    return result;
  });
  endpoint('POST', '/friends/requests', async (uid, b) => {
    const { username } = z
      .object({ username: z.string().max(30) })
      .strict()
      .parse(b);
    const u = await one('SELECT id FROM users WHERE username=?', [username]);
    if (!u || u.id === uid || (await blocked(uid, u.id))) fail(404, 'User unavailable');
    const existing = await one(
      'SELECT id FROM friendships WHERE (sender_id=? AND target_id=?) OR (sender_id=? AND target_id=?)',
      [uid, u.id, u.id, uid],
    );
    if (existing) fail(409, 'A relationship already exists');
    await db.run('INSERT INTO friendships VALUES(?,?,?,?,?)', [
      randomUUID(),
      uid,
      u.id,
      'pending',
      now(),
    ]);
  });
  endpoint('POST', '/friends/requests/:id/accept', async (uid, _b, p) => {
    const f = await one('SELECT * FROM friendships WHERE id=? AND target_id=?', [p.id, uid]);
    if (!f || (await blocked(uid, f.sender_id))) fail(404, 'Request unavailable');
    await db.run('UPDATE friendships SET status=? WHERE id=?', ['accepted', p.id]);
  });
  endpoint('DELETE', '/friends/:id', async (uid, _b, p) => {
    await db.run('DELETE FROM friendships WHERE id=? AND (sender_id=? OR target_id=?)', [
      p.id,
      uid,
      uid,
    ]);
  });
  endpoint('POST', '/blocks', async (uid, b) => {
    const { userId } = z.object({ userId: z.uuid() }).strict().parse(b);
    if (userId === uid) fail(400, 'Cannot block yourself');
    await db.run('INSERT INTO blocks VALUES(?,?) ON CONFLICT DO NOTHING', [uid, userId]);
    await db.run(
      'DELETE FROM friendships WHERE (sender_id=? AND target_id=?) OR (sender_id=? AND target_id=?)',
      [uid, userId, userId, uid],
    );
    await db.run(
      'DELETE FROM invitations WHERE (inviter_id=? AND target_id=?) OR (inviter_id=? AND target_id=?)',
      [uid, userId, userId, uid],
    );
    for (const g of await db.all('SELECT * FROM grants WHERE user_id=? OR user_id=?', [
      uid,
      userId,
    ])) {
      const denied = g.user_id === uid ? userId : uid;
      await db.run('UPDATE grants SET viewers=? WHERE journey_id=? AND user_id=?', [
        JSON.stringify(JSON.parse(g.viewers).filter((v: string) => v !== denied)),
        g.journey_id,
        g.user_id,
      ]);
    }
  });
  endpoint('POST', '/reports', async (uid, b) => {
    const v = z
      .object({ userId: z.uuid(), reason: z.string().trim().min(5).max(2000) })
      .strict()
      .parse(b);
    await db.run('INSERT INTO reports VALUES(?,?,?,?,?)', [
      randomUUID(),
      uid,
      v.userId,
      v.reason,
      now(),
    ]);
    return {
      received: true,
      notice: 'Stored for this instance administrator; Pathway is not an emergency service.',
    };
  });
  endpoint('GET', '/saved-places', async (uid) =>
    (await db.all('SELECT * FROM saved_places WHERE user_id=?', [uid])).map((p) => ({
      id: p.id,
      place: JSON.parse(p.place),
    })),
  );
  endpoint('POST', '/saved-places', async (uid, b) => {
    const v = place.parse(b);
    await db.run('INSERT INTO saved_places VALUES(?,?,?)', [randomUUID(), uid, JSON.stringify(v)]);
  });
  endpoint('DELETE', '/saved-places/:id', async (uid, _b, p) => {
    await db.run('DELETE FROM saved_places WHERE id=? AND user_id=?', [p.id, uid]);
  });
  endpoint('DELETE', '/history', async (uid) => {
    for (const j of await db.all(
      "SELECT j.id,j.owner_id FROM journeys j JOIN participants p ON p.journey_id=j.id WHERE p.user_id=? AND j.status NOT IN ('active','scheduled')",
      [uid],
    )) {
      if (j.owner_id === uid) await db.run('DELETE FROM journeys WHERE id=?', [j.id]);
      else await removeMember(j.id, uid);
    }
  });
  endpoint('DELETE', '/account', async (uid, b) => {
    const v = z
      .object({ password: z.string().max(128) })
      .strict()
      .parse(b);
    const u = await one('SELECT password FROM users WHERE id=?', [uid]);
    if (!(await passwordMatches(v.password, u.password))) fail(403, 'Password confirmation failed');
    await db.run('DELETE FROM journeys WHERE owner_id=?', [uid]);
    await db.run('DELETE FROM invitations WHERE inviter_id=? OR target_id=?', [uid, uid]);
    await db.run('DELETE FROM messages WHERE sender_id=?', [uid]);
    await db.run('DELETE FROM proposals WHERE proposer=?', [uid]);
    await db.run('DELETE FROM reports WHERE reporter_id=? OR target_id=?', [uid, uid]);
    await db.run('DELETE FROM users WHERE id=?', [uid]);
  });
}
