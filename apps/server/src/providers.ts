// SPDX-License-Identifier: AGPL-3.0-only
import { z } from 'zod';
import {
  coordinate,
  place,
  type Coordinate,
  type Transport,
  type Route,
} from '../../../packages/shared/src/index.js';
export class ProviderError extends Error {
  statusCode = 503;
}
export interface Providers {
  route(origin: Coordinate, destination: Coordinate, mode: Transport): Promise<Route>;
  search(query: string): Promise<z.infer<typeof place>[]>;
}
function decodePolyline(encoded: string): Coordinate[] {
  let i = 0,
    lat = 0,
    lon = 0;
  const result: Coordinate[] = [];
  function next() {
    let shift = 0,
      res = 0,
      b = 0;
    do {
      if (i >= encoded.length || shift > 30) throw new ProviderError('Invalid route geometry');
      b = encoded.charCodeAt(i++) - 63;
      res |= (b & 31) << shift;
      shift += 5;
    } while (b >= 32);
    return res & 1 ? ~(res >> 1) : res >> 1;
  }
  while (i < encoded.length) {
    lat += next();
    lon += next();
    result.push(coordinate.parse({ latitude: lat / 1e6, longitude: lon / 1e6 }));
  }
  return result;
}
export function providers(config: {
  routingUrl?: string;
  geocodingUrl?: string;
  contact?: string;
}): Providers {
  return {
    async route(origin, destination, mode) {
      if (!config.routingUrl)
        throw new ProviderError('Routing is not configured on this instance.');
      if (mode === 'transit')
        throw new ProviderError(
          'Transit requires a configured timetable provider; unavailable on this instance.',
        );
      const response = await fetch(config.routingUrl.replace(/\/$/, '') + '/route', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          locations: [
            { lat: origin.latitude, lon: origin.longitude },
            { lat: destination.latitude, lon: destination.longitude },
          ],
          costing: mode === 'driving' ? 'auto' : mode === 'walking' ? 'pedestrian' : 'bicycle',
          units: 'kilometers',
        }),
        signal: AbortSignal.timeout(12000),
      }).catch(() => {
        throw new ProviderError('Routing provider unreachable');
      });
      if (!response.ok) throw new ProviderError('No route available from the configured provider');
      const data = (await response.json()) as any;
      const summary = z
        .object({ length: z.number().nonnegative(), time: z.number().nonnegative() })
        .parse(data.trip?.summary);
      const legs = z
        .array(
          z.object({
            shape: z.string(),
            maneuvers: z.array(z.object({ instruction: z.string() })).optional(),
          }),
        )
        .min(1)
        .parse(data.trip?.legs);
      return {
        distanceMeters: summary.length * 1000,
        durationSeconds: summary.time,
        geometry: legs.flatMap((l) => decodePolyline(l.shape)),
        instructions: legs.flatMap((l) => l.maneuvers?.map((m) => m.instruction) || []),
        provider: 'Valhalla · OpenStreetMap',
        mode,
        calculatedAt: new Date().toISOString(),
        limitations:
          mode === 'scooter'
            ? ['Cycling-based estimate; scooter access and legality are not verified.']
            : [],
      };
    },
    async search(query) {
      if (!config.geocodingUrl)
        throw new ProviderError('Place search is not configured. Enter coordinates instead.');
      const url = new URL(config.geocodingUrl.replace(/\/$/, '') + '/search');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '6');
      const res = await fetch(url, {
        headers: { 'User-Agent': config.contact || 'Pathway self-hosted instance' },
        signal: AbortSignal.timeout(10000),
      }).catch(() => {
        throw new ProviderError('Search provider unreachable');
      });
      if (!res.ok) throw new ProviderError('Place search unavailable');
      const data = z
        .array(z.object({ lat: z.string(), lon: z.string(), display_name: z.string() }))
        .parse(await res.json());
      return data.map((p) =>
        place.parse({ latitude: Number(p.lat), longitude: Number(p.lon), label: p.display_name }),
      );
    },
  };
}
