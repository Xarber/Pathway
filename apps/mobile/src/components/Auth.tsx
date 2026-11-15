// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react';
import { View } from 'react-native';
import { canSwitchInstance, serverConfigured, useSession } from '../lib/session';
import { Card, Button, Chip, Field, Heading, Info, Label, Row, Icon } from './ui';
export default function Auth() {
  const { authenticate, base, act, switchInstance } = useSession();
  const [register, setRegister] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [instance, setInstance] = useState(base);
  const [showInstance, setShowInstance] = useState(false);
  async function submit() {
    setBusy(true);
    await authenticate(
      register ? '/auth/register' : '/auth/login',
      register ? { email, password, name, username } : { email, password },
    );
    setBusy(false);
  }
  if (!serverConfigured) {
    return (
      <Card>
        <Heading>Pathway is temporarily unavailable</Heading>
        <Label>Try again later or contact the service operator.</Label>
      </Card>
    );
  }
  return (
    <View
      style={{ gap: 24, maxWidth: 520, width: '100%', alignSelf: 'center', paddingVertical: 28 }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 23,
          backgroundColor: '#6269F5',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="git-merge-outline" color="#fff" size={35} />
      </View>
      <Heading subtitle="Different paths. One destination.">Make your way. Together.</Heading>
      <Label muted>
        Plan a journey, invite your people, and meet along the way. Share just enough, for just as
        long as you choose.
      </Label>
      <Card>
        <Row>
          <Icon name="shield-checkmark-outline" />
          <Label>No permanent location sharing. You decide who sees what.</Label>
        </Row>
        <Row wrap>
          <Chip title="Create account" active={register} onPress={() => setRegister(true)} />
          <Chip title="Sign in" active={!register} onPress={() => setRegister(false)} />
        </Row>
        {register && (
          <>
            <Field
              label="Display name"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              placeholder="What should we call you?"
            />
            <Field
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="your_name"
            />
          </>
        )}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.org"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={register ? 'new-password' : 'current-password'}
          placeholder={register ? 'At least 12 characters' : 'Your password'}
        />
        <Button
          title={busy ? 'One moment…' : register ? 'Let’s get going' : 'Welcome back'}
          disabled={busy}
          icon="arrow-forward-outline"
          onPress={() => void submit()}
        />
        <Info text="You can coordinate through manual status and ETA without granting location access. Joining never enables tracking. Location permission is requested only for a route origin or explicit location sharing. Email verification, password recovery and guest identities are not available yet." />
      </Card>
      {canSwitchInstance && (
        <Button
          title="Connect to your own instance"
          secondary
          icon="server-outline"
          onPress={() => setShowInstance(!showInstance)}
        />
      )}
      {canSwitchInstance && showInstance && (
        <Card>
          <Field
            label="Instance origin"
            value={instance}
            onChangeText={setInstance}
            autoCapitalize="none"
          />
          <Label muted>The instance operator is trusted with your account and shared data.</Label>
          <Button
            title="Validate instance"
            icon="checkmark-circle-outline"
            onPress={() => void act(() => switchInstance(instance))}
          />
        </Card>
      )}
      <Label muted size={12}>
        Pathway by OpenRecode · Private coordination, built in the open.
      </Label>
    </View>
  );
}
