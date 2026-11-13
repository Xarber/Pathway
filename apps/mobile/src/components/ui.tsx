// SPDX-License-Identifier: AGPL-3.0-only
import React, { createContext, useContext } from 'react';
import {
  Text,
  View,
  Pressable,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import { useMotion, MotionReveal } from '../lib/motion';
import { MOTION } from '../../../../packages/design-system/src/motion';
import { Ionicons } from '@expo/vector-icons';
import { colors, primaryAction } from '../../../../packages/design-system/src/colors';
export { colors };
export const Theme = createContext(colors.light);
export const useTheme = () => useContext(Theme);
export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export function Icon({
  name,
  size = 22,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const c = useTheme();
  return <Ionicons name={name} size={size} color={color || c.accent} accessible={false} />;
}
export function Label({
  children,
  muted = false,
  size = 15,
  bold = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
  size?: number;
  bold?: boolean;
}) {
  const c = useTheme();
  return (
    <Text
      style={{
        color: muted ? c.muted : c.text,
        fontSize: size,
        fontWeight: bold ? '600' : '400',
        lineHeight: size * 1.45,
        flexShrink: 1,
      }}
    >
      {children}
    </Text>
  );
}
export function Heading({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <View style={{ gap: 7, marginBottom: 12 }}>
      <Label size={30} bold>
        {children}
      </Label>
      {subtitle && <Label muted>{subtitle}</Label>}
    </View>
  );
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const c = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderRadius: 24,
          padding: 22,
          borderWidth: 1,
          borderColor: c.line,
          gap: 15,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Row({ children, wrap = false }: { children: React.ReactNode; wrap?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: wrap ? 'wrap' : 'nowrap',
      }}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  icon,
  secondary = false,
  danger = false,
  disabled = false,
  compact = false,
  expanded,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  compact?: boolean;
  expanded?: boolean;
}) {
  const c = useTheme();
  const { policy } = useMotion();
  const [pressed, setPressed] = React.useState(false);
  const foreground = danger ? c.danger : secondary ? c.accent : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      accessibilityState={{ disabled, expanded }}
      aria-expanded={expanded}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={16}
      onPress={onPress}
      style={{ borderRadius: 15 }}
    >
      <Animated.View
        style={{
          minHeight: 48,
          paddingHorizontal: compact ? 13 : 18,
          paddingVertical: 11,
          borderRadius: 15,
          backgroundColor: danger ? c.soft : secondary ? c.soft : primaryAction,
          opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? policy.pressScale : 1 }],
          transitionProperty: ['transform', 'opacity'],
          transitionDuration: policy.pressMs,
          transitionTimingFunction: cubicBezier(...MOTION.easeOutBezier),
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 9,
        }}
      >
        {icon && <Icon name={icon} color={foreground} size={19} />}
        <Text style={{ fontSize: 14, fontWeight: '600', color: foreground, flexShrink: 1 }}>
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: 7 }}>
      <Label size={13} muted bold>
        {label}
      </Label>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        style={[
          {
            minHeight: 49,
            borderWidth: 1,
            borderColor: c.line,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: c.text,
            backgroundColor: c.bg,
            fontSize: 16,
          },
          props.multiline && { minHeight: 100, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}
export function Chip({
  title,
  onPress,
  active = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  active?: boolean;
  icon?: IconName;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 13,
        paddingVertical: 9,
        borderRadius: 13,
        backgroundColor: active ? c.soft : c.surface,
        borderWidth: 1,
        borderColor: active ? c.accent : c.line,
      }}
    >
      {icon && <Icon name={icon} size={18} color={active ? c.accent : c.muted} />}
      <Text
        style={{
          fontSize: 13,
          fontWeight: active ? '600' : '400',
          color: active ? c.accent : c.muted,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Info({ text }: { text: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Button
        title={open ? 'Hide details' : 'How this works'}
        icon="information-circle-outline"
        secondary
        compact
        onPress={() => setOpen(!open)}
        expanded={open}
      />
      {open && (
        <MotionReveal>
          <Label muted size={13}>
            {text}
          </Label>
        </MotionReveal>
      )}
    </View>
  );
}
export function Empty({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
      <Icon name={icon} size={34} />
      <Label bold size={18}>
        {title}
      </Label>
      <Label muted>{text}</Label>
    </Card>
  );
}
export function time(value: number) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SectionTitle({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <Row>
      <Icon name={icon} />
      <Label size={19} bold>
        {children}
      </Label>
    </Row>
  );
}
