// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  useColorScheme,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SessionProvider, useSession } from '../src/lib/session';
import { storage } from '../src/lib/storage';
import {
  Theme,
  colors,
  Card,
  Label,
  Button,
  Field,
  Heading,
  Row,
  Icon,
  Empty,
  time,
  type IconName,
} from '../src/components/ui';
import Auth from '../src/components/Auth';
import Planner from '../src/components/Planner';
import Room from '../src/components/Room';
import Friends from '../src/components/Friends';
import Settings from '../src/components/Settings';
import { VERSION, type Journey } from '../../../packages/shared/src/index';
const tabs: { id: string; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'grid-outline' },
  { id: 'map', label: 'Map', icon: 'map-outline' },
  { id: 'journeys', label: 'Journeys', icon: 'navigate-outline' },
  { id: 'friends', label: 'Friends', icon: 'people-outline' },
];
function App() {
  const { ready, session, journeys, api, act, notice, setNotice, tracking, stop } = useSession();
  const system = useColorScheme();
  const [appearance, setAppearance] = useState('system');
  const dark = appearance === 'dark' || (appearance === 'system' && system === 'dark');
  const c = dark ? colors.dark : colors.light;
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [tab, setTab] = useState('home');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [invite, setInvite] = useState('');
  const [whatNew, setWhatNew] = useState(false);
  const [cached, setCached] = useState<Journey[]>([]);
  const params = useLocalSearchParams<{ token?: string }>();
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: 0, animated: false }),
    );
    return () => cancelAnimationFrame(frame);
  }, [tab, roomId, session?.profile.id]);
  const invitations = useQuery<any[]>({
    queryKey: ['invitations'],
    queryFn: () => api.request('/invitations'),
    enabled: !!session,
    refetchInterval: 20000,
  });
  useEffect(() => {
    void storage.get('appearance').then((v) => {
      if (v) setAppearance(v);
    });
    if (params.token) setInvite(params.token);
  }, []);
  useEffect(() => {
    if (!session) return;
    void storage.get('lastVersion').then((v) => {
      if (v && v !== VERSION) setWhatNew(true);
      return storage.set('lastVersion', VERSION);
    });
    void storage.get('journeys:' + session.profile.id).then((v) => {
      if (v) setCached(JSON.parse(v));
    });
  }, [session?.profile.id]);
  const rooms = journeys.data || cached;
  const active = rooms.filter(
    (j) => ['active', 'scheduled'].includes(j.status) && j.expiresAt > Date.now(),
  );
  const selected = rooms.find((j) => j.id === roomId);
  function open(j: Journey) {
    setRoomId(j.id);
    setTab('journeys');
  }
  function changeTab(id: string) {
    setTab(id);
    setRoomId(null);
  }
  const Nav = ({ vertical = false }: { vertical?: boolean }) => (
    <View
      style={{
        flexDirection: vertical ? 'column' : 'row',
        gap: vertical ? 9 : 0,
        padding: vertical ? 0 : 8,
        backgroundColor: c.surface,
        borderRadius: vertical ? 0 : 22,
      }}
    >
      {tabs.map((t) => (
        <Pressable
          key={t.id}
          accessibilityRole="tab"
          accessibilityLabel={t.label}
          accessibilityState={{ selected: tab === t.id }}
          onPress={() => changeTab(t.id)}
          style={{
            flex: vertical ? undefined : 1,
            minHeight: 56,
            borderRadius: 15,
            paddingHorizontal: vertical ? 17 : 6,
            paddingVertical: 11,
            flexDirection: vertical ? 'row' : 'column',
            gap: vertical ? 13 : 4,
            alignItems: vertical ? 'center' : 'center',
            backgroundColor: tab === t.id ? c.soft : undefined,
          }}
        >
          <Icon name={t.icon} size={22} color={tab === t.id ? c.accent : c.muted} />
          <Label size={vertical ? 15 : 11} bold={tab === t.id} muted={tab !== t.id}>
            {t.label}
          </Label>
        </Pressable>
      ))}
    </View>
  );
  function list(history = false) {
    const data = history ? rooms.filter((j) => !active.includes(j)) : active;
    return data.length ? (
      data.map((j) => (
        <Pressable
          key={j.id}
          onPress={() => open(j)}
          accessibilityRole="button"
          accessibilityLabel={'Open ' + j.title}
        >
          <Card>
            <Row>
              <View
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 17,
                  backgroundColor: c.soft,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon name={j.status === 'completed' ? 'checkmark-outline' : 'navigate-outline'} />
              </View>
              <View style={{ flex: 1 }}>
                <Label size={18} bold>
                  {j.title}
                </Label>
                <Label muted size={13}>
                  {j.destination.label}
                </Label>
              </View>
              <Icon name="chevron-forward-outline" size={19} />
            </Row>
            <Row wrap>
              <Label muted size={12}>
                {j.participants.length} people · {j.status}
              </Label>
              {j.myGrant && (
                <Label muted size={12}>
                  Sharing {j.myGrant.mode}
                </Label>
              )}
            </Row>
          </Card>
        </Pressable>
      ))
    ) : (
      <Empty
        icon={history ? 'time-outline' : 'navigate-outline'}
        title={history ? 'A little history, without the trail' : 'Your next journey starts here'}
        text={
          history
            ? 'Completed journeys appear here. We don’t save a permanent GPS trail.'
            : 'Create a room and invite someone to go along.'
        }
      />
    );
  }
  const content = !session ? (
    <Auth />
  ) : selected ? (
    <Room journey={selected} onBack={() => setRoomId(null)} />
  ) : tab === 'settings' ? (
    <Settings key="settings" appearance={appearance} setAppearance={setAppearance} />
  ) : tab === 'map' ? (
    <Planner onCreated={open} />
  ) : tab === 'friends' ? (
    <Friends />
  ) : tab === 'journeys' ? (
    <View style={{ gap: 20 }}>
      <Heading subtitle="Temporary spaces for every shared destination.">Your journeys</Heading>
      <Button title="Plan a journey" icon="add-outline" onPress={() => changeTab('map')} />
      <Card>
        <Label bold size={19}>
          Have an invitation?
        </Label>
        <Field
          label="Invitation token"
          value={invite}
          onChangeText={setInvite}
          autoCapitalize="none"
          placeholder="Paste the token your friend shared"
        />
        <Button
          title="Accept invitation"
          disabled={!invite}
          onPress={() =>
            void act(async () => {
              const j = await api.request<Journey>('/invitations/accept', 'POST', {
                token: invite,
              });
              setInvite('');
              open(j);
            })
          }
        />
      </Card>
      {invitations.data?.map((i) => (
        <Card key={i.id}>
          <Label bold>{i.title}</Label>
          <Row>
            <Button
              title="Accept"
              onPress={() =>
                void act(async () =>
                  open(await api.request('/invitations/' + i.id + '/accept', 'POST')),
                )
              }
            />
            <Button
              title="Decline"
              secondary
              onPress={() =>
                void act(() => api.request('/invitations/' + i.id + '/decline', 'POST'))
              }
            />
          </Row>
        </Card>
      ))}
      {list()}
      <Heading>Journey history</Heading>
      {list(true)}
    </View>
  ) : (
    <View style={{ gap: 24 }}>
      <Heading subtitle="A shared destination. A little less coordination.">
        Hey {session.profile.name.split(' ')[0]}, let’s meet.
      </Heading>
      <View
        style={{
          backgroundColor: dark ? '#31365F' : '#E8EAFF',
          borderRadius: 30,
          padding: wide ? 36 : 25,
          gap: 18,
          overflow: 'hidden',
        }}
      >
        <Row>
          <View style={{ flex: 1, gap: 12 }}>
            <Label muted size={12} bold>
              DIFFERENT PATHS. ONE DESTINATION.
            </Label>
            <Label size={wide ? 38 : 30} bold>
              Good company.{`\n`}Less waiting.
            </Label>
            <Label muted>
              Make a plan. Share your progress.{`\n`}Arrive together, on your terms.
            </Label>
          </View>
          {wide && (
            <View
              style={{
                width: 150,
                height: 150,
                borderRadius: 55,
                backgroundColor: '#6269F5',
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: '-10deg' }],
              }}
            >
              <Icon name="git-merge-outline" size={85} color="#fff" />
            </View>
          )}
        </Row>
        <Row>
          <Button title="Plan a journey" icon="add-outline" onPress={() => changeTab('map')} />
          <Button
            title="Join a room"
            secondary
            icon="people-outline"
            onPress={() => changeTab('journeys')}
          />
        </Row>
      </View>
      <Row>
        <View style={{ flex: 1 }}>
          <Heading
            subtitle={`${active.length} ${active.length === 1 ? 'journey' : 'journeys'} in progress or planned`}
          >
            On the horizon
          </Heading>
        </View>
        <Button title="View all" secondary compact onPress={() => changeTab('journeys')} />
      </Row>
      {list()}
      <Card>
        <Row>
          <Icon name="shield-checkmark-outline" />
          <View style={{ flex: 1, gap: 5 }}>
            <Label bold>Meet up. Then switch off.</Label>
            <Label muted size={13}>
              Location stays private until you choose to share. Every sharing grant expires.
            </Label>
          </View>
        </Row>
        <Button title="Your privacy dashboard" secondary onPress={() => changeTab('settings')} />
      </Card>
    </View>
  );
  return (
    <Theme.Provider value={c}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {wide && session && (
            <View
              style={{
                width: 240,
                padding: 25,
                backgroundColor: c.surface,
                borderRightWidth: 1,
                borderColor: c.line,
                gap: 42,
              }}
            >
              <Row>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 13,
                    backgroundColor: '#6269F5',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="git-merge-outline" color="#fff" />
                </View>
                <Label size={24} bold>
                  pathway
                </Label>
              </Row>
              <Nav vertical />
              <View style={{ flex: 1 }} />
              <Button
                title="Settings"
                icon="settings-outline"
                secondary
                onPress={() => changeTab('settings')}
              />
              <Label muted size={11}>
                OpenRecode · {VERSION}
              </Label>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View
              style={{
                paddingHorizontal: wide ? 40 : 22,
                paddingVertical: 17,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderColor: c.line,
                backgroundColor: c.surface,
              }}
            >
              <Row>
                <Icon name="git-merge-outline" />
                <Label size={20} bold>
                  {wide && session
                    ? tabs.find((t) => t.id === tab)?.label || 'Settings'
                    : 'pathway'}
                </Label>
              </Row>
              {session && (
                <Button
                  title={session.profile.name}
                  secondary
                  compact
                  icon="person-circle-outline"
                  onPress={() => changeTab('settings')}
                />
              )}
            </View>
            {tracking && (
              <View style={{ padding: 12, backgroundColor: c.soft }}>
                <Row wrap>
                  <Label size={13}>Foreground {tracking.mode} sharing enabled</Label>
                  <Button title="Stop" danger compact onPress={() => void act(() => stop())} />
                </Row>
              </View>
            )}
            {journeys.isError && session && (
              <View style={{ padding: 14, backgroundColor: c.soft }}>
                <Label muted>
                  Offline or session unavailable · cached journey details. Live updates are not
                  confirmed.
                </Label>
                <Button
                  title="Retry connection"
                  secondary
                  compact
                  onPress={() => void journeys.refetch()}
                />
              </View>
            )}
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{ padding: wide ? 36 : 20, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ width: '100%', maxWidth: 1050, alignSelf: 'center', gap: 20 }}>
                {!ready ? <ActivityIndicator color="#6269F5" /> : content}
                {whatNew && (
                  <Card>
                    <Heading>What’s New · {VERSION}</Heading>
                    <Label>✦ Plan journeys with your people</Label>
                    <Label>✦ Temporary sharing with precision controls</Label>
                    <Label bold>Fixes & Improvements</Label>
                    <Label muted>Room-scoped privacy and revocation controls</Label>
                    <Button title="Got it" onPress={() => setWhatNew(false)} />
                  </Card>
                )}
              </View>
            </ScrollView>
            {!wide && session && (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingBottom: 8,
                  backgroundColor: c.surface,
                  borderTopWidth: 1,
                  borderColor: c.line,
                }}
              >
                <Nav />
              </View>
            )}
          </View>
        </View>
        {notice && (
          <View
            accessibilityRole="alert"
            style={{
              position: 'absolute',
              bottom: 90,
              left: 20,
              right: 20,
              maxWidth: 650,
              alignSelf: 'center',
              backgroundColor: c.surface,
              borderColor: c.line,
              borderWidth: 1,
              borderRadius: 20,
              padding: 20,
              gap: 12,
            }}
          >
            <Label>{notice}</Label>
            <Button title="Dismiss" secondary compact onPress={() => setNotice('')} />
          </View>
        )}
      </SafeAreaView>
    </Theme.Provider>
  );
}
export default function Index() {
  return (
    <SessionProvider>
      <App />
    </SessionProvider>
  );
}
