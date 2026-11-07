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
export function registerJourneys(ctx: RouteContext) {
  const { db, one, now, endpoint, room, openRoom, blocked, snapshot, geo, removeMember } = ctx;
  endpoint('GET', '/journeys', async (uid) => {
    const result = [];
    for (const r of await db.all('SELECT journey_id FROM participants WHERE user_id=?', [uid]))
      result.push(await snapshot(r.journey_id, uid));
    return result.sort((a, b) => b.createdAt - a.createdAt);
  });
  endpoint('POST', '/journeys', async (uid, b) => {
    const v = z
      .object({
        title: z.string().trim().min(1).max(120),
        description: z.string().max(1000).default(''),
        destination: place,
        mode: transport.default('walking'),
        expiresAt: z
          .number()
          .int()
          .min(now() + 60000)
          .max(now() + 86400000)
          .optional(),
      })
      .strict()
      .parse(b);
    const id = randomUUID();
    await db.run(
      'INSERT INTO journeys(id,owner_id,title,description,destination,meeting_point,status,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?)',
      [
        id,
        uid,
        v.title,
        v.description,
        JSON.stringify(v.destination),
        null,
        'scheduled',
        now(),
        v.expiresAt || now() + 8 * 3600000,
      ],
    );
    await db.run(
      'INSERT INTO participants(journey_id,user_id,role,status,mode) VALUES(?,?,?,?,?)',
      [id, uid, 'owner', 'accepted', v.mode],
    );
    return snapshot(id, uid);
  });
  endpoint('GET', '/journeys/:id', async (uid, _b, p) => snapshot(idSchema.parse(p).id, uid));
  endpoint('POST', '/journeys/:id/start', async (uid, _b, p) => {
    await openRoom(p.id, uid, true);
    await db.run('UPDATE journeys SET status=? WHERE id=?', ['active', p.id]);
    return snapshot(p.id, uid);
  });
  for (const action of ['complete', 'cancel'])
    endpoint('POST', `/journeys/:id/${action}`, async (uid, _b, p) => {
      await openRoom(p.id, uid, true);
      await db.run('UPDATE journeys SET status=? WHERE id=?', [
        action === 'complete' ? 'completed' : 'cancelled',
        p.id,
      ]);
      await db.run('DELETE FROM grants WHERE journey_id=?', [p.id]);
      await db.run('DELETE FROM etas WHERE journey_id=?', [p.id]);
      await db.run('DELETE FROM invitations WHERE journey_id=?', [p.id]);
      return snapshot(p.id, uid);
    });
  endpoint('PATCH', '/journeys/:id', async (uid, b, p) => {
    await openRoom(p.id, uid, true);
    const v = z
      .object({
        title: z.string().trim().min(1).max(120).optional(),
        destination: place.optional(),
      })
      .strict()
      .parse(b);
    if (v.title) await db.run('UPDATE journeys SET title=? WHERE id=?', [v.title, p.id]);
    if (v.destination) {
      await db.run('UPDATE journeys SET destination=? WHERE id=?', [
        JSON.stringify(v.destination),
        p.id,
      ]);
      await db.run('DELETE FROM etas WHERE journey_id=?', [p.id]);
    }
    return snapshot(p.id, uid);
  });
  endpoint('POST', '/journeys/:id/invite', async (uid, b, p) => {
    const r = await openRoom(p.id, uid, true);
    const v = z
      .object({ username: z.string().max(30).optional() })
      .strict()
      .parse(b);
    const target = v.username
      ? await one('SELECT id FROM users WHERE username=?', [v.username])
      : null;
    if (v.username && !target) fail(404, 'User unavailable');
    if (
      target &&
      ((await blocked(uid, target.id)) ||
        (await one('SELECT user_id FROM participants WHERE journey_id=? AND user_id=?', [
          p.id,
          target.id,
        ])))
    )
      fail(409, 'Invitation unavailable');
    const invite = token();
    await db.run(
      'INSERT INTO invitations(hash,journey_id,inviter_id,target_id,expires_at) VALUES(?,?,?,?,?)',
      [
        hash(invite),
        p.id,
        uid,
        target?.id || null,
        Math.min(now() + 3600000, Number(r.expires_at)),
      ],
    );
    return { token: invite, expiresAt: Math.min(now() + 3600000, Number(r.expires_at)) };
  });
  endpoint('GET', '/invitations', async (uid) => {
    const rows = await db.all(
      'SELECT i.hash AS id,i.journey_id,j.title,i.inviter_id FROM invitations i JOIN journeys j ON j.id=i.journey_id WHERE i.target_id=? AND i.used_at IS NULL AND i.expires_at>?',
      [uid, now()],
    );
    const out = [];
    for (const r of rows) if (!(await blocked(uid, r.inviter_id))) out.push(r);
    return out;
  });
  async function accept(uid: string, i: any) {
    if (!i || i.used_at || Number(i.expires_at) <= now() || (i.target_id && i.target_id !== uid))
      fail(404, 'Invitation unavailable');
    const journey = await one('SELECT * FROM journeys WHERE id=?', [i.journey_id]);
    if (!journey || !activeStatuses.includes(journey.status) || Number(journey.expires_at) <= now())
      fail(409, 'Journey is closed');
    for (const m of await db.all('SELECT user_id FROM participants WHERE journey_id=?', [
      i.journey_id,
    ]))
      if (await blocked(uid, m.user_id)) fail(403, 'Invitation unavailable');
    const count = await one('SELECT COUNT(*) AS n FROM participants WHERE journey_id=?', [
      i.journey_id,
    ]);
    if (Number(count.n) >= 20) fail(409, 'Room is full');
    await db.run(
      'INSERT INTO participants(journey_id,user_id,role,status,mode) VALUES(?,?,?,?,?) ON CONFLICT(journey_id,user_id) DO NOTHING',
      [i.journey_id, uid, 'participant', 'accepted', 'walking'],
    );
    await db.run('UPDATE invitations SET used_at=? WHERE hash=?', [now(), i.hash]);
    return snapshot(i.journey_id, uid);
  }
  endpoint('POST', '/invitations/accept', async (uid, b) => {
    const v = z
      .object({ token: z.string().min(40).max(100) })
      .strict()
      .parse(b);
    return accept(uid, await one('SELECT * FROM invitations WHERE hash=?', [hash(v.token)]));
  });
  endpoint('POST', '/invitations/:id/accept', async (uid, _b, p) =>
    accept(uid, await one('SELECT * FROM invitations WHERE hash=? AND target_id=?', [p.id, uid])),
  );
  endpoint('POST', '/invitations/:id/decline', async (uid, _b, p) => {
    await db.run('DELETE FROM invitations WHERE hash=? AND target_id=?', [p.id, uid]);
  });
  endpoint('DELETE', '/journeys/:id/invitations', async (uid, _b, p) => {
    await room(p.id, uid, true);
    await db.run('DELETE FROM invitations WHERE journey_id=?', [p.id]);
  });
  endpoint('POST', '/journeys/:id/leave', async (uid, _b, p) => {
    const r = await room(p.id, uid);
    if (r.owner_id === uid) fail(409, 'Organizer must end the journey before leaving');
    await removeMember(p.id, uid);
  });
  endpoint('DELETE', '/journeys/:id/participants/:userId', async (uid, _b, p) => {
    await room(p.id, uid, true);
    if (uid === p.userId) fail(409, 'End the journey instead');
    await removeMember(p.id, p.userId);
  });
  endpoint('PATCH', '/journeys/:id/status', async (uid, b, p) => {
    await openRoom(p.id, uid);
    const v = z
      .object({
        status: participantStatus,
        mode: transport.optional(),
        delayMinutes: z.number().int().min(0).max(180).default(0),
      })
      .strict()
      .parse(b);
    await db.run(
      'UPDATE participants SET status=?,delay_minutes=? WHERE journey_id=? AND user_id=?',
      [v.status, v.delayMinutes, p.id, uid],
    );
    if (v.mode) {
      await db.run('UPDATE participants SET mode=? WHERE journey_id=? AND user_id=?', [
        v.mode,
        p.id,
        uid,
      ]);
      await db.run('DELETE FROM etas WHERE journey_id=? AND user_id=?', [p.id, uid]);
    }
    if (v.status === 'arrived' || v.status === 'paused')
      await db.run('DELETE FROM grants WHERE journey_id=? AND user_id=?', [p.id, uid]);
    return snapshot(p.id, uid);
  });
}
