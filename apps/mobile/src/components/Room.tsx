// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from 'react';
import { View, Share, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '../lib/session';
import type { Journey, Precision, Place } from '../../../../packages/shared/src/index';
import { Card, Label, Row, Button, Heading, Chip, Field, Info, time, Icon } from './ui';
import JourneyMap from './JourneyMap';
import Planner from './Planner';
export default function Room({ journey, onBack }: { journey: Journey; onBack: () => void }) {
  const {
    api,
    base,
    session,
    act,
    sharing,
    stop,
    tracking,
    trackingState,
    lastSent,
    currentPosition,
  } = useSession();
  const client = useQueryClient();
  const [status, setStatus] = useState('Connecting');
  const [precision, setPrecision] = useState<Precision>('manual');
  const [viewers, setViewers] = useState<string[]>([]);
  const [invitee, setInvitee] = useState('');
  const [invite, setInvite] = useState('');
  const [message, setMessage] = useState('');
  const [proposing, setProposing] = useState(false);
  const [manualEta, setManualEta] = useState('20');
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [allowMeeting, setAllowMeeting] = useState(false);
  const [ranked, setRanked] = useState<any[]>([]);
  const active = ['scheduled', 'active'].includes(journey.status) && journey.expiresAt > Date.now();
  const owner = journey.ownerId === session?.profile.id;
  const me = journey.participants.find((p) => p.id === session?.profile.id);
  useEffect(() => {
    let disposed = false,
      socket: WebSocket | undefined,
      timer: ReturnType<typeof setTimeout> | undefined,
      attempt = 0;
    async function connect() {
      try {
        const s = await api.live(
          journey.id,
          (data) => {
            if (disposed) return;
            if (!data) {
              onBack();
              return;
            }
            client.setQueryData<Journey[]>(['journeys', base, session?.profile.id], (list) =>
              list?.map((j) => (j.id === data.id ? data : j)),
            );
          },
          (s) => {
            if (disposed) return;
            setStatus(s);
            if (s === 'Connected') attempt = 0;
            if (s === 'Disconnected') {
              timer = setTimeout(() => void connect(), Math.min(30000, 1000 * 2 ** attempt++));
            }
          },
        );
        if (disposed) s.close();
        else socket = s;
      } catch {
        if (!disposed) {
          setStatus('Disconnected');
          timer = setTimeout(() => void connect(), Math.min(30000, 1000 * 2 ** attempt++));
        }
      }
    }
    void connect();
    return () => {
      disposed = true;
      socket?.close();
      clearTimeout(timer);
    };
  }, [api, journey.id]);
  async function action(path: string, body?: unknown, method = 'POST') {
    return act(() => api.request('/journeys/' + journey.id + path, method, body));
  }
  if (proposing)
    return (
      <View style={{ gap: 20 }}>
        <Button title="Back to journey" secondary onPress={() => setProposing(false)} />
        <Planner
          onCreated={() => {}}
          onPropose={(p) =>
            void act(async () => {
              await api.request('/journeys/' + journey.id + '/meeting-points', 'POST', {
                place: p,
              });
              setProposing(false);
            })
          }
        />
      </View>
    );
  const participants = journey.participants.map((p) => ({
    ...p,
    location: p.location
      ? {
          ...p.location,
          stale: status !== 'Connected' || Date.now() - p.location.timestamp > 60000,
        }
      : undefined,
  }));
  return (
    <View style={{ gap: 20 }}>
      <Row wrap>
        <Button title="All journeys" icon="arrow-back-outline" secondary onPress={onBack} />
        <Chip
          title={status}
          active={status === 'Connected'}
          onPress={() => void client.invalidateQueries()}
        />
      </Row>
      <Heading subtitle={journey.destination.label}>{journey.title}</Heading>
      <JourneyMap
        destination={journey.destination}
        meetingPoint={journey.meetingPoint}
        participants={participants}
      />
      <Card>
        <Row>
          <Icon name="people-outline" />
          <View style={{ flex: 1 }}>
            <Label muted size={12} bold>
              GROUP ARRIVAL
            </Label>
            <Label size={24} bold>
              {journey.groupArrival
                ? `Around ${time(journey.groupArrival)}`
                : 'Waiting for arrival estimates'}
            </Label>
          </View>
        </Row>
        <Label muted>
          {journey.groupEtaComplete
            ? 'All participants accounted for'
            : 'Partial estimate · some participants have no current ETA'}
        </Label>
        <Label muted size={13}>
          {journey.status} · Expires {time(journey.expiresAt)}
        </Label>
        {active && owner && (
          <Row wrap>
            {journey.status === 'scheduled' && (
              <Button
                title="Start journey"
                icon="play-outline"
                onPress={() => void action('/start')}
              />
            )}
            <Button title="End journey" secondary onPress={() => setConfirmEnd(true)} />
          </Row>
        )}
        {confirmEnd && (
          <>
            <Label>Ending this journey stops everyone’s temporary sharing.</Label>
            <Row wrap>
              <Button
                title="Confirm completion"
                onPress={() => void action('/complete').then(() => setConfirmEnd(false))}
              />
              <Button title="Keep journey open" secondary onPress={() => setConfirmEnd(false)} />
            </Row>
          </>
        )}
      </Card>
      <Card>
        <Row>
          <Icon name="shield-checkmark-outline" />
          <Label size={19} bold>
            Your sharing, your choice
          </Label>
        </Row>
        <Label>
          {journey.myGrant
            ? `${journey.myGrant.mode} sharing until ${time(journey.myGrant.expiresAt)}`
            : 'Location sharing is off'}
        </Label>
        {tracking?.roomId === journey.id && (
          <Label muted>
            {trackingState}
            {lastSent ? ` · Last delivered ${time(lastSent)}` : ''}
          </Label>
        )}
        {journey.myGrant && (
          <Button
            title="Stop sharing now"
            danger
            icon="stop-circle-outline"
            onPress={() => void act(() => stop(journey.id))}
          />
        )}{' '}
        {active && (
          <>
            <Row wrap>
              {(['manual', 'eta', 'approximate', 'precise'] as Precision[]).map((m) => (
                <Chip
                  key={m}
                  title={
                    {
                      manual: 'Manual status',
                      eta: 'ETA only',
                      approximate: 'Approximate',
                      precise: 'Precise',
                      off: 'Off',
                    }[m]
                  }
                  active={precision === m}
                  onPress={() => setPrecision(m)}
                />
              ))}
            </Row>
            <Label bold size={13}>
              Choose who can view your updates
            </Label>
            {journey.participants
              .filter((p) => p.id !== session?.profile.id)
              .map((p) => (
                <Chip
                  key={p.id}
                  title={p.name}
                  active={viewers.includes(p.id)}
                  onPress={() =>
                    setViewers((v) =>
                      v.includes(p.id) ? v.filter((id) => id !== p.id) : [...v, p.id],
                    )
                  }
                />
              ))}
            <Chip
              title="Allow my precise origin in meeting calculations"
              active={allowMeeting}
              onPress={() => setAllowMeeting(!allowMeeting)}
            />
            <Button
              title="Enable for selected people · 1 hour"
              disabled={!viewers.length}
              icon="shield-checkmark-outline"
              onPress={() => void act(() => sharing(journey, precision, viewers, allowMeeting))}
            />
            <Info text="Consent lasts at most one hour here, bounded by room expiry. New participants receive no access until you explicitly renew your viewer list. Precise and approximate modes collect location only while this app is in the foreground. Approximate mode reduces coordinates to a fixed cell about 2.2 km tall; ETA-only sends no location in room updates. The instance operator must still be trusted. Stop sharing removes live positions from future authorized responses; it cannot erase screenshots." />
          </>
        )}
      </Card>
      <Card>
        <Label size={19} bold>
          Your people
        </Label>
        {participants.map((p) => (
          <View key={p.id} style={{ gap: 8, paddingVertical: 10 }}>
            <Row>
              <View
                style={{
                  height: 42,
                  width: 42,
                  borderRadius: 16,
                  backgroundColor: '#EDEEFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Label bold>{p.name.slice(0, 1).toUpperCase()}</Label>
              </View>
              <View style={{ flex: 1 }}>
                <Label bold>
                  {p.name}
                  {p.id === session?.profile.id ? ' (you)' : ''}
                </Label>
                <Label muted size={13}>
                  {p.status.replaceAll('_', ' ')} · {p.mode}
                  {p.delayMinutes ? ` · ${p.delayMinutes} min delay` : ''}
                </Label>
              </View>
              <Label bold>
                {p.status === 'arrived' ? 'Arrived' : p.eta ? time(p.eta.arrival) : 'ETA unknown'}
              </Label>
            </Row>
            <Label muted size={12}>
              {p.sharing === 'off' ? 'Location private' : `${p.sharing} sharing`}
              {p.location
                ? ` · ${p.location.stale ? 'Stale · ' : ''}Updated ${time(p.location.timestamp)} · ±${Math.round(p.location.accuracy)} m`
                : ''}
              {p.eta
                ? ` · ${p.eta.source === 'manual' ? 'Self-reported' : 'Route-calculated'}${p.eta.stale ? ' · stale' : ''}`
                : ''}
            </Label>
            {p.id !== session?.profile.id && (
              <Row wrap>
                <Button
                  title={'Block ' + p.name}
                  compact
                  danger
                  onPress={() => void act(() => api.request('/blocks', 'POST', { userId: p.id }))}
                />
                {owner && (
                  <Button
                    title="Remove participant"
                    compact
                    secondary
                    onPress={() => void action('/participants/' + p.id, undefined, 'DELETE')}
                  />
                )}
              </Row>
            )}
          </View>
        ))}
        {active && (
          <>
            <Row wrap>
              {[
                { status: 'departed', label: 'Leaving now' },
                { status: 'en_route', label: 'On my way' },
                { status: 'delayed', label: '5 min late' },
                { status: 'arrived', label: 'I’ve arrived' },
              ].map((s) => (
                <Button
                  key={s.status}
                  title={s.label}
                  compact
                  secondary
                  onPress={() =>
                    void act(async () => {
                      if (s.status === 'arrived') await stop(journey.id);
                      await api.request('/journeys/' + journey.id + '/status', 'PATCH', {
                        status: s.status,
                        delayMinutes: s.status === 'delayed' ? 5 : 0,
                      });
                    })
                  }
                />
              ))}
            </Row>
            <Field
              label="Your ETA in minutes (self-reported)"
              value={manualEta}
              onChangeText={setManualEta}
              keyboardType="number-pad"
            />
            <Row wrap>
              <Button
                title="Share manual ETA"
                secondary
                onPress={() =>
                  void action('/eta', { arrival: Date.now() + Number(manualEta) * 60000 })
                }
              />
              <Button
                title="Calculate my ETA"
                secondary
                icon="navigate-outline"
                onPress={() =>
                  void act(async () =>
                    api.request('/journeys/' + journey.id + '/eta', 'POST', {
                      origin: await currentPosition(),
                    }),
                  )
                }
              />
            </Row>
            <Info text="First enable ETA-only, approximate, or precise sharing. Manual ETA is labelled self-reported. Calculate my ETA sends your current point to the instance’s routing service for that request, without storing a route or revealing it to the room. Non-precise ETAs are rounded up to five minutes." />
          </>
        )}
      </Card>
      {active && owner && (
        <Card>
          <Label size={19} bold>
            Invite someone along
          </Label>
          <Field
            label="Friend’s username (optional)"
            value={invitee}
            onChangeText={setInvitee}
            autoCapitalize="none"
            placeholder="Leave empty for a single-use link"
          />
          <Button
            title="Create invitation"
            secondary
            icon="person-add-outline"
            onPress={() =>
              void act(async () => {
                const response = await api.request<{ token: string }>(
                  '/journeys/' + journey.id + '/invite',
                  'POST',
                  invitee ? { username: invitee } : {},
                );
                setInvite(response.token);
              })
            }
          />
          {invite && (
            <>
              <Field label="Invitation token · expires in 1 hour" value={invite} editable={false} />
              <Button
                title="Share invitation"
                icon="share-outline"
                onPress={() =>
                  void Share.share({
                    message: `Join my Pathway journey. ${Platform.OS === 'web' ? location.origin : 'pathway://'}${Platform.OS === 'web' ? '/join?token=' : 'join?token='}${invite}\nOr paste this invitation token in Pathway: ${invite}`,
                  })
                }
              />
            </>
          )}
          <Button
            title="Revoke outstanding invitations"
            danger
            onPress={() => void action('/invitations', undefined, 'DELETE')}
          />
        </Card>
      )}
      <Card>
        <Label size={19} bold>
          Meet along the way
        </Label>
        {journey.meetingPoint ? (
          <>
            <Label bold>{journey.meetingPoint.label}</Label>
            <Label muted>Confirmed meeting point · choose a safe place to stop.</Label>
          </>
        ) : (
          <Label muted>Suggest a public place and agree before changing course.</Label>
        )}
        {active && (
          <Button
            title="Propose a meeting point"
            secondary
            icon="git-merge-outline"
            onPress={() => setProposing(true)}
          />
        )}{' '}
        {journey.proposals.map((p) => (
          <View key={p.id} style={{ gap: 8 }}>
            <Label>{p.place.label}</Label>
            {owner && active && (
              <Button
                title="Confirm this meeting point"
                secondary
                onPress={() => void action('/meeting-points/' + p.id + '/confirm')}
              />
            )}
          </View>
        ))}
        {active && journey.proposals.length > 0 && (
          <Button
            title="Compare travel times to proposals"
            secondary
            onPress={() =>
              void act(async () =>
                setRanked(
                  await api.request('/journeys/' + journey.id + '/meeting-points/suggest', 'POST', {
                    candidates: journey.proposals.slice(0, 3).map((p) => p.place),
                    optimization: 'latest',
                  }),
                ),
              )
            }
          />
        )}{' '}
        {ranked.map((r, i) => (
          <View key={i}>
            <Label bold>
              {i + 1}. {r.place.label}
            </Label>
            <Label muted>
              Latest arrival in {Math.ceil(Math.max(...r.durations) / 60)} min · {r.coverage}
            </Label>
            <Label muted>{r.safety}</Label>
          </View>
        ))}
        <Info text="Comparison uses real routing times for fresh precise origins you are authorized to see, when participants separately permit meeting calculations. Candidates are proposed by people; access and safety are not verified automatically. Automatic route interception and shared-segment navigation are not available in this version." />
      </Card>
      <Card>
        <Label size={19} bold>
          Keep everyone in the loop
        </Label>
        {journey.messages.map((m) => (
          <View key={m.id} style={{ gap: 3 }}>
            <Label size={12} muted>
              {m.name} · {time(m.createdAt)}
            </Label>
            <Label>{m.body}</Label>
          </View>
        ))}
        {active && (
          <>
            <Row wrap>
              {['Wait for me', 'I’m at the entrance', 'Taking another route'].map((t) => (
                <Button
                  key={t}
                  title={t}
                  compact
                  secondary
                  onPress={() => void action('/messages', { body: t })}
                />
              ))}
            </Row>
            <Field
              label="Message your journey"
              value={message}
              onChangeText={setMessage}
              placeholder="A quick update…"
            />
            <Button
              title="Send message"
              icon="send-outline"
              disabled={!message.trim()}
              onPress={() =>
                void action('/messages', { body: message }).then((r) => {
                  if (r) setMessage('');
                })
              }
            />
          </>
        )}
      </Card>
      {!owner && active && (
        <Button
          title="Leave journey"
          danger
          onPress={() =>
            void act(async () => {
              await stop(journey.id);
              await api.request('/journeys/' + journey.id + '/leave', 'POST');
              onBack();
            })
          }
        />
      )}
    </View>
  );
}
