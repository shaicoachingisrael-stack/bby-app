import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { applyDisplayFonts, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { loadAppearance, useAppearance } from '@/lib/appearance';
import '@/lib/i18n';
import { AuthProvider, useAuth } from '@/lib/auth-provider';
import { LocaleProvider } from '@/lib/locale-provider';
import { useNotificationResponse } from '@/lib/use-notification-response';
import { ProfileProvider, useProfile } from '@/lib/use-profile';
import { usePushSetup } from '@/lib/use-push-setup';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const palette = Colors[useColorScheme()];
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const segments = useSegments();
  const router = useRouter();

  usePushSetup();
  useNotificationResponse();

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
    <ThemeProvider
      value={{
        ...DarkTheme,
        colors: { ...DarkTheme.colors, background: palette.background, card: palette.background, border: palette.border, text: palette.text },
      }}
    >
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
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
        <Stack.Screen name="program/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="notifications"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="macros-help"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="video-viewer"
          options={{ presentation: 'fullScreenModal', headerShown: false }}
        />
        <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="menu" options={{ headerShown: false }} />
        <Stack.Screen name="menu-pick" options={{ headerShown: false }} />
        <Stack.Screen name="menu-add" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="shopping-list" options={{ headerShown: false }} />
        <Stack.Screen name="my-recipes" options={{ headerShown: false }} />
        <Stack.Screen name="my-recipe-edit" options={{ headerShown: false }} />
        <Stack.Screen name="mindset/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="mindset/rituals" options={{ headerShown: false }} />
        <Stack.Screen name="mindset/entries" options={{ headerShown: false }} />
        <Stack.Screen name="mindset/breathing" options={{ headerShown: false }} />
        <Stack.Screen name="mindset/breathe" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="mindset/programs" options={{ headerShown: false }} />
        <Stack.Screen name="mindset/program/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="mindset/favorites" options={{ headerShown: false }} />
        <Stack.Screen name="mindset/history" options={{ headerShown: false }} />
        <Stack.Screen name="my-coach" options={{ headerShown: false }} />
        <Stack.Screen name="coach-chat" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="coaching-offer" options={{ headerShown: false }} />
        <Stack.Screen
          name="language"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
      <StatusBar style="light" />
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
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_800ExtraBold,
  });
  // Apparence (Ember / encre) : lue une fois avant le premier écran, puis suivie.
  const appearance = useAppearance();
  const [appearanceReady, setAppearanceReady] = useState(false);
  useEffect(() => {
    loadAppearance().finally(() => setAppearanceReady(true));
  }, []);
  applyDisplayFonts(appearance);

  useEffect(() => {
    if ((fontsLoaded || fontError) && appearanceReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, appearanceReady]);

  if ((!fontsLoaded && !fontError) || !appearanceReady) return null;

  return (
    <AuthProvider>
      <ProfileProvider>
        <LocaleProvider>
          <RootStack key={appearance} />
        </LocaleProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
