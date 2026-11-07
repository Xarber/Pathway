// SPDX-License-Identifier: AGPL-3.0-only
import { z } from 'zod';
export const coordinate = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  })
  .strict();
export const place = coordinate.extend({ label: z.string().trim().min(1).max(240) }).strict();
export const transport = z.enum(['walking', 'cycling', 'driving', 'scooter', 'transit']);
export const precision = z.enum(['off', 'manual', 'eta', 'approximate', 'precise']);
export const participantStatus = z.enum([
  'accepted',
  'preparing',
  'departed',
  'en_route',
  'delayed',
  'near_meeting',
  'arrived',
  'paused',
]);
export const ideaSchema = z
  .object({
    id: z.uuid(),
    title: z.string().trim().min(1).max(160),
    description: z.string().max(10000),
    category: z.enum(['feature', 'improvement', 'bug', 'ui', 'performance', 'other']),
    priority: z.enum(['low', 'medium', 'high']),
    status: z.enum([
      'new',
      'considering',
      'approved',
      'in_progress',
      'implemented',
      'deferred',
      'rejected',
    ]),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    implementation: z.string().max(2000).optional(),
  })
  .strict();
export const ideaExport = z
  .object({
    schemaVersion: z.literal(1),
    project: z.literal('org.openrecode.pathway'),
    exportedAt: z.iso.datetime(),
    ideas: z.array(ideaSchema).max(1000),
  })
  .strict();
export type Coordinate = z.infer<typeof coordinate>;
export type Place = z.infer<typeof place>;
export type Transport = z.infer<typeof transport>;
export type Precision = z.infer<typeof precision>;
export type Idea = z.infer<typeof ideaSchema>;
export interface Route {
  distanceMeters: number;
  durationSeconds: number;
  geometry: Coordinate[];
  instructions: string[];
  provider: string;
  mode: Transport;
  calculatedAt: string;
  limitations: string[];
}
export interface Participant {
  id: string;
  name: string;
  role: string;
  status: string;
  mode: Transport;
  delayMinutes: number;
  sharing: Precision;
  expiresAt?: number;
  location?: Coordinate & { accuracy: number; timestamp: number; stale: boolean };
  eta?: { arrival: number; calculatedAt: number; source: 'routing' | 'manual'; stale: boolean };
}
export interface Journey {
  id: string;
  title: string;
  description: string;
  destination: Place;
  meetingPoint: Place | null;
  status: string;
  createdAt: number;
  expiresAt: number;
  ownerId: string;
  participants: Participant[];
  messages: { id: string; senderId: string; name: string; body: string; createdAt: number }[];
  groupArrival: number | null;
  groupEtaComplete: boolean;
  myGrant?: { mode: Precision; expiresAt: number; viewers: string[] };
  proposals: { id: string; place: Place; proposer: string }[];
}
export interface Profile {
  id: string;
  name: string;
  username: string;
}
export const VERSION = '0.1.0';
export const releases = [
  {
    version: VERSION,
    date: '2026-11-06',
    added: [
      { icon: 'map', text: 'Plan a journey and invite your group' },
      { icon: 'shield', text: 'Choose temporary location precision independently' },
    ],
    fixed: [],
    security: ['Room-scoped grants, revocation and coarse location filtering'],
  },
];
