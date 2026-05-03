import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, ChevronLeft, ChevronRight, Dumbbell, FileText, Leaf, UtensilsCrossed } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const [counts, setCounts] = useState({ programs: 0, sessions: 0, recipes: 0, mindset: 0 });

  const refresh = useCallback(async () => {
    const [
      { count: programs },
      { count: sessions },
      { count: recipes },
      { count: mindset },
    ] = await Promise.all([
      supabase.from('programs').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('recipes').select('*', { count: 'exact', head: true }),
      supabase.from('mindset_content').select('*', { count: 'exact', head: true }),
    ]);
    setCounts({
      programs: programs ?? 0,
      sessions: sessions ?? 0,
      recipes: recipes ?? 0,
      mindset: mindset ?? 0,
    });
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

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
          gap: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          ADMIN
        </Text>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Tableau de bord
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Gère le contenu que tes clientes verront dans l'app.
        </Text>

        <View style={{ marginTop: Spacing.lg, gap: Spacing.md }}>
          <Tile
            icon={Dumbbell}
            title="Programmes"
            count={counts.programs}
            onPress={() => router.push('/(admin)/programs' as any)}
            palette={palette}
          />
          <Tile
            icon={FileText}
            title="Séances"
            count={counts.sessions}
            onPress={() => router.push('/(admin)/sessions' as any)}
            palette={palette}
          />
          <Tile
            icon={UtensilsCrossed}
            title="Recettes"
            count={counts.recipes}
            onPress={() => router.push('/(admin)/recipes' as any)}
            palette={palette}
          />
          <Tile
            icon={Leaf}
            title="Mindset"
            count={counts.mindset}
            onPress={() => router.push('/(admin)/mindset' as any)}
            palette={palette}
          />
          <Tile
            icon={Bell}
            title="Envoyer un push"
            count="Notification à tes clientes"
            onPress={() => router.push('/(admin)/push' as any)}
            palette={palette}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Tile({
  icon: Icon,
  title,
  count,
  onPress,
  disabled,
  palette,
}: {
  icon: any;
  title: string;
  count: number | string;
  onPress?: () => void;
  disabled?: boolean;
  palette: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: palette.surface,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: palette.text }]}>
        <Icon size={20} color={palette.background} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.tileTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
          {title}
        </Text>
        <Text style={[styles.tileCount, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {typeof count === 'number' ? `${count} entrées` : count}
        </Text>
      </View>
      {!disabled && <ChevronRight size={18} color={palette.textSecondary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  eyebrow: { fontSize: 11, letterSpacing: 1.6 },
  title: { fontSize: 32, letterSpacing: -0.5, marginTop: 4 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  tileIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  tileTitle: { fontSize: 16 },
  tileCount: { fontSize: 13, marginTop: 2 },
});
