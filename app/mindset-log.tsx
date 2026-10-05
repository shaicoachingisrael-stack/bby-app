import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Segmented } from '@/components/ui/segmented';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';

const KIND_VALUES = ['intention', 'journal', 'meditation_done'] as const;
const MOOD_VALUES = ['great', 'good', 'neutral', 'tired', 'low'] as const;

type Kind = (typeof KIND_VALUES)[number];
type Mood = (typeof MOOD_VALUES)[number];

export default function MindsetLogScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const params = useLocalSearchParams<{ kind?: string }>();

  const KIND_OPTIONS = [
    { value: 'intention' as const, label: t('mindsetLog.kindIntention') },
    { value: 'journal' as const, label: t('mindsetLog.kindJournal') },
    { value: 'meditation_done' as const, label: t('mindsetLog.kindMeditation') },
  ];

  const MOOD_OPTIONS = [
    { value: 'great' as const, label: t('mindsetLog.moodGreat') },
    { value: 'good' as const, label: t('mindsetLog.moodGood') },
    { value: 'neutral' as const, label: t('mindsetLog.moodNeutral') },
    { value: 'tired' as const, label: t('mindsetLog.moodTired') },
    { value: 'low' as const, label: t('mindsetLog.moodLow') },
  ];

  const PLACEHOLDERS: Record<Kind, string> = {
    intention: t('mindsetLog.placeholderIntention'),
    journal: t('mindsetLog.placeholderJournal'),
    meditation_done: t('mindsetLog.placeholderMeditation'),
  };

  const rawPrompts = t('mindsetLog.journalPrompts', { returnObjects: true });
  const journalPrompts = Array.isArray(rawPrompts) ? (rawPrompts as string[]) : [];

  const [kind, setKind] = useState<Kind>(
    KIND_VALUES.some((k) => k === params.kind)
      ? (params.kind as Kind)
      : 'intention',
  );
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user) return;
    if (!body.trim()) {
      Alert.alert(t('mindsetLog.emptyTitle'), t('mindsetLog.emptyBody'));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('mindset_entries').insert({
        user_id: user.id,
        kind,
        body: body.trim(),
        mood,
      });
      if (error) throw error;
      router.back();
    } catch (e: any) {
      Alert.alert(t('common.saveImpossible'), e?.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            {t('common.back')}
          </Text>
        </Pressable>
        <Pressable onPress={save} disabled={saving} hitSlop={12}>
          {saving ? (
            <ActivityIndicator color={palette.text} />
          ) : (
            <Text style={[styles.action, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {t('common.save')}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
          gap: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {t('mindsetLog.title')}
        </Text>

        <View style={{ gap: Spacing.sm }}>
          <Label palette={palette}>{t('mindsetLog.type')}</Label>
          <Segmented value={kind} options={KIND_OPTIONS as any} onChange={(v: Kind) => setKind(v)} />
        </View>

        <View style={{ gap: Spacing.sm }}>
          <Label palette={palette}>{t('mindsetLog.mood')}</Label>
          <Segmented
            value={mood}
            options={MOOD_OPTIONS as any}
            onChange={(v: Mood) => setMood(v)}
          />
        </View>

        {/* Prompts suggérés (journal) */}
        {kind === 'journal' && body.trim().length === 0 && journalPrompts.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            <Label palette={palette}>{t('mindsetLog.promptsLabel')}</Label>
            <View style={{ gap: Spacing.sm }}>
              {journalPrompts.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setBody(p + '\n\n')}
                  style={({ pressed }) => [
                    styles.prompt,
                    { backgroundColor: palette.surface, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={[styles.promptText, { color: palette.text, fontFamily: Fonts.sans }]}>
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={{ gap: Spacing.sm }}>
          <Label palette={palette}>{t('mindsetLog.content')}</Label>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={PLACEHOLDERS[kind]}
            placeholderTextColor={palette.textSecondary}
            multiline
            maxLength={kind === 'intention' ? 100 : undefined}
            textAlignVertical="top"
            style={[
              styles.textarea,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                color: palette.text,
                fontFamily: Fonts.sans,
              },
            ]}
          />
          {kind === 'intention' && (
            <Text style={[styles.counter, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {body.length}/100
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => router.push(`/mindset/entries?kind=${kind}` as any)}
          style={styles.historyLink}
        >
          <Text style={[styles.historyText, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
            {t('mindsetLog.viewHistory')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Label({ children, palette }: any) {
  return (
    <Text
      style={{
        color: palette.textSecondary,
        fontFamily: Fonts.sansMedium,
        fontSize: 11,
        letterSpacing: 1.4,
      }}
    >
      {children.toString().toUpperCase()}
    </Text>
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
  action: { fontSize: 15 },
  title: {
    fontSize: 30,
    letterSpacing: -0.5,
    marginTop: Spacing.lg,
  },
  textarea: {
    minHeight: 220,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    fontSize: 16,
    lineHeight: 22,
  },
  prompt: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  promptText: { fontSize: 15, lineHeight: 21 },
  counter: { fontSize: 12, textAlign: 'right' },
  historyLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  historyText: { fontSize: 14 },
});
