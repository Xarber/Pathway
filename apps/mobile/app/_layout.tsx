// SPDX-License-Identifier: AGPL-3.0-only
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MotionProvider, useMotion } from '../src/lib/motion';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
const client = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 10000 } } });
function Routes() {
  const { reduceMotion } = useMotion();
  return (
    <Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'fade' : 'default' }} />
  );
}
export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MotionProvider>
          <QueryClientProvider client={client}>
            <Routes />
          </QueryClientProvider>
        </MotionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
