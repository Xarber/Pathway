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
export function registerSharing(ctx: RouteContext) {
  const { db, one, now, endpoint, room, openRoom, blocked, snapshot, geo, removeMember } = ctx;
  endpoint('POST', '/journeys/:id/sharing', async (uid, b, p) => {
    const r = await openRoom(p.id, uid);
    const v = z
      .object({
        mode: precision,
        expiresAt: z
          .number()
          .int()
          .min(now() + 1000)
          .max(now() + 8 * 3600000),
        viewers: z.array(z.uuid()).max(19),
        allowMeeting: z.boolean().default(false),
      })
      .strict()
      .parse(b);
    for (const viewer of v.viewers) {
      if (
        !(await one('SELECT user_id FROM participants WHERE journey_id=? AND user_id=?', [
          p.id,
          viewer,
        ])) ||
        viewer === uid ||
        (await blocked(uid, viewer))
      )
        fail(403, 'Viewer is not an authorized participant');
    }
    await db.run('DELETE FROM grants WHERE journey_id=? AND user_id=?', [p.id, uid]);
    await db.run('DELETE FROM etas WHERE journey_id=? AND user_id=?', [p.id, uid]);
    if (v.mode !== 'off')
      await db.run(
        'INSERT INTO grants(journey_id,user_id,mode,viewers,allow_meeting,expires_at) VALUES(?,?,?,?,?,?)',
        [
          p.id,
          uid,
          v.mode,
          JSON.stringify([...new Set(v.viewers)]),
          v.allowMeeting ? 1 : 0,
          Math.min(v.expiresAt, Number(r.expires_at)),
        ],
      );
    return snapshot(p.id, uid);
  });
  endpoint('DELETE', '/journeys/:id/sharing', async (uid, _b, p) => {
    await room(p.id, uid);
    await db.run('DELETE FROM grants WHERE journey_id=? AND user_id=?', [p.id, uid]);
    await db.run('DELETE FROM etas WHERE journey_id=? AND user_id=?', [p.id, uid]);
    return snapshot(p.id, uid);
  });
  endpoint('POST', '/sharing/stop-all', async (uid) => {
    await db.run('DELETE FROM grants WHERE user_id=?', [uid]);
    await db.run('DELETE FROM etas WHERE user_id=?', [uid]);
  });
  endpoint('GET', '/privacy', async (uid) => {
    const out = [];
    for (const g of await db.all('SELECT * FROM grants WHERE user_id=? AND expires_at>?', [
      uid,
      now(),
    ])) {
      const j = await snapshot(g.journey_id, uid);
      out.push({
        journeyId: g.journey_id,
        title: j.title,
        mode: g.mode,
        expiresAt: Number(g.expires_at),
        viewers: j.participants
          .filter((p) => JSON.parse(g.viewers).includes(p.id))
          .map((p) => ({ id: p.id, name: p.name })),
        lastUpdate: j.participants.find((p) => p.id === uid)?.location?.timestamp || null,
      });
    }
    return out;
  });
  endpoint('POST', '/journeys/:id/location', async (uid, b, p) => {
    await openRoom(p.id, uid);
    const v = coordinate
      .extend({
        accuracy: z.number().min(0).max(100000),
        timestamp: z
          .number()
          .int()
          .min(now() - 120000)
          .max(now() + 10000),
      })
      .strict()
      .parse(b);
    const g = await one('SELECT * FROM grants WHERE journey_id=? AND user_id=? AND expires_at>?', [
      p.id,
      uid,
      now(),
    ]);
    if (!g || !['precise', 'approximate'].includes(g.mode)) fail(403, 'No active location grant');
    const last = await one(
      'SELECT timestamp FROM live_locations WHERE journey_id=? AND user_id=?',
      [p.id, uid],
    );
    if (last && Number(last.timestamp) >= v.timestamp) fail(409, 'Out-of-order location update');
    if (last && v.timestamp - Number(last.timestamp) < 3000)
      fail(429, 'Location updates are too frequent');
    const fix =
      g.mode === 'approximate' ? { ...coarse(v), accuracy: Math.max(1600, v.accuracy) } : v;
    await db.run(
      'INSERT INTO live_locations(journey_id,user_id,latitude,longitude,accuracy,timestamp) VALUES(?,?,?,?,?,?) ON CONFLICT(journey_id,user_id) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,accuracy=excluded.accuracy,timestamp=excluded.timestamp',
      [p.id, uid, fix.latitude, fix.longitude, fix.accuracy, v.timestamp],
    );
    return { accepted: true, timestamp: v.timestamp };
  });
}
