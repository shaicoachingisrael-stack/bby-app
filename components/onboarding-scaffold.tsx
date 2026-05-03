import { ChevronLeft } from 'lucide-react-native';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  onCta: () => void;
  onBack?: () => void;
  children: ReactNode;
};

export function OnboardingScaffold({
  step,
  total,
  title,
  subtitle,
  ctaLabel = 'Continuer',
  ctaDisabled,
  ctaLoading,
  onCta,
  onBack,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={onBack}
          disabled={!onBack}
          hitSlop={12}
          style={[styles.backBtn, { opacity: onBack ? 1 : 0 }]}
        >
          <ChevronLeft size={24} color={palette.text} />
        </Pressable>

        <View style={styles.dots}>
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i < step ? palette.text : palette.border,
                  width: i === step - 1 ? 24 : 16,
                },
              ]}
            />
          ))}
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}
          >
            {subtitle}
          </Text>
        )}
        <View style={{ marginTop: Spacing.xl }}>{children}</View>
      </ScrollView>

      <View
        style={[
          styles.ctaWrap,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: palette.background,
          },
        ]}
      >
        <Pressable
          onPress={onCta}
          disabled={ctaDisabled || ctaLoading}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: palette.text,
              opacity: ctaDisabled ? 0.4 : pressed || ctaLoading ? 0.85 : 1,
            },
          ]}
        >
          {ctaLoading ? (
            <ActivityIndicator color={palette.background} />
          ) : (
            <Text
              style={[
                styles.ctaText,
                { color: palette.background, fontFamily: Fonts.sansSemibold },
              ]}
            >
              {ctaLabel}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 4, borderRadius: 2 },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  title: { fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: Spacing.sm },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  cta: {
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16 },
});
