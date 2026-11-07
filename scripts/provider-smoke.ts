// SPDX-License-Identifier: AGPL-3.0-only
// Explicit opt-in network probe. Public landmarks only; no user data.
import { providers } from '../apps/server/src/providers.js';
const url = process.env.ROUTING_URL;
if (!url) throw Error('Set ROUTING_URL explicitly');
const result = await providers({
  routingUrl: url,
  contact: 'Pathway development smoke test',
}).route(
  { latitude: 41.89021, longitude: 12.49223 },
  { latitude: 41.8929, longitude: 12.4833 },
  'walking',
);
if (result.geometry.length < 2 || result.durationSeconds <= 0 || result.distanceMeters <= 0)
  throw Error('Provider returned an invalid route');
console.log(
  JSON.stringify(
    {
      provider: result.provider,
      distanceMeters: result.distanceMeters,
      durationSeconds: result.durationSeconds,
      geometryPoints: result.geometry.length,
      instructions: result.instructions.length,
      calculatedAt: result.calculatedAt,
    },
    null,
    2,
  ),
);
