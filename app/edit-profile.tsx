import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Camera, ChevronLeft, ImagePlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
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
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { pickAvatarFromLibrary, takeAvatarPhoto, uploadAvatar } from '@/lib/avatar';
import { useAuth } from '@/lib/auth-provider';
import { useProfile } from '@/lib/use-profile';

const GOAL_OPTIONS = [
  { value: 'perte_de_poids', label: 'Perte de poids' },
  { value: 'prise_de_masse', label: 'Prise de masse' },
  { value: 'tonification', label: 'Tonification' },
  { value: 'remise_en_forme', label: 'Remise en forme' },
  { value: 'bien_etre', label: 'Bien-être' },
] as const;

const LEVEL_OPTIONS = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
] as const;

type Goal = (typeof GOAL_OPTIONS)[number]['value'];
type Level = (typeof LEVEL_OPTIONS)[number]['value'];

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const { profile, update } = useProfile();

  const [displayName, setDisplayName] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [hydration, setHydration] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? '');
    setGoal((profile.goal as Goal) ?? null);
    setLevel((profile.fitness_level as Level) ?? null);
    setKcal(profile.daily_kcal_target?.toString() ?? '');
    setProtein(profile.protein_target_g?.toString() ?? '');
    setHydration(profile.hydration_target_ml?.toString() ?? '');
    setAvatarUrl(profile.avatar_url ?? null);
  }, [profile]);

  async function handlePickAvatar() {
    if (!user) return;
    const choose = (action: 'library' | 'camera') => {
      void runPick(action);
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annuler', 'Prendre une photo', 'Choisir depuis la photothèque'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) choose('camera');
          if (idx === 2) choose('library');
        },
      );
    } else {
      Alert.alert('Photo de profil', undefined, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Prendre une photo', onPress: () => choose('camera') },
        { text: 'Photothèque', onPress: () => choose('library') },
      ]);
    }
  }

  async function runPick(action: 'library' | 'camera') {
    if (!user) return;
    try {
      const picked = action === 'camera' ? await takeAvatarPhoto() : await pickAvatarFromLibrary();
      if (!picked) return;
      setUploadingAvatar(true);
      const url = await uploadAvatar(user.id, picked);
      await update({ avatar_url: url });
      setAvatarUrl(url);
    } catch (e: any) {
      Alert.alert('Photo impossible', e?.message ?? 'Erreur.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const parseInt = (s: string) => {
        const n = Number.parseInt(s.replace(/\D/g, ''), 10);
        return Number.isFinite(n) && n > 0 ? n : null;
      };
      await update({
        display_name: displayName.trim() || null,
        goal,
        fitness_level: level,
        daily_kcal_target: parseInt(kcal),
        protein_target_g: parseInt(protein),
        hydration_target_ml: parseInt(hydration),
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Sauvegarde impossible', e?.message ?? 'Erreur.');
    } finally {
      setSaving(false);
    }
  }

  const initial = (displayName.trim() || user?.email || '?')[0].toUpperCase();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
        >
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            Retour
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={saving || uploadingAvatar}
          hitSlop={12}
          style={({ pressed }) => [{ opacity: pressed || saving ? 0.6 : 1 }]}
        >
          {saving ? (
            <ActivityIndicator color={palette.text} />
          ) : (
            <Text style={[styles.save, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              Enregistrer
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
          gap: Spacing.xxl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Modifier le profil
        </Text>

        <View style={styles.avatarBlock}>
          <Pressable onPress={handlePickAvatar} hitSlop={8}>
            <View style={[styles.avatar, { backgroundColor: palette.text }]}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                />
              ) : (
                <Text style={[styles.avatarInitial, { color: palette.background, fontFamily: Fonts.displayBold }]}>
                  {initial}
                </Text>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color={Palette.albatre} />
                </View>
              )}
              <View style={[styles.avatarBadge, { backgroundColor: palette.background, borderColor: palette.border }]}>
                <Camera size={14} color={palette.text} />
              </View>
            </View>
          </Pressable>
          <Pressable onPress={handlePickAvatar} disabled={uploadingAvatar} hitSlop={8}>
            <Text style={[styles.changePhoto, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </Text>
          </Pressable>
        </View>

        <Field label="Nom" palette={palette}>
          <TextInput
            placeholder="Ton prénom ou pseudo"
            placeholderTextColor={palette.textSecondary}
            value={displayName}
            onChangeText={setDisplayName}
            style={[
              styles.input,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                color: palette.text,
                fontFamily: Fonts.sans,
              },
            ]}
            editable={!saving}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </Field>

        <Field label="Objectif" palette={palette}>
          <View style={{ gap: Spacing.sm }}>
            <Segmented
              value={goal}
              options={GOAL_OPTIONS.slice(0, 3) as any}
              onChange={(v: Goal) => setGoal(v)}
              disabled={saving}
            />
            <Segmented
              value={goal}
              options={GOAL_OPTIONS.slice(3) as any}
              onChange={(v: Goal) => setGoal(v)}
              disabled={saving}
            />
          </View>
        </Field>

        <Field label="Niveau" palette={palette}>
          <Segmented
            value={level}
            options={LEVEL_OPTIONS as any}
            onChange={(v: Level) => setLevel(v)}
            disabled={saving}
          />
        </Field>

        <Field label="Calories cible / jour" palette={palette} hint="Ex : 1980">
          <TextInput
            placeholder="kcal"
            placeholderTextColor={palette.textSecondary}
            value={kcal}
            onChangeText={setKcal}
            keyboardType="number-pad"
            style={[
              styles.input,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                color: palette.text,
                fontFamily: Fonts.sans,
              },
            ]}
            editable={!saving}
          />
        </Field>

        <Field label="Protéines cible / jour" palette={palette} hint="Ex : 120 g">
          <TextInput
            placeholder="grammes"
            placeholderTextColor={palette.textSecondary}
            value={protein}
            onChangeText={setProtein}
            keyboardType="number-pad"
            style={[
              styles.input,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                color: palette.text,
                fontFamily: Fonts.sans,
              },
            ]}
            editable={!saving}
          />
        </Field>

        <Field label="Hydratation cible / jour" palette={palette} hint="Ex : 2500 ml">
          <TextInput
            placeholder="ml"
            placeholderTextColor={palette.textSecondary}
            value={hydration}
            onChangeText={setHydration}
            keyboardType="number-pad"
            style={[
              styles.input,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                color: palette.text,
                fontFamily: Fonts.sans,
              },
            ]}
            editable={!saving}
          />
        </Field>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  hint,
  children,
  palette,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  palette: ReturnType<typeof Object>;
}) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={[styles.fieldLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
        {label.toUpperCase()}
      </Text>
      {children}
      {hint && (
        <Text style={[styles.hint, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {hint}
        </Text>
      )}
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
  save: { fontSize: 15 },
  title: {
    fontSize: 30,
    letterSpacing: -0.5,
    marginTop: Spacing.lg,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: { fontSize: 44, letterSpacing: -0.5 },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  changePhoto: { fontSize: 14 },
  fieldLabel: { fontSize: 11, letterSpacing: 1.4 },
  input: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  hint: { fontSize: 12 },
});
