// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  place,
  type Place,
  type Transport,
  type Coordinate,
  type Route,
  type Journey,
} from '../../../../packages/shared/src/index';
import { useSession } from '../lib/session';
import { Button, Card, Chip, Field, Heading, Info, Label, Row } from './ui';
import JourneyMap from './JourneyMap';
import { storage } from '../lib/storage';
const modes: { value: Transport; label: string; icon: any }[] = [
  { value: 'walking', label: 'Walk', icon: 'walk-outline' },
  { value: 'cycling', label: 'Cycle', icon: 'bicycle-outline' },
  { value: 'driving', label: 'Drive', icon: 'car-outline' },
  { value: 'scooter', label: 'Scooter', icon: 'flash-outline' },
  { value: 'transit', label: 'Transit', icon: 'train-outline' },
];
export function Modes({ mode, setMode }: { mode: Transport; setMode: (mode: Transport) => void }) {
  return (
    <Row wrap>
      {modes.map((m) => (
        <Chip
          key={m.value}
          title={m.label}
          icon={m.icon}
          active={mode === m.value}
          onPress={() => setMode(m.value)}
        />
      ))}
    </Row>
  );
}
export default function Planner({
  onCreated,
  onPropose,
}: {
  onCreated: (room: Journey) => void;
  onPropose?: (place: Place) => void;
}) {
  const { api, act, currentPosition } = useSession();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [destination, setDestination] = useState<Place | null>(null);
  const [origin, setOrigin] = useState<Coordinate | null>(null);
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [label, setLabel] = useState('');
  const [mode, setMode] = useState<Transport>('walking');
  const [title, setTitle] = useState('');
  const [route, setRoute] = useState<Route | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void storage.get('transport').then((v) => {
      if (v) setMode(v as Transport);
    });
  }, []);
  const saved = useQuery<{ id: string; place: Place }[]>({
    queryKey: ['saved'],
    queryFn: () => api.request('/saved-places'),
  });
  function select(p: Place) {
    setDestination(p);
    setRoute(null);
    setLabel(p.label);
    setLat(String(p.latitude));
    setLon(String(p.longitude));
  }
  async function calculate() {
    setBusy(true);
    await act(async () => {
      if (!destination) throw Error('Choose a destination');
      const start = origin || (await currentPosition());
      setOrigin(start);
      setRoute(
        await api.request<Route>('/routes/calculate', 'POST', {
          origin: start,
          destination: { latitude: destination.latitude, longitude: destination.longitude },
          mode,
        }),
      );
    });
    setBusy(false);
  }
  return (
    <View style={{ gap: 20 }}>
      <Heading
        subtitle={
          onPropose
            ? 'Choose a public, accessible place and confirm it with the group.'
            : 'Pick a place. Find your way. Bring your people.'
        }
      >
        {onPropose ? 'Meeting point' : 'Where are we going?'}
      </Heading>
      <Card>
        <Field
          label="Search destinations"
          placeholder="Address, station, or place"
          value={search}
          onChangeText={setSearch}
        />
        <Button
          title="Search places"
          icon="search-outline"
          secondary
          onPress={() =>
            void act(async () =>
              setResults(await api.request('/places/search?q=' + encodeURIComponent(search))),
            )
          }
        />
        {results.map((p, i) => (
          <Button key={i} title={p.label} secondary onPress={() => select(p)} />
        ))}
        <Info text="Place search uses the instance’s configured geocoder. Coordinates and map selection work without a search provider. Native maps use Apple Maps or Google Maps; the web map displays the configured tile attribution." />
        {!!saved.data?.length && (
          <>
            <Label muted size={12} bold>
              SAVED PLACES
            </Label>
            {saved.data.map((p) => (
              <Button
                key={p.id}
                title={p.place.label}
                secondary
                icon="bookmark-outline"
                onPress={() => select(p.place)}
              />
            ))}
          </>
        )}
      </Card>
      <JourneyMap
        destination={destination || undefined}
        origin={origin || undefined}
        route={route}
        onSelect={(p) => select({ ...p, label: label || 'Selected map point' })}
      />
      <Card>
        <Field
          label="Destination label"
          value={label}
          onChangeText={setLabel}
          placeholder="Name this place"
        />
        <Row>
          <View style={{ flex: 1 }}>
            <Field
              label="Latitude"
              value={lat}
              onChangeText={setLat}
              keyboardType="numbers-and-punctuation"
              placeholder="41.90"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Longitude"
              value={lon}
              onChangeText={setLon}
              keyboardType="numbers-and-punctuation"
              placeholder="12.49"
            />
          </View>
        </Row>
        <Button
          title="Use these coordinates"
          secondary
          icon="location-outline"
          onPress={() =>
            void act(async () =>
              select(place.parse({ label, latitude: Number(lat), longitude: Number(lon) })),
            )
          }
        />
        {destination && (
          <>
            <Label bold>{destination.label}</Label>
            <Row wrap>
              <Button
                title="Save place"
                secondary
                icon="bookmark-outline"
                onPress={() => void act(() => api.request('/saved-places', 'POST', destination))}
              />
              {onPropose && (
                <Button title="Propose meeting point" onPress={() => onPropose(destination)} />
              )}
            </Row>
          </>
        )}
        {!onPropose && (
          <>
            <Label bold>Travel your way</Label>
            <Modes
              mode={mode}
              setMode={(m) => {
                setMode(m);
                setRoute(null);
              }}
            />
            <Button
              title={busy ? 'Calculating…' : 'Preview real route'}
              disabled={!destination || busy}
              icon="navigate-outline"
              onPress={() => void calculate()}
            />
            <Info text="The route is calculated by the configured Valhalla service. No route duration is invented if it is unavailable. Scooter estimates use bicycle routing and do not verify scooter legality. Transit is unavailable until a timetable provider is integrated. Location permission is requested only when you ask to use your position." />
            {route && (
              <>
                <Label size={22} bold>
                  {Math.ceil(route.durationSeconds / 60)} min ·{' '}
                  {(route.distanceMeters / 1000).toFixed(1)} km
                </Label>
                <Label muted>
                  {route.provider} · Calculated {new Date(route.calculatedAt).toLocaleTimeString()}
                </Label>
                {route.limitations.map((t) => (
                  <Label key={t}>{t}</Label>
                ))}
                <Info text={route.instructions.join('\n') || 'No turn instructions returned.'} />
              </>
            )}
            <Field
              label="Journey title"
              placeholder="Meet for coffee"
              value={title}
              onChangeText={setTitle}
            />
            <Button
              title="Create Journey Room"
              disabled={!destination || !title.trim()}
              icon="people-outline"
              onPress={() =>
                void act(async () =>
                  onCreated(await api.request('/journeys', 'POST', { title, destination, mode })),
                )
              }
            />
          </>
        )}
      </Card>
    </View>
  );
}
