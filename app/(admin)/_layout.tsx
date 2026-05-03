import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProfile } from '@/lib/use-profile';

export default function AdminLayout() {
  const palette = Colors[useColorScheme() ?? 'light'];
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  if (!profile?.is_admin) {
    return <Redirect href="/today" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
