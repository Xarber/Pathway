// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { View } from 'react-native';
import Welcome from '../components/Welcome';
import { IntroductionContext } from './introduction';

const preferenceKey = 'pathway:web-opened';

function initialView() {
  const params = new URLSearchParams(location.search);
  if (params.has('token') || params.get('view') === 'app') return true;
  if (params.get('view') === 'welcome') return false;
  try {
    return (
      localStorage.getItem(preferenceKey) === '1' || !!sessionStorage.getItem('pathway:session')
    );
  } catch {
    return false;
  }
}

function rememberEntry() {
  try {
    localStorage.setItem(preferenceKey, '1');
  } catch {
    // The current page and browser history still work without storage.
  }
}

export default function WebEntry({ children }: { children: ReactNode }) {
  const [inApp, setInApp] = useState(false);
  const [appMounted, setAppMounted] = useState(false);

  useEffect(() => {
    function syncView(event?: PopStateEvent) {
      const params = new URLSearchParams(location.search);
      const savedView = event ? history.state?.pathwayView : undefined;
      const app = params.has('token') || (savedView ? savedView === 'app' : initialView());
      if (!savedView)
        history.replaceState({ ...history.state, pathwayView: app ? 'app' : 'welcome' }, '');
      if (params.get('view') === 'app') rememberEntry();
      if (app) setAppMounted(true);
      setInApp(app);
    }
    syncView();
    window.addEventListener('popstate', syncView);
    return () => window.removeEventListener('popstate', syncView);
  }, []);

  function openApp(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const link = (event.target as Element).closest('a');
    if (link?.getAttribute('href') !== '/?view=app') return;
    event.preventDefault();
    rememberEntry();
    history.pushState({ ...history.state, pathwayView: 'app' }, '', '/');
    setAppMounted(true);
    setInApp(true);
  }

  function showIntroduction() {
    history.pushState({ ...history.state, pathwayView: 'welcome' }, '', '/');
    setInApp(false);
  }

  return (
    <IntroductionContext.Provider value={showIntroduction}>
      {!inApp && (
        <div
          className={appMounted ? 'pathway-entry-fade' : undefined}
          onClick={openApp}
          style={{ display: 'flex', flex: 1, minHeight: 0 }}
        >
          <Welcome />
        </div>
      )}
      {appMounted && (
        <View style={{ flex: 1, display: inApp ? 'flex' : 'none' }}>
          <div
            className={inApp ? 'pathway-entry-fade' : undefined}
            style={{ display: 'flex', flex: 1, minHeight: 0 }}
          >
            {children}
          </div>
        </View>
      )}
    </IntroductionContext.Provider>
  );
}
