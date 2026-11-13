// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import PublicPage, { PublicLink } from './PublicPage';
import { Card, Icon, Label, Row, SectionTitle, useTheme, type IconName } from './ui';
const features: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'navigate-outline',
    title: 'Make a plan',
    body: 'Choose a destination and calculate your own route with the instance’s routing provider.',
  },
  {
    icon: 'people-outline',
    title: 'Bring your people',
    body: 'Create a temporary Journey Room, invite a friend, and coordinate after they accept.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Share on your terms',
    body: 'Choose who can see precise, approximate, or ETA-only updates. Stop sharing at any time.',
  },
];
function Content() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 850px)');
    const update = () => setWide(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const c = useTheme();
  return (
    <>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 48, alignItems: 'center' }}>
        <View style={{ flex: 1, gap: 24 }}>
          <Row>
            <Icon name="git-merge-outline" />
            <Label size={12} bold muted>
              DIFFERENT PATHS. ONE DESTINATION.
            </Label>
          </Row>
          <Label size={wide ? 62 : 43} bold>
            Meet up.{`\n`}Without keeping{`\n`}tabs.
          </Label>
          <Label size={19} muted>
            Your route is yours. Your destination can be shared.
          </Label>
          <Label muted>
            Plan a journey, invite your people, and see enough of each other’s progress to arrive
            together. When the meetup ends, temporary sharing does too.
          </Label>
          <Row wrap>
            <PublicLink href="/?view=app" primary>
              Open the web app
            </PublicLink>
            <PublicLink href="/guide" icon="download-outline">
              Install options
            </PublicLink>
          </Row>
          <Row wrap>
            <Icon name="globe-outline" size={18} />
            <Label size={13} muted>
              Web available · iOS & Android in development
            </Label>
          </Row>
        </View>
        <View
          style={{
            width: wide ? 320 : '100%',
            maxWidth: 370,
            alignItems: 'center',
            padding: 20,
            borderRadius: 36,
            backgroundColor: c.soft,
            gap: 15,
          }}
        >
          <Image
            accessibilityLabel="Actual Pathway web Home screen showing a QA account and an empty journey list"
            source={{ uri: '/screenshots/browser-home.png' }}
            style={{
              width: '100%',
              maxWidth: 274,
              aspectRatio: 393 / 852,
              borderRadius: 23,
              borderWidth: 1,
              borderColor: c.line,
            }}
            resizeMode="contain"
          />
          <Label size={12} muted>
            Actual web interface · QA profile{`\n`}No participant locations or private journey data
          </Label>
        </View>
      </View>
      <View style={{ gap: 22 }}>
        <SectionTitle icon="compass-outline">A little less “where are you?”</SectionTitle>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18 }}>
          {features.map((f) => (
            <Card key={f.title} style={{ flex: 1 }}>
              <Icon name={f.icon} size={28} />
              <Label bold size={21}>
                {f.title}
              </Label>
              <Label muted>{f.body}</Label>
            </Card>
          ))}
        </View>
      </View>
      <Card style={{ padding: wide ? 36 : 24 }}>
        <SectionTitle icon="shield-checkmark-outline">
          A meetup is a moment. Not a monitoring plan.
        </SectionTitle>
        <View style={{ gap: 16 }}>
          {[
            {
              icon: 'person-add-outline',
              title: 'An invitation is not permission',
              body: 'Accepting a room never switches on your location. Every participant makes their own sharing choice.',
            },
            {
              icon: 'time-outline',
              title: 'Every sharing grant expires',
              body: 'Pick selected viewers for a time-limited session. Revocation removes live positions from future updates.',
            },
            {
              icon: 'hand-left-outline',
              title: 'No location permission? You can still join.',
              body: 'Coordinate with manual status or a self-reported ETA. Precise coordinates are optional.',
            },
          ].map((item) => (
            <Row key={item.title}>
              <Icon name={item.icon as IconName} />
              <View style={{ flex: 1, gap: 5 }}>
                <Label bold>{item.title}</Label>
                <Label muted>{item.body}</Label>
              </View>
            </Row>
          ))}
        </View>
        <PublicLink href="/guide" icon="reader-outline">
          Read the privacy guide
        </PublicLink>
      </Card>
      <View style={{ gap: 20 }}>
        <SectionTitle icon="phone-portrait-outline">
          Same destination. Different devices.
        </SectionTitle>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18 }}>
          <Card style={{ flex: 1 }}>
            <Icon name="globe-outline" />
            <Label bold size={21}>
              Web & PWA
            </Label>
            <Label muted>
              Use the functional web app. Install it from a supported browser when served over
              HTTPS. The app shell and cached journey details remain available offline.
            </Label>
            <PublicLink href="/?view=app" primary>
              Start a journey
            </PublicLink>
          </Card>
          <Card style={{ flex: 1 }}>
            <Icon name="phone-portrait-outline" />
            <Label bold size={21}>
              iOS & Android
            </Label>
            <Label muted>
              Built from shared Expo source. Native compilation, physical-device validation and
              distribution are still pending. Background tracking is not enabled.
            </Label>
            <PublicLink href="/guide" icon="code-slash-outline">
              Development build guide
            </PublicLink>
          </Card>
        </View>
      </View>
      <View style={{ padding: wide ? 36 : 24, borderRadius: 28, backgroundColor: c.soft, gap: 18 }}>
        <SectionTitle icon="code-slash-outline">Open by design. Yours to host.</SectionTitle>
        <Label muted>
          Pathway belongs to OpenRecode: no ads and no mandatory subscription for the core app.
          Original code is licensed under AGPL-3.0-only. X-Center is the default hosting target;
          compatible private instances can also be configured.
        </Label>
        <Label size={13} muted>
          This is a development release. Routing depends on configured providers and map coverage;
          advanced interception, transit, background tracking and notifications are not available
          yet.
        </Label>
        <Row wrap>
          <PublicLink href="/guide" icon="server-outline">
            Self-hosting & documentation
          </PublicLink>
          <PublicLink href="/license.txt" icon="document-text-outline">
            Read the license
          </PublicLink>
        </Row>
      </View>
    </>
  );
}
export default function Welcome() {
  return (
    <PublicPage>
      <Content />
    </PublicPage>
  );
}
