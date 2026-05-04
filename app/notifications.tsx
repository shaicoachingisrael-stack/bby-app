import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, ChevronLeft, Trash2 } from 'lucide-react-native';
import { useCallback } from 'react';
import {
  ActivityIndicator,
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
import { type InboxItem, useInbox } from '@/lib/use-inbox';

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `il y a ${hr}h`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { items, loading, refresh, dismissAll, dismissOne } = useInbox();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  function handleClearAll() {
    if (items.length === 0) return;
    Alert.alert('Tout effacer ?', "Tes notifications passées disparaissent de la liste.", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: () => dismissAll() },
    ]);
  }

  function handleDeleteOne(item: InboxItem) {
    Alert.alert('Supprimer cette notification ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => dismissOne(item.id) },
    ]);
  }

  function handleTap(item: InboxItem) {
    const url = (item.data as any)?.url as string | undefined;
    const hasLink = !!url && url.startsWith('/');

    Alert.alert(
      item.title,
      `${item.body}\n\n${formatRelative(item.created_at)}`,
      hasLink
        ? [
            { text: 'Fermer', style: 'cancel' },
            { text: 'Voir', onPress: () => router.push(url as any) },
          ]
        : [{ text: 'OK' }],
    );
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
        {items.length > 0 && (
          <Pressable
            onPress={handleClearAll}
            hitSlop={12}
            style={({ pressed }) => [
              styles.clearBtn,
              { backgroundColor: palette.surface, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Trash2 size={14} color={palette.text} />
            <Text style={[styles.clearText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
              Tout effacer
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Notifications
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Tes notifications des dernières 24 h.
        </Text>

        {loading ? (
          <ActivityIndicator color={palette.text} style={{ marginTop: Spacing.xl }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: palette.surface }]}>
              <Bell size={28} color={palette.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: palette.text, fontFamily: Fonts.displayBold }]}>
              Tout est clair
            </Text>
            <Text style={[styles.emptyText, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              Pas de notification ces dernières 24 h.
            </Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
            {items.map((it) => (
              <View
                key={it.id}
                style={[styles.row, { backgroundColor: palette.surface }]}
              >
                <Pressable
                  onPress={() => handleTap(it)}
                  style={({ pressed }) => [
                    styles.rowMain,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: palette.text }]}>
                    <Bell size={16} color={palette.background} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}
                      numberOfLines={2}
                    >
                      {it.title}
                    </Text>
                    <Text
                      style={[styles.rowBody, { color: palette.text, fontFamily: Fonts.sans }]}
                      numberOfLines={3}
                    >
                      {it.body}
                    </Text>
                    <Text
                      style={[
                        styles.rowDate,
                        { color: palette.textSecondary, fontFamily: Fonts.sansMedium },
                      ]}
                    >
                      {formatRelative(it.created_at)}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteOne(it)}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.trashBtn,
                    { backgroundColor: palette.background, opacity: pressed ? 0.7 : 1 },
                  ]}
                  accessibilityLabel="Supprimer la notification"
                >
                  <Trash2 size={16} color={palette.textSecondary} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  clearText: { fontSize: 13 },
  title: { fontSize: 32, letterSpacing: -0.5, marginTop: Spacing.lg },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  empty: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 22, letterSpacing: -0.4 },
  emptyText: { fontSize: 14, textAlign: 'center', maxWidth: 280 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 15, marginBottom: 4 },
  rowBody: { fontSize: 14, lineHeight: 20 },
  rowDate: { fontSize: 12, marginTop: 6 },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
