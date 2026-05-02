import { BookOpen, Heart, LogOut, Sparkles } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/ui/activity-card';
import { SectionTitle } from '@/components/ui/section-title';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { signOut } from '@/lib/auth';
import { useAuth } from '@/lib/auth-provider';

export default function MindsetScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();

  async function handleLogout() {
    try {
      await signOut();
    } catch (e: any) {
      Alert.alert('Déconnexion impossible', e?.message ?? 'Erreur.');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingHorizontal: Spacing.xl,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          INTENTION DU JOUR
        </Text>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Mindset
        </Text>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionTitle title="Aujourd'hui" />
          <View style={{ gap: Spacing.md }}>
            <ActivityCard
              icon={Sparkles}
              title="Affirmation"
              subtitle="« Je fais ce qui est bon pour moi. »"
            />
            <ActivityCard
              icon={Heart}
              title="Méditation 5 min"
              subtitle="Respiration consciente"
            />
            <ActivityCard
              icon={BookOpen}
              title="Journal"
              subtitle="Note tes ressentis du jour"
            />
          </View>
        </View>

        {user && (
          <View style={{ marginTop: Spacing.xxxl }}>
            <Text style={[styles.userInfo, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              Connecté en tant que {user.email ?? user.id.slice(0, 8)}
            </Text>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logout,
                {
                  borderColor: palette.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <LogOut size={18} color={palette.text} />
              <Text style={[styles.logoutText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                Se déconnecter
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 1.6 },
  title: {
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
    marginTop: Spacing.sm,
  },
  userInfo: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  logoutText: { fontSize: 15 },
});
