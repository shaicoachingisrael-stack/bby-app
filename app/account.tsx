import { useRouter } from 'expo-router';
import { ChevronLeft, LogOut, Trash2 } from 'lucide-react-native';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionTitle } from '@/components/ui/section-title';
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { deleteAccount, signOut } from '@/lib/auth';
import { useAuth } from '@/lib/auth-provider';
import { useProfile } from '@/lib/use-profile';

const GOAL_LABELS: Record<string, string> = {
  perte_de_poids: 'Perte de poids',
  prise_de_masse: 'Prise de masse',
  tonification: 'Tonification',
  remise_en_forme: 'Remise en forme',
  bien_etre: 'Bien-être',
};

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const { profile, loading } = useProfile();

  function handleLogout() {
    Alert.alert('Se déconnecter ?', 'Tu pourras te reconnecter à tout moment.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (e: any) {
            Alert.alert('Erreur', e?.message ?? 'Déconnexion impossible.');
          }
        },
      },
    ]);
  }

  function handleDelete() {
    Alert.alert(
      'Supprimer ton compte ?',
      'Cette action est définitive. Tes séances, repas, journal et données de profil seront supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmer la suppression',
              'Es-tu absolument sûr·e ? Cette action ne peut pas être annulée.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Oui, supprimer définitivement',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                    } catch (e: any) {
                      Alert.alert(
                        'Erreur',
                        e?.message ?? 'Suppression impossible.',
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
          accessibilityLabel="Retour"
        >
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            Retour
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
            <Text style={[styles.avatarInitial, { color: palette.background, fontFamily: Fonts.displayBold }]}>
              {initial}
            </Text>
          </View>
          <Text style={[styles.name, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            {profile?.display_name || 'Sans nom'}
          </Text>
          {user?.email && (
            <Text style={[styles.email, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {user.email}
            </Text>
          )}
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionTitle title="Profil" />
          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            <Row
              label="Objectif"
              value={profile?.goal ? GOAL_LABELS[profile.goal] ?? profile.goal : '—'}
              palette={palette}
            />
            <Divider color={palette.border} />
            <Row
              label="Niveau"
              value={
                profile?.fitness_level
                  ? LEVEL_LABELS[profile.fitness_level] ?? profile.fitness_level
                  : '—'
              }
              palette={palette}
            />
            <Divider color={palette.border} />
            <Row
              label="Calories cible / jour"
              value={profile?.daily_kcal_target ? `${profile.daily_kcal_target} kcal` : '—'}
              palette={palette}
            />
            <Divider color={palette.border} />
            <Row
              label="Protéines cible / jour"
              value={profile?.protein_target_g ? `${profile.protein_target_g} g` : '—'}
              palette={palette}
            />
            <Divider color={palette.border} />
            <Row
              label="Hydratation cible / jour"
              value={profile?.hydration_target_ml ? `${profile.hydration_target_ml} ml` : '—'}
              palette={palette}
            />
          </View>
          <Text style={[styles.hint, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            L'édition de ces champs arrive bientôt.
          </Text>
        </View>

        <View style={{ marginTop: Spacing.xxl, gap: Spacing.md }}>
          <SectionTitle title="Compte" />
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
              Se déconnecter
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
              Supprimer mon compte
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
