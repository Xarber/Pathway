// SPDX-License-Identifier: AGPL-3.0-only
import type { FastifyRequest } from 'fastify';
import type { Database } from './db.js';
import type { Providers } from './providers.js';
import type { Journey } from '../../../packages/shared/src/index.js';
export const activeStatuses = ['scheduled', 'active'];
export const fail = (statusCode: number, message: string): never => {
  throw Object.assign(new Error(message), { statusCode });
};
export type Handler = (uid: string, body: any, params: any, req: FastifyRequest) => Promise<any>;
export interface RouteContext {
  db: Database;
  one: (sql: string, params?: any[]) => Promise<Record<string, any>>;
  now: () => number;
  endpoint: (
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    handler: Handler,
    auth?: boolean,
  ) => void;
  room: (id: string, uid: string, owner?: boolean) => Promise<Record<string, any>>;
  openRoom: (id: string, uid: string, owner?: boolean) => Promise<Record<string, any>>;
  blocked: (a: string, b: string) => Promise<boolean>;
  snapshot: (id: string, uid: string) => Promise<Journey>;
  geo: Providers;
  removeMember: (id: string, target: string) => Promise<void>;
}

export const REMOTE = Symbol('remote-operation');
export function deferred<T>(work: () => Promise<T>, finish: (value: T) => Promise<unknown>) {
  return { kind: REMOTE, work, finish };
}
