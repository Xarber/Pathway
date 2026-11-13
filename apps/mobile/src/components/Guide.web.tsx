// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import { View } from 'react-native';
import PublicPage, { PublicLink } from './PublicPage';
import { Card, Label, Row, SectionTitle, Icon } from './ui';
function Code({ children }: { children: string }) {
  return (
    <Card>
      <Label size={13}>{children}</Label>
    </Card>
  );
}
export default function Guide() {
  return (
    <PublicPage>
      <View style={{ gap: 24, maxWidth: 850 }}>
        <Label size={40} bold>
          Your Pathway guide
        </Label>
        <Label size={18} muted>
          How to use, install, and host the current development version. This page is readable
          without an account.
        </Label>
        <SectionTitle icon="globe-outline">Use the web app</SectionTitle>
        <Label>
          Open the app, create an account on your chosen instance, and plan a journey. Invite
          someone by username or a temporary invitation token. The invitation must be accepted
          before they can participate. Joining a room never enables location sharing.
        </Label>
        <PublicLink href="/?view=app" primary>
          Open the web app
        </PublicLink>
        <SectionTitle icon="download-outline">Install the PWA</SectionTitle>
        <Label>
          When your instance is served over HTTPS, use the browser’s Install app option on supported
          desktop and Android browsers. On iPhone or iPad, use Safari’s Share menu and Add to Home
          Screen. Browser features vary; installation on physical devices has not yet been verified
          for this build.
        </Label>
        <Label muted>
          The app shell and saved room metadata can be viewed offline. Fresh group updates, search
          and routing need a connection. Offline map downloads are not provided.
        </Label>
        <SectionTitle icon="phone-portrait-outline">Build for iOS or Android</SectionTitle>
        <Label>
          Native packages are not published. There are no IPA, simulator, APK or AAB download links
          yet. On an existing configured toolchain, use the repository checkout and a reachable
          instance:
        </Label>
        <Code>
          {'npm ci\ncd apps/mobile\nnpx expo run:ios --device\n# or\nnpx expo run:android --device'}
        </Code>
        <Label muted>
          iOS needs Xcode and device provisioning. Android needs a compatible SDK and a restricted
          Maps SDK key. Do not install large SDKs or change signing keys without authorization.
          Background tracking, notifications and native update installation remain unavailable.
        </Label>
        <SectionTitle icon="shield-checkmark-outline">Understand what you share</SectionTitle>
        <Label>
          Manual status works without location permission. ETA-only reveals an arrival estimate, not
          coordinates. Approximate mode reduces positions to coarse geographic cells before storage.
          Precise mode shares the latest authorized fix and its accuracy. Each grant has selected
          viewers and an expiry.
        </Label>
        <Label>
          Foreground location is collected only after you opt in and grant permission. Native
          collection pauses in the background. Stop sharing removes future access and the stored
          live fix after server confirmation; previously viewed data or screenshots cannot be erased
          remotely. During a disconnection, the app cannot claim that server revocation has
          succeeded.
        </Label>
        <Label>
          Live fixes become stale after one minute and expire after five minutes. There is no
          automatic permanent GPS history. The instance operator is trusted with the information
          sent to their server. Room metadata cached locally can include destination coordinates;
          protect access to your device.
        </Label>
        <SectionTitle icon="server-outline">Host your own instance</SectionTitle>
        <Label>
          X-Center is the default infrastructure target. The repository contains an isolated
          PostGIS/API Compose setup, a static web export, and a staged X-Center package workflow. No
          live deployment or public hostname is activated automatically.
        </Label>
        <Code>
          {'npm ci\nnpm run db:migrate\nnpm run dev:server\n# another terminal\nnpm run web'}
        </Code>
        <Label>
          For container hosting, configure the root environment file and use the documented Compose
          configuration. Routing and geocoding services are configured independently; self-hosting
          the API does not make third-party tiles or navigation services unlimited or free.
        </Label>
        <Code>
          {
            'docker compose --env-file .env -f infra/compose.yml up -d --build db api\nnpm run export:web'
          }
        </Code>
        <SectionTitle icon="document-text-outline">Documentation and source</SectionTitle>
        <Label>
          The repository’s docs/INDEX.md links architecture, API, maps, routing, privacy, native
          build instructions and the honest feature-status matrix. docs/XCENTER.md describes staging
          and rollback.
        </Label>
        <Label>
          Original Pathway code is AGPL-3.0-only. Third-party libraries, fonts and map data retain
          their licenses and attribution requirements. Operators deploying a modified network
          service must provide the corresponding source required by that license. Native SDK/store
          compatibility still needs a distribution review.
        </Label>
        <PublicLink href="https://github.com/Xarber/Pathway" icon="logo-github">
          View source on GitHub
        </PublicLink>
        <PublicLink href="/license.txt" icon="document-text-outline">
          Read AGPL-3.0-only
        </PublicLink>
        <Row>
          <Icon name="information-circle-outline" />
          <Label muted>
            Pathway is not an emergency-response service and does not guarantee continuous tracking,
            route legality or arrival times.
          </Label>
        </Row>
      </View>
    </PublicPage>
  );
}
