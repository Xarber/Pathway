// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { GlassView, isLiquidGlassAvailable, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { useTheme } from './ui';
import { useMotion } from '../lib/motion';
export default function MaterialSurface({ style, ...props }: ViewProps) {
  const c = useTheme();
  const { reduceTransparency, highContrast } = useMotion();
  let supported = false;
  try {
    supported =
      !reduceTransparency &&
      !highContrast &&
      isLiquidGlassAvailable() &&
      isGlassEffectAPIAvailable();
  } catch {
    /* An older development client may lack the module. Keep the readable fallback. */
  }
  return supported ? (
    <GlassView
      {...props}
      glassEffectStyle="regular"
      colorScheme={c.bg === '#101321' ? 'dark' : 'light'}
      style={style}
    />
  ) : (
    <View {...props} style={[style, { backgroundColor: c.surface }]} />
  );
}
