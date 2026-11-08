import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Bby } from '@/components/bby/kit';
import { useProfile } from '@/lib/use-profile';

export default function AdminLayout() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Bby.bg }}>
        <ActivityIndicator color={Bby.text} />
      </View>
    );
  }

  if (!profile?.is_admin) {
    return <Redirect href="/today" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: Bby.bg } }} />;
}
