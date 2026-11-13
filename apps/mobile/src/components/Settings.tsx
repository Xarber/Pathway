// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { canSwitchInstance, developerOptionsEnabled, useSession } from '../lib/session';
import { storage } from '../lib/storage';
import { VERSION, releases, type Transport } from '../../../../packages/shared/src/index';
import {
  Card,
  Label,
  Button,
  Chip,
  Field,
  Heading,
  Info,
  Row,
  time,
  SectionTitle,
  Icon,
} from './ui';
import { Modes } from './Planner';
import Ideas from './Ideas';
import { useDeveloperAccess } from '../lib/developer-access';
export default function Settings({
  appearance,
  setAppearance,
}: {
  appearance: string;
  setAppearance: (v: string) => void;
}) {
  const { api, base, session, act, stop, logout, switchInstance, trackingState, lastSent } =
    useSession();
  const [instance, setInstance] = useState(base);
  const { unlocked: developerUnlocked, touch, versionTap } = useDeveloperAccess();
  const unlocked = developerOptionsEnabled && developerUnlocked;
  const [ideas, setIdeas] = useState(false);

  const [mode, setMode] = useState<Transport>('walking');
  const [deleteHistory, setDeleteHistory] = useState(false);
  const [deleteAccount, setDeleteAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [changelog, setChangelog] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('No release source configured');
  const [latest, setLatest] = useState<any>(null);
  const privacy = useQuery<any[]>({
    queryKey: ['privacy'],
    queryFn: () => api.request('/privacy'),
    refetchInterval: 10000,
  });
  const capabilities = useQuery<any>({
    queryKey: ['capabilities', base],
    enabled: canSwitchInstance || unlocked,
    queryFn: () => api.request('/capabilities'),
  });
  const sessions = useQuery<any[]>({
    queryKey: ['sessions'],
    queryFn: () => api.request('/sessions'),
  });
  useEffect(() => {
    void storage.get('transport').then((v) => {
      if (v) setMode(v as Transport);
    });
  }, []);
  useEffect(() => {
    if (!unlocked) setIdeas(false);
  }, [unlocked]);
  if (ideas && unlocked)
    return (
      <View onTouchStart={touch} style={{ gap: 20 }}>
        <Button title="Back to Settings" secondary onPress={() => setIdeas(false)} />
        <Ideas />
      </View>
    );
  async function check() {
    const url = process.env.EXPO_PUBLIC_UPDATE_MANIFEST_URL;
    if (!url) {
      setUpdateStatus('No published releases are configured for this private development build.');
      return;
    }
    if (!url.startsWith('https://')) throw Error('Update metadata requires HTTPS');
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw Error('Release source unavailable');
    const manifest = await response.json();
    if (
      !/^\d+\.\d+\.\d+$/.test(manifest.version) ||
      manifest.channel !== 'stable' ||
      !Array.isArray(manifest.highlights)
    )
      throw Error('Invalid stable release metadata');
    const parts = manifest.version.split('.').map(Number),
      current = VERSION.split('.').map(Number);
    const newer = parts.some(
      (v: number, i: number) =>
        v > current[i] && parts.slice(0, i).every((x: number, j: number) => x === current[j]),
    );
    setLatest(newer ? manifest : null);
    setUpdateStatus(newer ? 'Update available: ' + manifest.version : 'You’re up to date');
    await storage.set('lastUpdateCheck', new Date().toISOString());
  }
  return (
    <View onTouchStart={touch} style={{ gap: 20 }}>
      <Heading subtitle={`@${session?.profile.username} · Your journey, on your terms.`}>
        Settings
      </Heading>
      <Card>
        <SectionTitle icon="shield-checkmark-outline">Privacy dashboard</SectionTitle>
        {privacy.data?.length ? (
          privacy.data.map((p) => (
            <View key={p.journeyId} style={{ gap: 7 }}>
              <Label bold>{p.title}</Label>
              <Label>
                {p.mode} · Ends {time(p.expiresAt)}
              </Label>
              <Label muted>
                Viewers: {p.viewers.map((v: any) => v.name).join(', ') || 'No one'}
              </Label>
              <Label muted>Last server fix: {p.lastUpdate ? time(p.lastUpdate) : 'None'}</Label>
              <Button
                title="Stop this sharing grant"
                danger
                onPress={() => void act(() => stop(p.journeyId))}
              />
            </View>
          ))
        ) : (
          <Label>No active sharing grants</Label>
        )}
        <Label muted>Collector: {trackingState}</Label>
        <Label muted>Last delivered: {lastSent ? time(lastSent) : 'No update this session'}</Label>
        <Button
          title="Stop All Sharing"
          danger
          icon="stop-circle-outline"
          onPress={() => void act(() => stop())}
        />
        <Info text="Grant state is read from your server. Foreground permission does not itself enable sharing. Background tracking is not active in this version. Live points become stale after 60 seconds and are removed after five minutes. Revocation, expiry and journey completion delete stored live coordinates. A server operator can still access data entrusted to their instance." />
      </Card>
      <Card>
        <SectionTitle icon="color-palette-outline">Make it yours</SectionTitle>
        <Label bold size={13}>
          Appearance
        </Label>
        <Row wrap>
          {['system', 'light', 'dark'].map((v) => (
            <Chip
              key={v}
              title={v}
              active={appearance === v}
              onPress={() => {
                setAppearance(v);
                void storage.set('appearance', v);
              }}
            />
          ))}
        </Row>
        <Label bold size={13}>
          Default transport
        </Label>
        <Modes
          mode={mode}
          setMode={(m) => {
            setMode(m);
            void storage.set('transport', m);
          }}
        />
        <Info text="Your default mode is used for new plans. Existing participant transport choices remain independent." />
      </Card>
      <Card>
        <SectionTitle icon="sparkles-outline">Updates & What’s New</SectionTitle>
        <Label>Pathway {VERSION}</Label>
        <Label muted>{updateStatus}</Label>
        <Button
          title="Check for Updates"
          secondary
          icon="refresh-outline"
          onPress={() => void act(check)}
        />
        {latest && (
          <>
            <Label bold>{latest.version}</Label>
            {latest.highlights.map((h: string) => (
              <Label key={h}>✦ {h}</Label>
            ))}
            <Label muted>
              Native installation must use the configured distribution channel; direct installation
              is not yet available.
            </Label>
          </>
        )}
        <Button
          title="Full changelog"
          secondary
          icon="sparkles-outline"
          onPress={() => setChangelog(!changelog)}
        />
        {changelog &&
          releases.map((r) => (
            <View key={r.version} style={{ gap: 9 }}>
              <Label bold>
                {r.version} · {r.date}
              </Label>
              {r.added.map((f) => (
                <Row key={f.text}>
                  <Icon name={f.icon === 'map' ? 'map-outline' : 'shield-checkmark-outline'} />
                  <Label>{f.text}</Label>
                </Row>
              ))}
              <Label bold>Fixes & Improvements</Label>
              <Label muted>{r.security.join('. ')}</Label>
            </View>
          ))}
      </Card>
      {canSwitchInstance && (
        <Card>
          <SectionTitle icon="server-outline">Your instance</SectionTitle>
          <Field
            label="Server origin"
            value={instance}
            onChangeText={setInstance}
            autoCapitalize="none"
            placeholder="https://pathway.example.org"
          />
          <Label muted>
            Changing instances signs you out. The new operator will receive your account and any
            location you explicitly share there.
          </Label>
          <Button
            title="Validate and switch instance"
            icon="checkmark-circle-outline"
            secondary
            onPress={() => void act(() => switchInstance(instance))}
          />
          <Label muted>
            API v{capabilities.data?.apiVersion || '…'} · Routing{' '}
            {capabilities.data?.routing ? 'configured' : 'not configured'} · Search{' '}
            {capabilities.data?.geocoding ? 'configured' : 'not configured'}
          </Label>
        </Card>
      )}
      <Card>
        <SectionTitle icon="key-outline">Signed-in sessions</SectionTitle>
        {sessions.data?.map((s) => (
          <View key={s.id} style={{ gap: 8 }}>
            <Label muted>
              Created {new Date(s.createdAt).toLocaleString()} · Expires{' '}
              {new Date(s.expiresAt).toLocaleDateString()}
            </Label>
            <Button
              title="Revoke this session"
              secondary
              onPress={() => void act(() => api.request('/sessions/' + s.id, 'DELETE'))}
            />
          </View>
        ))}
      </Card>
      <Card>
        <SectionTitle icon="file-tray-outline">Your data</SectionTitle>
        <Button
          title="Delete completed journey history"
          danger
          onPress={() => setDeleteHistory(true)}
        />
        {deleteHistory && (
          <>
            <Label>
              This removes your completed-room history. Rooms you organized and their messages are
              removed for everyone.
            </Label>
            <Button
              title="Confirm history deletion"
              danger
              onPress={() =>
                void act(async () => {
                  await api.request('/history', 'DELETE');
                  setDeleteHistory(false);
                })
              }
            />
          </>
        )}
        <Button title="Delete account" danger onPress={() => setDeleteAccount(true)} />
        {deleteAccount && (
          <>
            <Label>
              This permanently deletes your account, sessions, memberships and rooms you organized.
              Enter your password to confirm.
            </Label>
            <Field
              label="Confirm password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Button
              title="Permanently delete my account"
              danger
              onPress={() =>
                void act(async () => {
                  await stop();
                  await api.request('/account', 'DELETE', { password });
                  await logout();
                })
              }
            />
          </>
        )}
        <Button title="Sign out" secondary icon="log-out-outline" onPress={() => void logout()} />
      </Card>
      {developerOptionsEnabled && (
        <Button title={`Pathway ${VERSION}`} secondary onPress={versionTap} />
      )}
      {unlocked && (
        <Card>
          <SectionTitle icon="code-slash-outline">Developer Options</SectionTitle>
          <Label muted>
            API v{capabilities.data?.apiVersion || 'unknown'} · {base}
          </Label>
          <Label muted>
            Collector: {trackingState} · Build commit:{' '}
            {process.env.EXPO_PUBLIC_BUILD_COMMIT || 'development'}
          </Label>
          <Label muted>Maps: native adapter / Leaflet web · Routing: Valhalla</Label>
          <Button
            title="Developer Ideas"
            icon="bulb-outline"
            onPress={() => {
              touch();
              setIdeas(true);
            }}
          />
          <Info text="Developer access expires after 30 seconds without touch activity or when you change main tabs. Diagnostic text excludes tokens and coordinates. Ideas are private device-local records until you export them; no automatic repository synchronization is configured." />
        </Card>
      )}
      <Label muted size={12}>
        OpenRecode · AGPL-3.0-only · {VERSION}
        {developerOptionsEnabled && ` · ${process.env.EXPO_PUBLIC_BUILD_COMMIT || 'development'}`}
      </Label>
    </View>
  );
}
