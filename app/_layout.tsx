import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth-store';

const qc = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, hydrated, hydrate } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (!hydrated) return;
    const inAuth = segments[0] === '(auth)';
    if (!token && !inAuth) router.replace('/(auth)/login');
    if (token && inAuth) router.replace('/(tabs)');
  }, [token, hydrated, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <AuthGuard>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F5F6FA' } }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="order/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="account" />
            <Stack.Screen name="create-shipment" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="wallet-recharge" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="manage-couriers" options={{ presentation: 'card' }} />
            <Stack.Screen name="courier-assignment" options={{ presentation: 'card' }} />
            <Stack.Screen name="pending-payouts" options={{ presentation: 'card' }} />
            <Stack.Screen name="payout/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="label-pickup" options={{ presentation: 'card' }} />
            <Stack.Screen name="weight-discrepancy" options={{ presentation: 'card' }} />
            <Stack.Screen name="invoice/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="clubbed-print" options={{ presentation: 'card' }} />
            <Stack.Screen name="bulk-assign" options={{ presentation: 'card' }} />
          </Stack>
        </AuthGuard>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
