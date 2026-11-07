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
import { fail, activeStatuses, deferred, type RouteContext } from '../context.js';
const idSchema = z.object({ id: z.uuid() });
export function registerCoordination(ctx: RouteContext) {
  const { db, one, now, endpoint, room, openRoom, blocked, snapshot, geo, removeMember } = ctx;
  endpoint('POST', '/routes/calculate', async (uid, b) => {
    const v = z
      .object({ origin: coordinate, destination: coordinate, mode: transport })
      .strict()
      .parse(b);
    return deferred(
      () => geo.route(v.origin, v.destination, v.mode),
      async (result) => result,
    );
  });
  endpoint('GET', '/places/search', async (_uid, _b, _p, req) => {
    const q = z
      .object({ q: z.string().trim().min(3).max(200) })
      .strict()
      .parse(req.query);
    return deferred(
      () => geo.search(q.q),
      async (result) => result,
    );
  });
  endpoint('POST', '/journeys/:id/eta', async (uid, b, p) => {
    const r = await openRoom(p.id, uid);
    const v = z
      .object({
        origin: coordinate.optional(),
        arrival: z
          .number()
          .int()
          .min(now())
          .max(now() + 86400000)
          .optional(),
      })
      .strict()
      .parse(b);
    const g = await one('SELECT * FROM grants WHERE journey_id=? AND user_id=? AND expires_at>?', [
      p.id,
      uid,
      now(),
    ]);
    if (!g || !['eta', 'precise', 'approximate'].includes(g.mode))
      fail(403, 'Choose ETA or location sharing first');
    const member = await one('SELECT * FROM participants WHERE journey_id=? AND user_id=?', [
      p.id,
      uid,
    ]);
    if (!v.origin && !v.arrival) fail(400, 'Provide an origin or manual arrival estimate');
    return deferred(
      async () => (v.origin ? geo.route(v.origin, JSON.parse(r.destination), member.mode) : null),
      async (route) => {
        const current = await one(
          'SELECT * FROM grants WHERE journey_id=? AND user_id=? AND expires_at>?',
          [p.id, uid, now()],
        );
        await openRoom(p.id, uid);
        if (
          !current ||
          current.mode !== g.mode ||
          Number(current.expires_at) !== Number(g.expires_at)
        )
          fail(409, 'Sharing changed during calculation');
        const journey = await room(p.id, uid);
        if (journey.destination !== r.destination)
          fail(409, 'Destination changed during calculation');
        let arrival = route
          ? now() + Math.round(route.durationSeconds * 1000) + member.delay_minutes * 60000
          : v.arrival!;
        if (g.mode !== 'precise') arrival = Math.ceil(arrival / 300000) * 300000;
        await db.run(
          'INSERT INTO etas VALUES(?,?,?,?,?) ON CONFLICT(journey_id,user_id) DO UPDATE SET arrival=excluded.arrival,calculated_at=excluded.calculated_at,source=excluded.source',
          [p.id, uid, arrival, now(), route ? 'routing' : 'manual'],
        );
        return snapshot(p.id, uid);
      },
    );
  });
  endpoint('POST', '/journeys/:id/meeting-points/suggest', async (uid, b, p) => {
    const r = await openRoom(p.id, uid);
    const v = z
      .object({
        candidates: z.array(place).min(1).max(3),
        optimization: z.enum(['total', 'latest', 'balanced']).default('latest'),
      })
      .strict()
      .parse(b);
    const s = await snapshot(p.id, uid);
    const eligible: import('../../../../packages/shared/src/index.js').Participant[] = [];
    for (const person of s.participants) {
      const g = await one('SELECT allow_meeting FROM grants WHERE journey_id=? AND user_id=?', [
        p.id,
        person.id,
      ]);
      if (
        person.location &&
        !person.location.stale &&
        person.sharing === 'precise' &&
        Number(g?.allow_meeting) === 1
      )
        eligible.push(person);
    }
    if (eligible.length < 2)
      fail(
        409,
        'Two fresh, authorized precise origins are required. Participants may propose a point manually.',
      );
    if (eligible.length > 6) fail(409, 'Compare at most six authorized origins at a time');
    const originals = new Map<string, string>();
    for (const person of eligible)
      originals.set(
        person.id,
        JSON.stringify(
          await one('SELECT * FROM grants WHERE journey_id=? AND user_id=?', [p.id, person.id]),
        ),
      );
    return deferred(
      async () =>
        Promise.all(
          v.candidates.map(async (c) => ({
            id: JSON.stringify(c),
            place: c,
            durations: await Promise.all(
              eligible.map(
                async (person) =>
                  (await geo.route(person.location!, c, person.mode)).durationSeconds,
              ),
            ),
          })),
        ),
      async (results) => {
        await openRoom(p.id, uid);
        for (const person of eligible) {
          const grant = await one(
            'SELECT * FROM grants WHERE journey_id=? AND user_id=? AND expires_at>?',
            [p.id, person.id, now()],
          );
          if (
            !grant ||
            JSON.stringify(grant) !== originals.get(person.id) ||
            (await blocked(uid, person.id))
          )
            fail(409, 'Consent changed during calculation');
        }
        return rankMeetingPoints(results, v.optimization).map((x) => ({
          ...x,
          safety: 'User-provided candidate; public access and safety need confirmation',
          coverage: `${eligible.length} authorized participants`,
          estimated: true,
        }));
      },
    );
  });
  endpoint('POST', '/journeys/:id/meeting-points', async (uid, b, p) => {
    await openRoom(p.id, uid);
    const v = z.object({ place }).strict().parse(b);
    const id = randomUUID();
    await db.run('INSERT INTO proposals VALUES(?,?,?,?)', [id, p.id, uid, JSON.stringify(v.place)]);
    return snapshot(p.id, uid);
  });
  endpoint('POST', '/journeys/:id/meeting-points/:proposalId/confirm', async (uid, _b, p) => {
    await openRoom(p.id, uid, true);
    const proposal = await one('SELECT * FROM proposals WHERE id=? AND journey_id=?', [
      p.proposalId,
      p.id,
    ]);
    if (!proposal) fail(404, 'Proposal unavailable');
    await db.run('UPDATE journeys SET meeting_point=? WHERE id=?', [proposal.place, p.id]);
    return snapshot(p.id, uid);
  });
  endpoint('POST', '/journeys/:id/messages', async (uid, b, p) => {
    await openRoom(p.id, uid);
    const v = z
      .object({ body: z.string().trim().min(1).max(1000) })
      .strict()
      .parse(b);
    await db.run('INSERT INTO messages VALUES(?,?,?,?,?)', [
      randomUUID(),
      p.id,
      uid,
      v.body,
      now(),
    ]);
    return snapshot(p.id, uid);
  });
  endpoint('DELETE', '/journeys/:id/messages/:messageId', async (uid, _b, p) => {
    const r = await room(p.id, uid);
    await db.run('DELETE FROM messages WHERE journey_id=? AND id=? AND (sender_id=? OR ?=?)', [
      p.id,
      p.messageId,
      uid,
      r.owner_id,
      uid,
    ]);
  });
}
