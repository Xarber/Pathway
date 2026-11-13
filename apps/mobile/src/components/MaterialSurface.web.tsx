// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from './ui';
import { useMotion } from '../lib/motion';
export default function MaterialSurface({ style, ...props }: ViewProps) {
  const c = useTheme();
  const { reduceTransparency, highContrast } = useMotion();
  return reduceTransparency || highContrast ? (
    <View {...props} style={[style, { backgroundColor: c.surface, borderColor: c.text }]} />
  ) : (
    <BlurView
      {...props}
      intensity={24}
      tint={c.bg === '#101321' ? 'dark' : 'light'}
      style={style}
    />
  );
}
