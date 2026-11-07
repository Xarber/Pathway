// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useRef } from 'react';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { View, Text } from 'react-native';
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
  const ref = useRef<MapView>(null);
  const points = [
    ...(destination ? [destination] : []),
    ...(origin ? [origin] : []),
    ...participants.flatMap((p) => (p.location ? [p.location] : [])),
  ];
  useEffect(() => {
    if (points.length > 1)
      ref.current?.fitToCoordinates(points, {
        edgePadding: { top: 60, bottom: 60, left: 60, right: 60 },
        animated: false,
      });
  }, [destination?.latitude, route, participants.length]);
  return (
    <View style={{ height, borderRadius: 24, overflow: 'hidden' }}>
      <MapView
        ref={ref}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: destination?.latitude || 41.9,
          longitude: destination?.longitude || 12.49,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onLongPress={(e) => onSelect?.(e.nativeEvent.coordinate)}
      >
        {destination && (
          <Marker coordinate={destination} title={destination.label} pinColor="#6269F5" />
        )}
        {meetingPoint && (
          <Marker
            coordinate={meetingPoint}
            title={'Meeting: ' + meetingPoint.label}
            pinColor="#15805b"
          />
        )}
        {origin && <Marker coordinate={origin} title="Your selected origin" pinColor="#15805b" />}
        {participants
          .filter((p) => p.location)
          .map((p) => (
            <React.Fragment key={p.id}>
              <Marker
                coordinate={p.location!}
                title={p.name}
                description={`${p.sharing} · ${p.location!.stale ? 'Stale' : new Date(p.location!.timestamp).toLocaleTimeString()}`}
                opacity={p.location!.stale ? 0.45 : 1}
              />
              {p.sharing === 'approximate' && (
                <Circle
                  center={p.location!}
                  radius={p.location!.accuracy}
                  fillColor="#6269f522"
                  strokeColor="#6269F5"
                />
              )}
            </React.Fragment>
          ))}
        {route && <Polyline coordinates={route.geometry} strokeWidth={5} strokeColor="#6269F5" />}
      </MapView>
      <Text
        style={{
          position: 'absolute',
          bottom: 10,
          left: 12,
          backgroundColor: '#fff',
          color: '#30344b',
          padding: 5,
          fontSize: 11,
        }}
      >
        Long press to choose a point
      </Text>
    </View>
  );
}
