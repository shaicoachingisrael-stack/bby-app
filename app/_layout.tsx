import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth-provider';
import { ProfileProvider, useProfile } from '@/lib/use-profile';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const colorScheme = useColorScheme();
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    const root = (segments[0] as string) ?? '';
    const inAuth = root === '(auth)';
    const inOnboarding = root === '(onboarding)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/welcome' as any);
      return;
    }

    // Wait until we know if the profile is loaded
    if (profileLoading) return;

    const needsOnboarding = !profile?.onboarded_at;
    if (needsOnboarding) {
      if (!inOnboarding) router.replace('/(onboarding)' as any);
    } else if (inAuth || inOnboarding) {
      router.replace('/today');
    }
  }, [session, authLoading, profile, profileLoading, segments, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="chat"
          options={{ presentation: 'modal', title: 'Coach IA' }}
        />
        <Stack.Screen
          name="account"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="meal-log"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="hydration-log"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="mindset-log"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name="session/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <ProfileProvider>
        <RootStack />
      </ProfileProvider>
    </AuthProvider>
  );
}
