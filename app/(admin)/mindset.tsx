import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Leaf, Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminHeader, a } from '@/components/bby/admin/ui';
import { BFont, BbyScreen, Bby, PillButton } from '@/components/bby/kit';
import { useMindsetContent } from '@/lib/use-content';

const KIND_LABELS: Record<string, string> = {
  meditation: 'Méditation',
  article: 'Article',
  affirmation: 'Affirmation',
};

// Contenus Mindset (méditations, articles, affirmations) : bibliothèque de l'ancien design.
export default function MindsetAdminScreen() {
  const router = useRouter();
  const { items, loading, refresh } = useMindsetContent();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <BbyScreen bottomSpace={40}>
      <View style={{ gap: 18 }}>
        <AdminHeader
          title="Mindset"
          intro="Tes méditations et lectures. Elles s’affichent dans Mindset › Tous, sous « Méditations et lectures ». Touche un contenu pour le modifier."
        />
        <PillButton label="Créer un contenu" icon={Plus} variant="yellow" onPress={() => router.push('/(admin)/mindset-edit' as any)} />

        {loading ? (
          <ActivityIndicator color={Bby.text} style={{ marginTop: 30 }} />
        ) : items.length === 0 ? (
          <Text style={a.hint}>Aucun contenu pour l’instant.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {items.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => router.push(`/(admin)/mindset-edit?id=${m.id}` as any)}
                accessibilityRole="button"
                style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}
              >
                {m.cover_url ? (
                  <Image source={{ uri: m.cover_url }} style={s.thumb} contentFit="cover" />
                ) : (
                  <View style={[s.thumb, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Leaf size={22} color={Bby.muted} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.rowTop}>
                    {[KIND_LABELS[m.kind] ?? m.kind, m.duration_min ? `${m.duration_min} min` : null].filter(Boolean).join(' · ')}
                  </Text>
                  <Text style={s.rowTitle} numberOfLines={2}>
                    {m.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </BbyScreen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Bby.card, borderRadius: 20, padding: 14 },
  thumb: { width: 52, height: 52, borderRadius: 14, backgroundColor: Bby.cardAlt, overflow: 'hidden' },
  rowTop: { fontFamily: BFont.sansMedium, fontSize: 12, color: Bby.muted },
  rowTitle: { fontFamily: BFont.sansSemibold, fontSize: 16, lineHeight: 21, color: Bby.text },
});
