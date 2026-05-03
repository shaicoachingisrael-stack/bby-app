import { useRouter } from 'expo-router';
import { ChevronLeft, Droplet } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';

const QUICK = [250, 500, 1000];

export default function HydrationLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const [busy, setBusy] = useState<number | null>(null);

  async function add(ml: number) {
    if (!user) return;
    setBusy(ml);
    try {
      const { error } = await supabase
        .from('hydration_entries')
        .insert({ user_id: user.id, ml });
      if (error) throw error;
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Sauvegarde impossible.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            Retour
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
          gap: Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Ajouter de l'eau
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Choisis une quantité pour la logger en un tap.
        </Text>

        <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
          {QUICK.map((ml) => (
            <Pressable
              key={ml}
              disabled={busy !== null}
              onPress={() => add(ml)}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: busy === ml ? palette.text : palette.surface,
                  borderColor: palette.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: busy === ml ? palette.background : palette.text },
                ]}
              >
                <Droplet
                  size={20}
                  color={busy === ml ? Palette.encre : Palette.albatre}
                  fill={busy === ml ? Palette.encre : Palette.albatre}
                />
              </View>
              <Text
                style={[
                  styles.amount,
                  {
                    color: busy === ml ? palette.background : palette.text,
                    fontFamily: Fonts.displayBold,
                  },
                ]}
              >
                + {ml} ml
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  title: {
    fontSize: 30,
    letterSpacing: -0.5,
    marginTop: Spacing.lg,
  },
  subtitle: { fontSize: 15, lineHeight: 22 },
  button: {
    height: 80,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: { fontSize: 24, letterSpacing: -0.4 },
});
