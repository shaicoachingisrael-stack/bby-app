import { useRouter } from 'expo-router';
import { Check, ChevronLeft, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCoachingOffer } from '@/lib/use-coaching';
import type { CoachingPlan } from '@/lib/types';

export default function CoachingOfferScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { config, plans, interested, requestInterest } = useCoachingOffer();

  const perks = (config?.perks ?? '').split('\n').map((s) => s.trim()).filter(Boolean);

  async function choose(plan: CoachingPlan) {
    await requestInterest(t('coachingOffer.interestMessage', { months: plan.months, price: plan.price_text }));
    router.push('/coach-chat' as any);
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            {t('common.back')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: palette.text }]}>
          <Star size={28} color={palette.background} fill={palette.background} />
          <Text style={[styles.heroEyebrow, { color: palette.background, fontFamily: Fonts.sansMedium }]}>
            {t('coaching.eyebrow').toUpperCase()}
          </Text>
          <Text style={[styles.heroTitle, { color: palette.background, fontFamily: Fonts.displayBold }]}>
            {t('coachingOffer.title')}
          </Text>
        </View>

        {config?.pitch ? (
          <Text style={[styles.pitch, { color: palette.text, fontFamily: Fonts.sans }]}>{config.pitch}</Text>
        ) : null}

        {perks.length > 0 && (
          <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
            {perks.map((p) => (
              <View key={p} style={styles.perk}>
                <View style={[styles.perkDot, { backgroundColor: palette.surface }]}>
                  <Check size={14} color={palette.text} strokeWidth={2.4} />
                </View>
                <Text style={[styles.perkText, { color: palette.text, fontFamily: Fonts.sans }]}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        {interested ? (
          <View style={[styles.interestedCard, { backgroundColor: palette.surface }]}>
            <Text style={[styles.interestedTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {t('coachingOffer.interestedTitle')}
            </Text>
            <Text style={[styles.interestedSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {t('coachingOffer.interestedSub')}
            </Text>
            <Pressable onPress={() => router.push('/coach-chat' as any)} style={[styles.chatBtn, { backgroundColor: palette.text }]}>
              <Text style={{ color: palette.background, fontFamily: Fonts.sansSemibold, fontSize: 14 }}>
                {t('coaching.messageCoach')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
              {t('coachingOffer.plansTitle')}
            </Text>
            <View style={{ gap: Spacing.md }}>
              {plans.map((plan) => (
                <Pressable
                  key={plan.id}
                  onPress={() => choose(plan)}
                  style={({ pressed }) => [
                    styles.plan,
                    {
                      backgroundColor: plan.highlighted ? palette.text : palette.surface,
                      borderColor: plan.highlighted ? palette.text : palette.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planMonths, { color: plan.highlighted ? palette.background : palette.text, fontFamily: Fonts.sansSemibold }]}>
                      {t('coachingOffer.months', { count: plan.months })}
                    </Text>
                    {plan.subtitle ? (
                      <Text style={[styles.planSub, { color: plan.highlighted ? palette.background : palette.textSecondary, fontFamily: Fonts.sans }]}>
                        {plan.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.planPrice, { color: plan.highlighted ? palette.background : palette.text, fontFamily: Fonts.displayBold }]}>
                    {plan.price_text}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.disclaimer, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {t('coachingOffer.disclaimer')}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  hero: { borderRadius: Radius.lg, padding: Spacing.xl, marginTop: Spacing.sm, gap: Spacing.sm, alignItems: 'flex-start' },
  heroEyebrow: { fontSize: 10, letterSpacing: 1.6, opacity: 0.7, marginTop: Spacing.md },
  heroTitle: { fontSize: 28, letterSpacing: -0.5, lineHeight: 32 },
  pitch: { fontSize: 15.5, lineHeight: 23, marginTop: Spacing.lg },
  perk: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  perkDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  perkText: { fontSize: 15, flex: 1 },
  section: { fontSize: 22, letterSpacing: -0.4, marginTop: Spacing.xxl, marginBottom: Spacing.md },
  plan: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1, padding: Spacing.lg,
  },
  planMonths: { fontSize: 16 },
  planSub: { fontSize: 13, marginTop: 2 },
  planPrice: { fontSize: 20, letterSpacing: -0.4 },
  disclaimer: { fontSize: 12.5, lineHeight: 18, marginTop: Spacing.lg, textAlign: 'center' },
  interestedCard: { borderRadius: Radius.md, padding: Spacing.xl, marginTop: Spacing.xxl, gap: Spacing.sm, alignItems: 'center' },
  interestedTitle: { fontSize: 17, textAlign: 'center' },
  interestedSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  chatBtn: { borderRadius: Radius.pill, paddingVertical: 12, paddingHorizontal: Spacing.xl, marginTop: Spacing.md },
});
