import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentFill } from '@/components/ui/accent-fill';
import { IconBadge, TileText } from '@/components/ui/tiles';
import { Fonts } from '@/constants/theme';
import { LEGAL_URLS } from '@/lib/legal';

const STORAGE_KEY = 'bby.aiConsent';

// Accord de la cliente avant tout envoi au service d'IA (règle Apple 5.1.2(i)) :
// `null` tant qu'on lit le téléphone, puis `true` / `false`.
export function useAiConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => setConsent(v === '1'))
      .catch(() => setConsent(false));
  }, []);
  const accept = useCallback(async () => {
    setConsent(true);
    await AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {});
  }, []);
  return { consent, accept };
}

export function AiConsent({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.flex, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <IconBadge icon={Sparkles} color="violet" size={56} />
        <Text style={[styles.title, { fontFamily: Fonts.displayBold }]}>{t('aiConsent.title')}</Text>
        <Text style={styles.body}>{t('aiConsent.body')}</Text>
        <View style={styles.list}>
          {(['point1', 'point2', 'point3'] as const).map((k) => (
            <View key={k} style={styles.point}>
              <View style={styles.dot} />
              <Text style={styles.pointText}>{t(`aiConsent.${k}`)}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.privacy)} hitSlop={8}>
          <Text style={styles.link}>{t('aiConsent.privacy')}</Text>
        </Pressable>
      </ScrollView>
      <View style={styles.actions}>
        <Pressable onPress={onAccept} style={({ pressed }) => [styles.accept, pressed && { opacity: 0.9 }]}>
          <AccentFill />
          <Text style={styles.acceptText}>{t('aiConsent.accept')}</Text>
        </Pressable>
        <Pressable onPress={onDecline} style={styles.decline} hitSlop={8}>
          <Text style={styles.declineText}>{t('aiConsent.decline')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0B0710', paddingHorizontal: 24 },
  scroll: { flex: 1 },
  content: { paddingTop: 24, paddingBottom: 16, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, lineHeight: 32, color: TileText.primary, marginTop: 8 },
  body: { fontSize: 15, lineHeight: 22, color: TileText.secondary, fontFamily: Fonts.sans },
  list: { gap: 10 },
  point: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C9B3FF', marginTop: 8 },
  pointText: { flex: 1, fontSize: 14, lineHeight: 20, color: TileText.primary, fontFamily: Fonts.sans },
  link: { fontSize: 14, color: '#C9B3FF', fontFamily: Fonts.sansSemibold, textDecorationLine: 'underline' },
  actions: { gap: 6, maxWidth: 560, width: '100%', alignSelf: 'center' },
  accept: { height: 56, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  acceptText: { fontSize: 16, color: '#22070F', fontFamily: Fonts.sansBold },
  decline: { height: 48, alignItems: 'center', justifyContent: 'center' },
  declineText: { fontSize: 15, color: TileText.muted, fontFamily: Fonts.sansSemibold },
});
