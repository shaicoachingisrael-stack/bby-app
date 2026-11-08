import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { AdminHeader, a } from '@/components/bby/admin/ui';
import { BFont, BbyScreen, Bby, PillButton } from '@/components/bby/kit';
import { ritualIcon } from '@/lib/ritual-icons';
import { useRitualCatalog } from '@/lib/use-rituals';

// Catalogue des rituels proposés aux clientes (écran « Ajouter un rituel » de Mindset).
export default function RitualsAdminScreen() {
  const router = useRouter();
  const { items, loading, refresh } = useRitualCatalog();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <BbyScreen bottomSpace={40}>
      <View style={{ gap: 18 }}>
        <AdminHeader
          title="Rituels"
          intro="Les rituels que tes clientes peuvent ajouter en un geste, dans Mindset › Rituels › « Ajouter un rituel ». Elles peuvent aussi créer les leurs."
        />
        <PillButton label="Créer un rituel" icon={Plus} variant="yellow" onPress={() => router.push('/(admin)/rituals-edit' as any)} />

        {loading ? (
          <ActivityIndicator color={Bby.text} style={{ marginTop: 30 }} />
        ) : items.length === 0 ? (
          <Text style={a.hint}>Aucun rituel dans le catalogue.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {items.map((c) => {
              const Icon = ritualIcon(c.icon);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/(admin)/rituals-edit?id=${c.id}` as any)}
                  accessibilityRole="button"
                  style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}
                >
                  <View style={s.icon}>
                    <Icon size={20} color={Bby.text} strokeWidth={1.8} />
                  </View>
                  <Text style={s.rowTitle} numberOfLines={2}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </BbyScreen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Bby.card, borderRadius: 20, padding: 14 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Bby.cardAlt, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { flex: 1, fontFamily: BFont.sansSemibold, fontSize: 16, lineHeight: 21, color: Bby.text },
});
