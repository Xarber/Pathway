import { fail, activeStatuses, REMOTE } from './context.js';
import { registerAccounts } from './routes/accounts.js';
import { registerJourneys } from './routes/journeys.js';
import { registerSharing } from './routes/sharing.js';
import { registerCoordination } from './routes/coordination.js';
import { registerSocial } from './routes/social.js';
// SPDX-License-Identifier: AGPL-3.0-only
import Fastify, { type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { randomUUID } from 'node:crypto';
import { z, ZodError } from 'zod';
import { Serial, type Database, migrate } from './db.js';
import { hash, token, passwordHash, passwordMatches } from './auth.js';
import { providers, type Providers } from './providers.js';
import {
  coordinate,
  place,
  transport,
  precision,
  participantStatus,
  type Journey,
  type Participant,
} from '../../../packages/shared/src/index.js';
import { coarse, rankMeetingPoints } from '../../../packages/geospatial/src/index.js';
import type { WebSocket } from 'ws';
export async function createApp(config: {
  db: Database;
  providers?: Providers;
  now?: () => number;
  origins?: string[];
  production?: boolean;
}) {
  const db = config.db,
    now = config.now || Date.now,
    serial = new Serial();
  await migrate(db);
  const geo =
    config.providers ||
    providers({
      routingUrl: process.env.ROUTING_URL,
      geocodingUrl: process.env.GEOCODING_URL,
      contact: process.env.PROVIDER_CONTACT,
    });
  const app = Fastify({ logger: false, bodyLimit: 32768, trustProxy: false });
  await app.register(cors, {
    origin: config.origins || ['http://localhost:8081', 'http://localhost:4173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await app.register(helmet);
  await app.register(rateLimit, { max: 120, timeWindow: 60000 });
  await app.register(websocket, { options: { maxPayload: 1024 } });
  app.setErrorHandler((error, _req, reply) => {
    const e = error as Error & { statusCode?: number; code?: string };
    const status =
      e instanceof ZodError
        ? 400
        : e.statusCode ||
          (e.code === '23505' ||
          e.code?.startsWith('SQLITE_CONSTRAINT') ||
          e.message.includes('UNIQUE constraint failed')
            ? 409
            : 500);
    reply.code(status).send({
      error:
        status === 500
          ? 'Internal server error'
          : e instanceof ZodError
            ? 'Invalid request'
            : status === 409
              ? 'A conflicting record already exists'
              : e.message,
    });
  });
  app.addHook('onSend', async (_req, reply, payload) => {
    reply.header('Cache-Control', 'no-store');
    return payload;
  });
  const one = async (sql: string, p: any[] = []) => (await db.all(sql, p))[0];
  async function user(req: FastifyRequest) {
    const bearer = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
    if (!bearer) fail(401, 'Sign in required');
    const s = await one('SELECT user_id, hash FROM sessions WHERE hash=? AND expires_at>?', [
      hash(bearer!),
      now(),
    ]);
    if (!s) fail(401, 'Session expired');
    return s.user_id as string;
  }
  async function blocked(a: string, b: string) {
    return !!(await one(
      'SELECT owner_id FROM blocks WHERE (owner_id=? AND target_id=?) OR (owner_id=? AND target_id=?)',
      [a, b, b, a],
    ));
  }
  async function room(id: string, uid: string, owner = false) {
    const r = await one(
      'SELECT j.*,p.role FROM journeys j JOIN participants p ON p.journey_id=j.id WHERE j.id=? AND p.user_id=?',
      [id, uid],
    );
    if (!r) fail(404, 'Journey unavailable');
    if (owner && r.owner_id !== uid) fail(403, 'Only the organizer can do that');
    return r;
  }
  async function openRoom(id: string, uid: string, owner = false) {
    const r = await room(id, uid, owner);
    if (!activeStatuses.includes(r.status) || Number(r.expires_at) <= now())
      fail(409, 'Journey is no longer open');
    return r;
  }
  async function snapshot(id: string, uid: string): Promise<Journey> {
    const r = await room(id, uid);
    const members = await db.all(
      'SELECT p.*,u.name FROM participants p JOIN users u ON u.id=p.user_id WHERE p.journey_id=?',
      [id],
    );
    const participants: Participant[] = [];
    let myGrant: Journey['myGrant'];
    for (const p of members) {
      if (p.user_id !== uid && (await blocked(uid, p.user_id))) continue;
      const grant = await one(
        'SELECT * FROM grants WHERE journey_id=? AND user_id=? AND expires_at>?',
        [id, p.user_id, now()],
      );
      const can =
        activeStatuses.includes(r.status) &&
        Number(r.expires_at) > now() &&
        grant &&
        (p.user_id === uid || JSON.parse(grant.viewers).includes(uid));
      const item: Participant = {
        id: p.user_id,
        name: p.name,
        role: p.role,
        status: p.status,
        mode: p.mode,
        delayMinutes: p.delay_minutes,
        sharing: can ? grant.mode : 'off',
      };
      if (can) {
        item.expiresAt = Number(grant.expires_at);
        if (p.user_id === uid)
          myGrant = {
            mode: grant.mode,
            expiresAt: Number(grant.expires_at),
            viewers: JSON.parse(grant.viewers),
          };
        if (['precise', 'approximate'].includes(grant.mode)) {
          const fix = await one(
            'SELECT * FROM live_locations WHERE journey_id=? AND user_id=? AND timestamp>?',
            [id, p.user_id, now() - 300000],
          );
          if (fix)
            item.location = {
              latitude: fix.latitude,
              longitude: fix.longitude,
              accuracy: fix.accuracy,
              timestamp: Number(fix.timestamp),
              stale: now() - Number(fix.timestamp) > 60000,
            };
        }
        const eta = await one('SELECT * FROM etas WHERE journey_id=? AND user_id=?', [
          id,
          p.user_id,
        ]);
        if (eta && ['eta', 'precise', 'approximate'].includes(grant.mode))
          item.eta = {
            arrival: Number(eta.arrival),
            calculatedAt: Number(eta.calculated_at),
            source: eta.source,
            stale: now() - Number(eta.calculated_at) > 300000,
          };
      }
      participants.push(item);
    }
    const messages = [];
    for (const m of await db.all(
      'SELECT m.*,u.name FROM messages m JOIN users u ON u.id=m.sender_id WHERE journey_id=? ORDER BY created_at DESC LIMIT 100',
      [id],
    ))
      if (!(await blocked(uid, m.sender_id)))
        messages.push({
          id: m.id,
          senderId: m.sender_id,
          name: m.name,
          body: m.body,
          createdAt: Number(m.created_at),
        });
    const proposals = [];
    for (const p of await db.all('SELECT * FROM proposals WHERE journey_id=?', [id]))
      if (!(await blocked(uid, p.proposer)))
        proposals.push({ id: p.id, place: JSON.parse(p.place), proposer: p.proposer });
    const etas = participants
      .filter((p) => p.status !== 'arrived')
      .map((p) => p.eta)
      .filter((e) => e && !e.stale);
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      destination: JSON.parse(r.destination),
      meetingPoint: r.meeting_point ? JSON.parse(r.meeting_point) : null,
      status: r.status,
      createdAt: Number(r.created_at),
      expiresAt: Number(r.expires_at),
      ownerId: r.owner_id,
      participants,
      messages: messages.reverse(),
      proposals,
      myGrant,
      groupArrival: etas.length ? Math.max(...etas.map((e) => e!.arrival)) : null,
      groupEtaComplete: participants.every(
        (p) => p.status === 'arrived' || (p.eta && !p.eta.stale),
      ),
    };
  }
  const clients = new Map<WebSocket, { uid: string; roomId: string; session: string }>();
  const tickets = new Map<
    string,
    { uid: string; roomId: string; session: string; expires: number }
  >();
  async function broadcast() {
    for (const [socket, c] of clients) {
      try {
        if (
          !(await one('SELECT hash FROM sessions WHERE hash=? AND expires_at>?', [
            c.session,
            now(),
          ]))
        )
          throw new Error('expired');
        const data = await snapshot(c.roomId, c.uid);
        if (socket.readyState === 1)
          socket.send(JSON.stringify({ type: 'journey.snapshot', data }));
      } catch {
        if (socket.readyState === 1) socket.send(JSON.stringify({ type: 'access.revoked' }));
        socket.close(1008, 'Access revoked');
        clients.delete(socket);
      }
    }
  }
  async function cleanup() {
    await db.run('DELETE FROM live_locations WHERE timestamp<?', [now() - 300000]);
    await db.run('DELETE FROM etas WHERE calculated_at<?', [now() - 1800000]);
    await db.run('DELETE FROM grants WHERE expires_at<=?', [now()]);
    await db.run('DELETE FROM sessions WHERE expires_at<=?', [now()]);
    await db.run('UPDATE journeys SET status=? WHERE expires_at<=? AND status IN (?,?)', [
      'expired',
      now(),
      'scheduled',
      'active',
    ]);
    await db.run(
      "DELETE FROM grants WHERE journey_id IN (SELECT id FROM journeys WHERE status NOT IN ('scheduled','active'))",
    );
    await db.run('DELETE FROM invitations WHERE expires_at<=?', [now()]);
    for (const [key, t] of tickets) if (t.expires <= now()) tickets.delete(key);
  }
  type Handler = (uid: string, body: any, params: any, req: FastifyRequest) => Promise<any>;
  function endpoint(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    fn: Handler,
    auth = true,
  ) {
    app.route({
      method,
      url: '/api/v1' + url,
      config: { rateLimit: url.startsWith('/auth/') ? { max: 10, timeWindow: 60000 } : undefined },
      handler: async (req) => {
        async function transaction(operation: Handler) {
          return serial.use(async () => {
            await db.run('BEGIN');
            let result;
            try {
              await cleanup();
              const uid = auth ? await user(req) : '';
              result = await operation(uid, req.body || {}, req.params, req);
              await db.run('COMMIT');
            } catch (error) {
              await db.run('ROLLBACK');
              throw error;
            }
            await broadcast();
            return result ?? { ok: true };
          });
        }
        const prepared = await transaction(fn);
        if (prepared?.kind === REMOTE) {
          const value = await prepared.work();
          return transaction(async () => prepared.finish(value));
        }
        return prepared;
      },
    });
  }
  app.get('/health', () => ({
    status: 'ok',
    version: '0.1.0',
    commit: process.env.BUILD_COMMIT || 'development',
  }));
  app.get('/api/v1/capabilities', () => ({
    apiVersion: 1,
    appVersion: '0.1.0',
    routing: !!process.env.ROUTING_URL,
    geocoding: !!process.env.GEOCODING_URL,
    transit: false,
    sharingMaxHours: 8,
    backgroundTracking: false,
    auth: ['password'],
    emailDelivery: false,
  }));
  async function removeMember(id: string, target: string) {
    await db.run('DELETE FROM participants WHERE journey_id=? AND user_id=?', [id, target]);
    await db.run('DELETE FROM etas WHERE journey_id=? AND user_id=?', [id, target]);
    for (const g of await db.all('SELECT * FROM grants WHERE journey_id=?', [id]))
      await db.run('UPDATE grants SET viewers=? WHERE journey_id=? AND user_id=?', [
        JSON.stringify(JSON.parse(g.viewers).filter((v: string) => v !== target)),
        id,
        g.user_id,
      ]);
  }
  const context = { db, one, now, endpoint, room, openRoom, blocked, snapshot, geo, removeMember };
  registerAccounts(context);
  registerJourneys(context);
  registerSharing(context);
  registerCoordination(context);
  registerSocial(context);
  endpoint('POST', '/journeys/:id/ws-ticket', async (uid, _b, p, req) => {
    await room(p.id, uid);
    const key = token();
    tickets.set(hash(key), {
      uid,
      roomId: p.id,
      session: hash(req.headers.authorization!.slice(7)),
      expires: now() + 30000,
    });
    return { ticket: key };
  });
  app.get('/api/v1/live', { websocket: true }, (socket, req) => {
    const timer = setTimeout(() => socket.close(1008, 'Authentication required'), 5000);
    let initialized = false;
    socket.on('message', (raw) => {
      void serial.use(async () => {
        try {
          if (initialized) throw Error();
          const message = z
            .object({ ticket: z.string().min(40).max(100) })
            .strict()
            .parse(JSON.parse(raw.toString()));
          const t = tickets.get(hash(message.ticket));
          tickets.delete(hash(message.ticket));
          if (
            !t ||
            t.expires <= now() ||
            !(await one('SELECT hash FROM sessions WHERE hash=? AND expires_at>?', [
              t.session,
              now(),
            ]))
          )
            throw Error();
          await room(t.roomId, t.uid);
          initialized = true;
          clearTimeout(timer);
          clients.set(socket, { uid: t.uid, roomId: t.roomId, session: t.session });
          socket.send(
            JSON.stringify({ type: 'journey.snapshot', data: await snapshot(t.roomId, t.uid) }),
          );
        } catch {
          socket.close(1008, 'Unauthorized');
        }
      });
    });
    socket.on('close', () => {
      clearTimeout(timer);
      clients.delete(socket);
    });
  });
  const timer = setInterval(() => {
    void serial
      .use(async () => {
        await cleanup();
        await broadcast();
      })
      .catch(() => {});
  }, 10000);
  timer.unref();
  app.addHook('onClose', async () => {
    clearInterval(timer);
    for (const s of clients.keys()) s.close(1001, 'Server stopping');
    await db.close();
  });
  return {
    app,
    maintenance: () =>
      serial.use(async () => {
        await cleanup();
        await broadcast();
      }),
  };
}
