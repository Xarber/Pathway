// SPDX-License-Identifier: AGPL-3.0-only
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../../../../packages/api-client/src/index';
import type {
  Journey,
  Profile,
  Precision,
  Coordinate,
} from '../../../../packages/shared/src/index';
import { coarse } from '../../../../packages/geospatial/src/index';
import { secrets, storage } from './storage';
import { resolveServerConfig } from './server-config';
type Session = { token: string; profile: Profile };
const serverConfig = resolveServerConfig(
  process.env.EXPO_PUBLIC_API_URL,
  process.env.EXPO_PUBLIC_DISTRIBUTION === 'production',
);
export const canSwitchInstance = serverConfig.canSwitch;
export const developerOptionsEnabled = process.env.EXPO_PUBLIC_DISTRIBUTION !== 'production';
export const serverConfigured = !!serverConfig.origin;
const defaultOrigin = serverConfig.origin;
function useSessionState() {
  const [base, setBase] = useState(defaultOrigin);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const [tracking, setTracking] = useState<{
    roomId: string;
    mode: Precision;
    expiresAt: number;
  } | null>(null);
  const [trackingState, setTrackingState] = useState('Off');
  const [lastSent, setLastSent] = useState<number | null>(null);
  const client = useQueryClient();
  const alive = useRef(true);
  const api = useMemo(() => new ApiClient(base, session?.token || null), [base, session?.token]);
  useEffect(() => {
    void Promise.all([storage.get('instance'), secrets.get()])
      .then(([url, raw]) => {
        const origin = canSwitchInstance && url ? url : defaultOrigin;
        setBase(origin);
        if (!raw || !serverConfigured) return;
        const stored = JSON.parse(raw) as Session & { origin?: string };
        if (stored.origin ? stored.origin === origin : canSwitchInstance || url === origin)
          setSession(stored);
        else void secrets.clear();
      })
      .catch(() => setNotice('Stored session could not be restored.'))
      .finally(() => setReady(true));
    return () => {
      alive.current = false;
    };
  }, []);
  const journeys = useQuery<Journey[]>({
    queryKey: ['journeys', base, session?.profile.id],
    queryFn: () => api.request('/journeys'),
    enabled: !!session,
    refetchInterval: 15000,
  });
  useEffect(() => {
    if (journeys.data && session) {
      const safe = journeys.data.map((j) => ({
        ...j,
        participants: [],
        messages: [],
        myGrant: undefined,
        proposals: [],
        groupArrival: null,
      }));
      void storage.set('journeys:' + session.profile.id, JSON.stringify(safe));
    }
  }, [journeys.data, session]);
  useEffect(() => {
    if (tracking && journeys.data) {
      const grant = journeys.data.find((j) => j.id === tracking.roomId)?.myGrant;
      if (!grant || grant.expiresAt <= Date.now() || grant.mode !== tracking.mode)
        setTracking(null);
    }
  }, [journeys.data, tracking]);
  useEffect(() => {
    if (!tracking) return;
    let disposed = false,
      subscription: Location.LocationSubscription | undefined;
    let appActive = AppState.currentState === 'active';
    let busy = false;
    let last = 0;
    const end = () => {
      subscription?.remove();
      subscription = undefined;
    };
    async function watch() {
      end();
      if (disposed || !appActive) return;
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) throw Error('Location permission unavailable');
        subscription = await Location.watchPositionAsync(
          {
            accuracy:
              tracking!.mode === 'precise' ? Location.Accuracy.High : Location.Accuracy.Balanced,
            timeInterval: 15000,
            distanceInterval: 30,
          },
          async (fix) => {
            if (disposed || busy || Date.now() - last < 10000) return;
            if (Date.now() >= tracking!.expiresAt) {
              setTracking(null);
              return;
            }
            busy = true;
            last = Date.now();
            try {
              const accuracy = fix.coords.accuracy;
              if (accuracy === null || !Number.isFinite(accuracy)) {
                setTrackingState('Location accuracy unknown; fix not shared');
                return;
              }
              const p = tracking!.mode === 'approximate' ? coarse(fix.coords) : fix.coords;
              await api.request('/journeys/' + tracking!.roomId + '/location', 'POST', {
                latitude: p.latitude,
                longitude: p.longitude,
                accuracy: Math.max(accuracy, tracking!.mode === 'approximate' ? 1600 : accuracy),
                timestamp: fix.timestamp,
              });
              if (!disposed) {
                setLastSent(Date.now());
                setTrackingState('Delivering foreground updates');
              }
            } catch (e) {
              if (!disposed)
                setTrackingState(
                  e instanceof Error ? e.message : 'Updates are not being delivered',
                );
            } finally {
              busy = false;
            }
          },
        );
        if (!disposed) setTrackingState('Waiting for a location fix');
        else end();
      } catch (e) {
        setTrackingState(e instanceof Error ? e.message : 'Tracking unavailable');
        end();
      }
    }
    void watch();
    const state = AppState.addEventListener('change', (s) => {
      appActive = s === 'active';
      if (appActive) void watch();
      else {
        end();
        setTrackingState('Paused while app is in the background');
      }
    });
    const expiry = setInterval(() => {
      if (Date.now() >= tracking.expiresAt) setTracking(null);
    }, 1000);
    return () => {
      disposed = true;
      end();
      state.remove();
      clearInterval(expiry);
      setTrackingState('Off');
    };
  }, [tracking, api]);
  async function act<T>(operation: () => Promise<T>): Promise<T | undefined> {
    try {
      const result = await operation();
      await client.invalidateQueries();
      return result;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Action failed');
      return undefined;
    }
  }
  async function authenticate(path: string, data: unknown) {
    return act(async () => {
      if (!serverConfigured) throw Error('Pathway is temporarily unavailable.');
      const s = await api.request<Session>(path, 'POST', data);
      setSession(s);
      await secrets.set(JSON.stringify({ ...s, origin: base }));
      return s;
    });
  }
  async function logout() {
    setTracking(null);
    await act(async () => {
      await api.request('/sharing/stop-all', 'POST');
      await api.request('/auth/logout', 'POST');
    });
    await secrets.clear();
    setSession(null);
    client.clear();
  }
  async function switchInstance(url: string) {
    if (!canSwitchInstance) throw Error('This build uses a configured server');
    const parsed = new URL(url);
    if (
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== '/'
    )
      throw Error('Use an instance origin without a path or credentials');
    if (
      parsed.protocol !== 'https:' &&
      !(
        parsed.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '10.0.2.2'].includes(parsed.hostname)
      )
    )
      throw Error('Instances require HTTPS (except local development)');
    const target = parsed.origin;
    const capability = await new ApiClient(target).request<{ apiVersion: number }>('/capabilities');
    if (capability.apiVersion !== 1) throw Error('Incompatible API version');
    if (session) await logout();
    setBase(target);
    await storage.set('instance', target);
  }
  async function sharing(
    journey: Journey,
    mode: Precision,
    viewers: string[],
    allowMeeting = false,
  ) {
    if (['precise', 'approximate'].includes(mode)) {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted)
        throw Error('Location permission denied. Choose ETA only or manual status.');
    }
    setTracking(null);
    const result = await api.request<Journey>('/journeys/' + journey.id + '/sharing', 'POST', {
      mode,
      viewers,
      allowMeeting,
      expiresAt: Math.min(Date.now() + 3600000, journey.expiresAt),
    });
    await client.invalidateQueries();
    if (['precise', 'approximate'].includes(mode))
      setTracking({ roomId: journey.id, mode, expiresAt: result.myGrant!.expiresAt });
    return result;
  }
  async function stop(roomId?: string) {
    setTracking(null);
    await api.request(
      roomId ? '/journeys/' + roomId + '/sharing' : '/sharing/stop-all',
      roomId ? 'DELETE' : 'POST',
    );
    await client.invalidateQueries();
  }
  async function currentPosition(): Promise<Coordinate> {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted)
      throw Error('Location access declined. Enter coordinates or share a manual ETA.');
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: p.coords.latitude, longitude: p.coords.longitude };
  }
  return {
    base,
    session,
    ready,
    api,
    journeys,
    notice,
    setNotice,
    act,
    authenticate,
    logout,
    switchInstance,
    sharing,
    stop,
    tracking,
    trackingState,
    lastSent,
    currentPosition,
  };
}
const Context = createContext<ReturnType<typeof useSessionState> | null>(null);
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const value = useSessionState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useSession() {
  const context = useContext(Context);
  if (!context) throw Error('Missing session provider');
  return context;
}
