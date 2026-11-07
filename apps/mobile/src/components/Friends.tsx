// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../lib/session';
import { Button, Card, Empty, Field, Heading, Label, Row, Info } from './ui';
export default function Friends() {
  const { api, act, session } = useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [reportUser, setReportUser] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const friends = useQuery<any[]>({
    queryKey: ['friends'],
    queryFn: () => api.request('/friends'),
  });
  return (
    <View style={{ gap: 20 }}>
      <Heading subtitle="Friendship makes invitations easier. Location stays private.">
        Your people
      </Heading>
      <Card>
        <Field
          label="Find a username"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          placeholder="At least 3 characters"
        />
        <Button
          title="Search people"
          icon="search-outline"
          secondary
          onPress={() =>
            void act(async () =>
              setResults(await api.request('/users/search?q=' + encodeURIComponent(query))),
            )
          }
        />
        {results.map((u) => (
          <View key={u.id} style={{ gap: 10 }}>
            <Label bold>
              {u.name} · @{u.username}
            </Label>
            <Row wrap>
              <Button
                title="Send friend request"
                secondary
                onPress={() =>
                  void act(() => api.request('/friends/requests', 'POST', { username: u.username }))
                }
              />
              <Button
                title="Block"
                danger
                onPress={() =>
                  void act(async () => {
                    await api.request('/blocks', 'POST', { userId: u.id });
                    setResults((r) => r.filter((x) => x.id !== u.id));
                  })
                }
              />
              <Button title="Report" secondary onPress={() => setReportUser(u.id)} />
            </Row>
          </View>
        ))}
      </Card>
      {reportUser && (
        <Card>
          <Field label="Report details" multiline value={reason} onChangeText={setReason} />
          <Label muted>
            Reports go to your instance operator. This is not an emergency service.
          </Label>
          <Button
            title="Submit report"
            onPress={() =>
              void act(async () => {
                await api.request('/reports', 'POST', { userId: reportUser, reason });
                setReportUser(null);
                setReason('');
              })
            }
          />
        </Card>
      )}
      {friends.data?.map((f) => (
        <Card key={f.id}>
          <Label bold size={18}>
            {f.name}
          </Label>
          <Label muted>
            @{f.username} · {f.status}
          </Label>
          <Row wrap>
            {f.status === 'pending' && f.target_id === session?.profile.id && (
              <Button
                title="Accept request"
                onPress={() =>
                  void act(() => api.request('/friends/requests/' + f.id + '/accept', 'POST'))
                }
              />
            )}
            <Button
              title={f.status === 'pending' ? 'Decline / cancel' : 'Remove friend'}
              secondary
              onPress={() => void act(() => api.request('/friends/' + f.id, 'DELETE'))}
            />
          </Row>
        </Card>
      ))}
      {friends.data?.length === 0 && (
        <Empty
          icon="people-outline"
          title="Every journey starts with your people"
          text="Find a friend by username or invite them directly from a Journey Room."
        />
      )}
      <Info text="No address book is uploaded. Friendship never grants location access. Blocking removes invitations and prevents both people from viewing each other’s live location, including in existing rooms." />
    </View>
  );
}
