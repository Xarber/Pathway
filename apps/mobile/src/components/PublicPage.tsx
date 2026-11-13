// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Theme, colors, Icon, Label, Row, useTheme, type IconName } from './ui';
import { primaryAction } from '../../../../packages/design-system/src/colors';
import MaterialSurface from './MaterialSurface';
export function PublicLink({
  href,
  children,
  primary = false,
  icon = 'arrow-forward-outline',
}: {
  href: string;
  children: string;
  primary?: boolean;
  icon?: IconName;
}) {
  const c = useTheme();
  return (
    <a
      href={href}
      aria-label={children}
      style={{
        minHeight: 48,
        padding: '14px 20px',
        borderRadius: 16,
        backgroundColor: primary ? primaryAction : c.soft,
        color: primary ? '#fff' : c.accent,
        fontSize: 15,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: '600',
        textAlign: 'center',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
        boxSizing: 'border-box',
      }}
    >
      <Icon name={icon} size={18} color={primary ? '#fff' : c.accent} />
      {'  '}
      {children}
    </a>
  );
}
export default function PublicPage({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setDark(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const c = dark ? colors.dark : colors.light;
  const { width } = useWindowDimensions();
  return (
    <Theme.Provider value={c}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View
            style={{
              width: '100%',
              maxWidth: 1240,
              alignSelf: 'center',
              paddingHorizontal: width > 700 ? 48 : 22,
              gap: 44,
            }}
          >
            <MaterialSurface style={{ paddingVertical: 20, gap: 16 }}>
              <Row wrap>
                <Link href="/?view=welcome" accessibilityLabel="Pathway introduction">
                  <Row>
                    <Icon name="git-merge-outline" size={28} />
                    <Label size={24} bold>
                      pathway
                    </Label>
                  </Row>
                </Link>
                <View style={{ flex: 1 }} />
                <PublicLink href="/guide" icon="book-outline">
                  Guide
                </PublicLink>
                <PublicLink href="/?view=app" primary>
                  Open app
                </PublicLink>
              </Row>
            </MaterialSurface>
            {children}
            <View style={{ paddingTop: 24, borderTopWidth: 1, borderColor: c.line, gap: 16 }}>
              <Row wrap>
                <Icon name="git-merge-outline" />
                <Label bold>Pathway · OpenRecode</Label>
                <View style={{ flex: 1 }} />
                <Link href="/?view=welcome" style={{ color: c.accent, padding: 12 }}>
                  Introduction
                </Link>
                <Link href="/guide" style={{ color: c.accent, padding: 12 }}>
                  Privacy & documentation
                </Link>
                <Link href="/license.txt" style={{ color: c.accent, padding: 12 }}>
                  AGPL-3.0-only
                </Link>
              </Row>
              <Label muted size={12}>
                Development build · Native binaries are not published. No public hosted instance is
                activated by this checkout.
              </Label>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Theme.Provider>
  );
}
