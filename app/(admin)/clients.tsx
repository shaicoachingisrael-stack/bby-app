import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Settings2, Star } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCoachingClients } from '@/lib/use-coaching-admin';

export default function ClientsAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { clients, loading, refresh } = useCoachingClients();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const premium = clients.filter((c) => c.is_personal_coaching);
  const others = clients.filter((c) => !c.is_personal_coaching);

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>Retour</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(admin)/coaching-offer-edit' as any)}
          hitSlop={12}
          style={styles.offerBtn}
        >
          <Settings2 size={18} color={palette.text} />
          <Text style={[styles.offerText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>Offre</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>Clientes</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Suivi perso en tête. Touche une cliente pour activer son coaching et gérer son plan.
        </Text>

        {loading ? (
          <ActivityIndicator color={palette.text} style={{ marginTop: Spacing.xl }} />
        ) : (
          <>
            {premium.length > 0 && (
              <>
                <Text style={[styles.groupLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                  COACHING PERSO
                </Text>
                <View style={{ gap: Spacing.sm }}>
                  {premium.map((c) => (
                    <ClientRow key={c.id} c={c} palette={palette} premium onPress={() => router.push(`/(admin)/client/${c.id}` as any)} />
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.groupLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
              TOUTES LES CLIENTES
            </Text>
            {others.length === 0 && premium.length === 0 ? (
              <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                Aucune cliente inscrite pour l'instant.
              </Text>
            ) : (
              <View style={{ gap: Spacing.sm }}>
                {others.map((c) => (
                  <ClientRow key={c.id} c={c} palette={palette} onPress={() => router.push(`/(admin)/client/${c.id}` as any)} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ClientRow({ c, palette, premium, onPress }: any) {
  const initial = (c.display_name || '?')[0]?.toUpperCase();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: palette.surface, opacity: pressed ? 0.9 : 1 }]}>
      <View style={[styles.avatar, { backgroundColor: palette.text }]}>
        {c.avatar_url ? (
          <Image source={{ uri: c.avatar_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Text style={{ color: palette.background, fontFamily: Fonts.sansBold, fontSize: 16 }}>{initial}</Text>
        )}
      </View>
      <Text style={[styles.name, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
        {c.display_name || 'Sans nom'}
      </Text>
      {!premium && c.coaching_interest ? (
        <View style={[styles.interestBadge, { backgroundColor: palette.text }]}>
          <Text style={{ color: palette.background, fontFamily: Fonts.sansSemibold, fontSize: 11 }}>Intéressée</Text>
        </View>
      ) : null}
      {premium ? <Star size={16} color={palette.text} fill={palette.text} /> : null}
      <ChevronRight size={18} color={palette.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  offerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offerText: { fontSize: 14 },
  interestBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  title: { fontSize: 32, letterSpacing: -0.5, marginTop: Spacing.lg },
  subtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  groupLabel: { fontSize: 11, letterSpacing: 1.4, marginTop: Spacing.xl, marginBottom: Spacing.md },
  empty: { fontSize: 14, marginTop: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  name: { flex: 1, fontSize: 15 },
});
