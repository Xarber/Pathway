// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import type * as Leaflet from 'leaflet';
import type { MapProps } from './Map.types';
export default function JourneyMap({
  destination,
  meetingPoint,
  origin,
  participants = [],
  route,
  onSelect,
  height = 340,
}: MapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layers = useRef<Leaflet.LayerGroup | null>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false;
    void import('leaflet').then((module) => {
      if (disposed || !container.current) return;
      L.current = module;
      const m = module.map(container.current, { zoomControl: true }).setView([41.9, 12.49], 12);
      map.current = m;
      module
        .tileLayer(
          process.env.EXPO_PUBLIC_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution:
              process.env.EXPO_PUBLIC_TILE_ATTRIBUTION ||
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          },
        )
        .addTo(m);
      layers.current = module.layerGroup().addTo(m);
      m.on('click', (e) => select.current?.({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
      setReady(true);
    });
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const lib = L.current,
      layer = layers.current,
      m = map.current;
    if (!ready || !lib || !layer || !m) return;
    layer.clearLayers();
    const bounds: Leaflet.LatLngTuple[] = [];
    function point(
      p: { latitude: number; longitude: number },
      title: string,
      color: string,
      radius = 8,
      stale = false,
    ) {
      const ll: Leaflet.LatLngTuple = [p.latitude, p.longitude];
      bounds.push(ll);
      lib!
        .circleMarker(ll, {
          radius,
          color,
          weight: 3,
          fillColor: color,
          fillOpacity: stale ? 0.25 : 0.9,
        })
        .bindTooltip(() => {
          const el = document.createElement('span');
          el.textContent = title;
          return el;
        })
        .addTo(layer!);
    }
    if (destination) point(destination, destination.label, '#6269f5', 10);
    if (meetingPoint) point(meetingPoint, meetingPoint.label, '#16805e', 10);
    if (origin) point(origin, 'Your selected origin', '#16805e');
    for (const p of participants)
      if (p.location) {
        point(
          p.location,
          p.name + ' · ' + (p.location.stale ? 'Stale' : p.sharing),
          '#6269f5',
          8,
          p.location.stale,
        );
        if (p.sharing === 'approximate')
          lib
            .circle([p.location.latitude, p.location.longitude], {
              radius: p.location.accuracy,
              weight: 1,
              color: '#6269f5',
              fillOpacity: 0.08,
            })
            .addTo(layer);
      }
    if (route) {
      const path = route.geometry.map((p) => [p.latitude, p.longitude] as Leaflet.LatLngTuple);
      lib.polyline(path, { color: '#6269f5', weight: 5 }).addTo(layer);
      bounds.push(...path);
    }
    if (bounds.length) m.fitBounds(lib.latLngBounds(bounds), { padding: [45, 45], maxZoom: 15 });
    m.invalidateSize();
  }, [ready, destination, meetingPoint, origin, participants, route]);
  return (
    <View style={{ height, borderRadius: 24, overflow: 'hidden', backgroundColor: '#e8eae6' }}>
      <div
        ref={container}
        style={{ height: '100%', width: '100%' }}
        aria-label="Journey map. Destinations and participants are also listed below."
      />
      {!ready && <Text style={{ position: 'absolute', top: 20, left: 20 }}>Loading map…</Text>}
    </View>
  );
}
