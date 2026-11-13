// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useTheme } from './ui';
// Android keeps an opaque native surface until a sampled blur target is configured.
export default function MaterialSurface(props: ViewProps) {
  const c = useTheme();
  return <View {...props} style={[{ backgroundColor: c.surface }, props.style]} />;
}
