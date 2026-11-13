// SPDX-License-Identifier: AGPL-3.0-only
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform, type ViewProps } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
} from 'react-native-reanimated';
import { MOTION, motionPolicy } from '../../../../packages/design-system/src/motion';
const Defaults = { reduceMotion: true, reduceTransparency: true, highContrast: false };
const Context = createContext(Defaults);
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(Defaults);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const motion = matchMedia('(prefers-reduced-motion: reduce)'),
        transparency = matchMedia('(prefers-reduced-transparency: reduce)'),
        contrast = matchMedia('(prefers-contrast: more)');
      const update = () =>
        setPreferences({
          reduceMotion: motion.matches,
          reduceTransparency: transparency.matches,
          highContrast: contrast.matches,
        });
      update();
      for (const query of [motion, transparency, contrast])
        query.addEventListener('change', update);
      return () => {
        for (const query of [motion, transparency, contrast])
          query.removeEventListener('change', update);
      };
    }
    let alive = true;
    void Promise.all([
      AccessibilityInfo.isReduceMotionEnabled(),
      AccessibilityInfo.isReduceTransparencyEnabled(),
    ])
      .then(([reduceMotion, reduceTransparency]) => {
        if (alive) setPreferences({ reduceMotion, reduceTransparency, highContrast: false });
      })
      .catch(() => {});
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduceMotion) =>
      setPreferences((p) => ({ ...p, reduceMotion })),
    );
    const transparency = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      (reduceTransparency) => setPreferences((p) => ({ ...p, reduceTransparency })),
    );
    return () => {
      alive = false;
      motion.remove();
      transparency.remove();
    };
  }, []);
  return <Context.Provider value={preferences}>{children}</Context.Provider>;
}
export function useMotion() {
  const preferences = useContext(Context);
  return { ...preferences, policy: motionPolicy(preferences.reduceMotion) };
}
export function MotionReveal({
  kind = 'disclosure',
  children,
  ...props
}: ViewProps & { kind?: 'disclosure' | 'feedback' }) {
  const { policy } = useMotion();
  const entering = useMemo(
    () =>
      kind === 'feedback' && policy.translateFeedback
        ? FadeInDown.duration(policy.feedbackMs).easing(Easing.bezier(...MOTION.easeOutBezier))
        : FadeIn.duration(kind === 'feedback' ? policy.feedbackMs : policy.disclosureMs),
    [kind, policy.feedbackMs, policy.disclosureMs, policy.translateFeedback],
  );
  const exiting = useMemo(
    () =>
      kind === 'feedback' && policy.translateFeedback
        ? FadeOutDown.duration(MOTION.exitMs)
        : FadeOut.duration(MOTION.exitMs),
    [kind, policy.translateFeedback],
  );
  return (
    <Animated.View entering={entering} exiting={exiting} {...props}>
      {children}
    </Animated.View>
  );
}
