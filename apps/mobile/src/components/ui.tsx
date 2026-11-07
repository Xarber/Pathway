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
import { Ionicons } from '@expo/vector-icons';
export const colors = {
  light: {
    bg: '#F6F7FB',
    surface: '#FFFFFF',
    text: '#1E2339',
    muted: '#687087',
    line: '#E6E9F1',
    soft: '#EDEEFF',
    accent: '#5158DC',
    success: '#18795B',
  },
  dark: {
    bg: '#101321',
    surface: '#1B2033',
    text: '#F2F3FD',
    muted: '#B0B8CE',
    line: '#343C56',
    soft: '#2D3153',
    accent: '#ADB1FF',
    success: '#7AD8B6',
  },
};
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
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const c = useTheme();
  const foreground = danger ? '#B92F4F' : secondary ? c.accent : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 46,
        paddingHorizontal: compact ? 13 : 18,
        paddingVertical: 11,
        borderRadius: 15,
        backgroundColor: danger ? c.soft : secondary ? c.soft : '#6269F5',
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 9,
      })}
    >
      {icon && <Icon name={icon} color={foreground} size={19} />}
      <Text style={{ fontSize: 14, fontWeight: '600', color: foreground, flexShrink: 1 }}>
        {title}
      </Text>
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
        minHeight: 44,
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
      />
      {open && (
        <Label muted size={13}>
          {text}
        </Label>
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
