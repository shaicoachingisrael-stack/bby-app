import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Clock } from 'lucide-react-native';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttachmentCarousel } from '@/components/ui/attachment-carousel';
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAttachments } from '@/lib/use-attachments';
import { useMindsetItem } from '@/lib/use-content';

const KIND_LABELS: Record<string, string> = {
  meditation: 'Méditation',
  article: 'Article',
  affirmation: 'Affirmation',
};

export default function MindsetDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;

  const { item, loading } = useMindsetItem(id);
  const { items: attachments, refresh: refreshAttachments } = useAttachments(
    'mindset',
    id,
  );

  useFocusEffect(useCallback(() => { refreshAttachments(); }, [refreshAttachments]));

  if (loading && !item) {
    return (
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[{ color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Contenu introuvable.
        </Text>
      </View>
    );
  }

  const kind = item.kind === 'meditation' ? 'meditation_done' : item.kind;

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={styles.hero}>
        {item.cover_url ? (
          <Image
            source={{ uri: item.cover_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Palette.gray[300] }]} />
        )}
        <View style={styles.heroOverlay} />
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: Palette.albatre, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ChevronLeft size={20} color={Palette.encre} />
          </Pressable>
        </View>
        <View style={styles.heroTitleBlock}>
          <Text style={styles.heroEyebrow}>{(KIND_LABELS[item.kind] ?? item.kind).toUpperCase()}</Text>
          <Text style={styles.heroTitle}>{item.title}</Text>
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: palette.background }]}>
        <View style={[styles.handle, { backgroundColor: palette.border }]} />

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg }}>
            {item.duration_min ? (
              <View style={[styles.metaCard, { backgroundColor: palette.surface }]}>
                <Clock size={18} color={palette.text} />
                <Text style={[styles.metaValue, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                  {item.duration_min} min
                </Text>
              </View>
            ) : null}

            {item.body ? (
              <Text style={[styles.body, { color: palette.text, fontFamily: Fonts.sans }]}>
                {item.body}
              </Text>
            ) : null}
          </View>

          <AttachmentCarousel attachments={attachments} />
        </ScrollView>

        <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: palette.background }]}>
          <Pressable
            onPress={() => router.push(`/mindset-log?kind=${kind}` as any)}
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: palette.text, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.ctaText, { color: palette.background, fontFamily: Fonts.sansSemibold }]}>
              {item.kind === 'meditation' ? 'J\'ai terminé' : 'Noter dans mon journal'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { height: 380, overflow: 'hidden', backgroundColor: Palette.gray[200] },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.32)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitleBlock: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    bottom: Spacing.xxl,
  },
  heroEyebrow: {
    color: Palette.albatre, fontSize: 11, letterSpacing: 1.6,
    fontWeight: '600', marginBottom: 8, opacity: 0.9,
  },
  heroTitle: {
    color: Palette.albatre, fontSize: 32,
    fontWeight: '700', letterSpacing: -0.5, lineHeight: 36,
  },
  sheet: {
    flex: 1, marginTop: -32,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 44, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 10, marginBottom: Spacing.sm,
  },
  metaCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, borderRadius: Radius.md,
    alignSelf: 'flex-start', marginTop: Spacing.md,
  },
  metaValue: { fontSize: 14 },
  body: {
    fontSize: 15, lineHeight: 24, marginTop: Spacing.lg,
  },
  cta: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md,
  },
  ctaButton: {
    height: 56, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { fontSize: 16 },
});
