// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
export function useDeveloperAccess() {
  const [unlocked, setUnlocked] = useState(false);
  const activity = useRef(Date.now());
  const taps = useRef<number[]>([]);
  const touch = useCallback(() => {
    activity.current = Date.now();
  }, []);
  const versionTap = () => {
    const now = Date.now();
    taps.current = taps.current.filter((t) => now - t < 2000);
    taps.current.push(now);
    if (taps.current.length >= 3) {
      setUnlocked(true);
      touch();
      taps.current = [];
    }
  };
  useEffect(() => {
    const expire = () => {
      if (Date.now() - activity.current >= 30000) setUnlocked(false);
    };
    const interval = setInterval(expire, 1000);
    const sub = AppState.addEventListener('change', expire);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('pointerdown', touch);
      document.addEventListener('keydown', touch);
    }
    return () => {
      clearInterval(interval);
      sub.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('pointerdown', touch);
        document.removeEventListener('keydown', touch);
      }
    };
  }, [touch]);
  return { unlocked, touch, versionTap };
}
