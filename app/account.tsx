import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { CheckCircle2, ChevronLeft, Circle, Dumbbell, FileText, LogOut, Pencil, Settings, Shield, Trash2 } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LEGAL_URLS } from '@/lib/legal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionTitle } from '@/components/ui/section-title';
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { deleteAccount, signOut } from '@/lib/auth';
import { setAppearance, useAppearance } from '@/lib/appearance';
import { useAuth } from '@/lib/auth-provider';
import { useProfile } from '@/lib/use-profile';

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile, loading, refresh, update } = useProfile();
  const tracking = profile?.nutrition_tracking === true;
  const appearance = useAppearance();

  const GOAL_LABELS: Record<string, string> = {
    perte_de_poids: t('onboarding.goal.perte_de_poids'),
    prise_de_masse: t('onboarding.goal.prise_de_masse'),
    tonification: t('onboarding.goal.tonification'),
    remise_en_forme: t('onboarding.goal.remise_en_forme'),
    bien_etre: t('onboarding.goal.bien_etre'),
  };

  const LEVEL_LABELS: Record<string, string> = {
    debutant: t('onboarding.level.debutant'),
    intermediaire: t('onboarding.level.intermediaire'),
    avance: t('onboarding.level.avance'),
  };

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function setTracking(next: boolean) {
    if (next === tracking) return;
    try {
      await update({ nutrition_tracking: next });
    } catch (e: any) {
      Alert.alert(t('common.saveImpossible'), e?.message ?? t('common.error'));
    }
  }

  function handleLogout() {
    Alert.alert(t('account.logoutConfirmTitle'), t('account.logoutConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('account.logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (e: any) {
            Alert.alert(t('common.error'), e?.message ?? t('common.error'));
          }
        },
      },
    ]);
  }

  function handleDelete() {
    Alert.alert(
      t('account.deleteConfirm1Title'),
      t('account.deleteConfirm1Body'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('account.deleteConfirm2Title'),
              t('account.deleteConfirm2Body'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('account.deleteFinal'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                    } catch (e: any) {
                      Alert.alert(
                        t('common.error'),
                        e?.message ?? t('common.error'),
                      );
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  const name = profile?.display_name?.trim() || user?.email || '';
  const initial = name ? name[0].toUpperCase() : '?';

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            {t('common.back')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <View style={[styles.avatar, { backgroundColor: palette.text }]}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
              />
            ) : (
              <Text style={[styles.avatarInitial, { color: palette.background, fontFamily: Fonts.displayBold }]}>
                {initial}
              </Text>
            )}
          </View>
          <Text style={[styles.name, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            {profile?.display_name || t('account.withoutName')}
          </Text>
          {user?.email && (
            <Text style={[styles.email, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {user.email}
            </Text>
          )}
          <Pressable
            onPress={() => router.push('/edit-profile' as any)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.editButton,
              {
                borderColor: palette.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Pencil size={14} color={palette.text} />
            <Text style={[styles.editText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {t('account.editProfile')}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionTitle title={t('account.profile.title')} />
          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            <Row
              label={t('account.profile.goal')}
              value={profile?.goal ? GOAL_LABELS[profile.goal] ?? profile.goal : '—'}
              palette={palette}
            />
            <Divider color={palette.border} />
            <Row
              label={t('account.profile.level')}
              value={
                profile?.fitness_level
                  ? LEVEL_LABELS[profile.fitness_level] ?? profile.fitness_level
                  : '—'
              }
              palette={palette}
            />
            <Divider color={palette.border} />
            <Row
              label={t('account.profile.proteinTarget')}
              value={profile?.protein_target_g ? `${profile.protein_target_g} g` : '—'}
              palette={palette}
            />
            <Divider color={palette.border} />
            <Row
              label={t('account.profile.kcalTarget')}
              value={profile?.daily_kcal_target ? `${profile.daily_kcal_target} kcal` : '—'}
              palette={palette}
            />
            <Divider color={palette.border} />
            <Row
              label={t('account.profile.hydrationTarget')}
              value={profile?.hydration_target_ml ? `${profile.hydration_target_ml} ml` : '—'}
              palette={palette}
            />
          </View>
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionTitle title={t('nutrition.tracking.title')} />
          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            <TrackingOption
              selected={!tracking}
              title={t('nutrition.tracking.off')}
              hint={t('nutrition.tracking.offHint')}
              onPress={() => setTracking(false)}
              palette={palette}
            />
            <Divider color={palette.border} />
            <TrackingOption
              selected={tracking}
              title={t('nutrition.tracking.on')}
              hint={t('nutrition.tracking.onHint')}
              onPress={() => setTracking(true)}
              palette={palette}
            />
          </View>
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionTitle title={t('account.appearance.title')} />
          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            <TrackingOption
              selected={appearance === 'ember'}
              title={t('account.appearance.ember')}
              hint={t('account.appearance.emberHint')}
              onPress={() => setAppearance('ember')}
              palette={palette}
            />
            <Divider color={palette.border} />
            <TrackingOption
              selected={appearance === 'encre'}
              title={t('account.appearance.encre')}
              hint={t('account.appearance.encreHint')}
              onPress={() => setAppearance('encre')}
              palette={palette}
            />
          </View>
        </View>

        <View style={{ marginTop: Spacing.xxl, gap: Spacing.md }}>
          <SectionTitle title={t('account.myPath')} />
          <Pressable
            onPress={() => router.push('/training' as any)}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Dumbbell size={18} color={palette.text} />
            <Text style={[styles.actionText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {t('account.myPrograms')}
            </Text>
          </Pressable>
        </View>

        {profile?.is_admin && (
          <View style={{ marginTop: Spacing.xxl, gap: Spacing.md }}>
            <SectionTitle title={t('account.coach')} />
            <Pressable
              onPress={() => router.push('/(admin)' as any)}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Settings size={18} color={palette.text} />
              <Text style={[styles.actionText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                {t('account.adminPanel')}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={{ marginTop: Spacing.xxl, gap: Spacing.md }}>
          <SectionTitle title={t('account.accountSection')} />
          <Pressable
            onPress={handleLogout}
            disabled={loading}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <LogOut size={18} color={palette.text} />
            <Text style={[styles.actionText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {t('account.logout')}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            disabled={loading}
            style={({ pressed }) => [
              styles.actionButton,
              styles.dangerButton,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Trash2 size={18} color={Palette.albatre} />
            <Text style={[styles.actionText, { color: Palette.albatre, fontFamily: Fonts.sansSemibold }]}>
              {t('account.deleteAccount')}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: Spacing.xxl, gap: Spacing.md }}>
          <SectionTitle title={t('account.legalSection')} />
          <Pressable
            onPress={() => Linking.openURL(LEGAL_URLS.privacy)}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Shield size={18} color={palette.text} />
            <Text style={[styles.actionText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {t('account.privacyPolicy')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL(LEGAL_URLS.terms)}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <FileText size={18} color={palette.text} />
            <Text style={[styles.actionText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {t('account.terms')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: ReturnType<typeof Object>;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
        {value}
      </Text>
    </View>
  );
}

function TrackingOption({
  selected,
  title,
  hint,
  onPress,
  palette,
}: {
  selected: boolean;
  title: string;
  hint: string;
  onPress: () => void;
  palette: any;
}) {
  const Icon = selected ? CheckCircle2 : Circle;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.option, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Icon size={20} color={selected ? palette.done : palette.textSecondary} strokeWidth={1.8} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
          {title}
        </Text>
        <Text style={[styles.optionHint, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {hint}
        </Text>
      </View>
    </Pressable>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  headerBlock: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarInitial: { fontSize: 36, letterSpacing: -0.5 },
  name: {
    fontSize: 26,
    letterSpacing: -0.4,
  },
  email: { fontSize: 14 },
  editButton: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  editText: { fontSize: 13 },
  card: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, maxWidth: '60%', textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth },
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  optionTitle: { fontSize: 14 },
  optionHint: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  hint: {
    fontSize: 12,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  actionButton: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: '#A8362A',
  },
  actionText: { fontSize: 15 },
});
