import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import WebFrame from '@/components/WebFrame';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { AppProvider, useApp } from '@/context/AppContext';
import { scheduleDaily } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/** Re-schedules the daily reminder whenever the user's streak changes, keeping
 *  the notification body up to date ("Day 5 streak 🔥 — keep it going!"). */
function NotificationStreakSync() {
  const { state } = useApp();
  const prevStreakRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state.loaded) return;
    if (!state.notificationsEnabled) return;
    if (prevStreakRef.current === state.streak) return;
    prevStreakRef.current = state.streak;
    scheduleDaily(state.notificationHour ?? 20, state.notificationMinute ?? 0, state.streak ?? 0);
  }, [state.loaded, state.notificationsEnabled, state.streak, state.notificationHour, state.notificationMinute]);

  return null;
}

function OnboardingGuard() {
  // Deep-linking (or refreshing) into any screen with no profile used to
  // let visitors wander the app half-onboarded ("HEY THERE", empty top 3).
  // Anyone without a name belongs on welcome; privacy stays public.
  const { state } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!state.loaded || state.name) return;
    if (pathname === '/welcome' || pathname === '/privacy' || pathname === '/') return;
    router.replace('/welcome');
  }, [state.loaded, state.name, pathname]);
  return null;
}

function RootLayoutNav() {
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Navigate to Study tab when the user taps a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(tabs)' as any);
    });
    return () => {
      responseListener.current?.remove();
    };
  }, [router]);

  return (
    <>
      <NotificationStreakSync />
      <OnboardingGuard />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
        <Stack.Screen name="quiz" />
        <Stack.Screen name="save-progress" />
        <Stack.Screen name="material" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PressStart2P_400Regular,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AppProvider>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <WebFrame>
                  <RootLayoutNav />
                </WebFrame>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </AppProvider>
  );
}
