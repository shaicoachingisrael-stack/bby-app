import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNutritionTargets } from '@/lib/use-nutrition-targets';
import { useProfile } from '@/lib/use-profile';

export default function MacrosHelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { profile } = useProfile();
  const { targets } = useNutritionTargets();

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
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
          gap: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Comprendre mon calcul
        </Text>
        <Text style={[styles.body, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Tes apports ne sortent pas d'un chapeau : ils sont calculés à partir de
          formules nutritionnelles standards et adaptés à toi.
        </Text>

        <Section title="1 — Métabolisme de base (BMR)" palette={palette}>
          La quantité d'énergie que ton corps brûle au repos sur 24 h, calculée
          selon la formule de Mifflin-St Jeor à partir de ton sexe, ton âge, ta
          taille et ton poids.
        </Section>
        {targets?.bmr && (
          <Stat label="Ton BMR" value={`${targets.bmr} kcal / jour`} palette={palette} />
        )}

        <Section title="2 — Dépense énergétique totale (TDEE)" palette={palette}>
          Ton BMR multiplié par un facteur d'activité (sédentaire, léger, modéré,
          actif, très actif). C'est l'énergie que tu dépenses vraiment chaque jour.
        </Section>
        {targets?.tdee && (
          <Stat label="Ton TDEE" value={`${targets.tdee} kcal / jour`} palette={palette} />
        )}

        <Section title="3 — Calories cibles" palette={palette}>
          On ajuste ton TDEE selon ton objectif et son intensité (douce, modérée,
          soutenue). On garde toujours un plancher santé pour que tu ne descendes
          jamais trop bas.
        </Section>
        {targets?.calories && (
          <Stat
            label="Ta cible"
            value={`${targets.calories} kcal / jour`}
            palette={palette}
          />
        )}

        <Section title="4 — Répartition des macros" palette={palette}>
          Les protéines sont calculées d'abord en grammes par kilo (protéine
          prioritaire), puis les lipides en pourcentage des calories (avec un
          plancher hormonal), et les glucides remplissent le reste.
        </Section>

        <Section title="5 — Hydratation" palette={palette}>
          35 ml d'eau par kilo de poids corporel, et +500 ml les jours
          d'entraînement.
        </Section>

        <View style={[styles.disclaimer, { backgroundColor: palette.surface }]}>
          <Text style={[styles.disclaimerText, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            Ces recommandations sont indicatives et calculées à partir de formules
            standards. Elles ne remplacent pas l'avis d'un·e professionnel·le de
            santé. Si tu suis un traitement médical, es enceinte, allaitante, ou
            as un historique de troubles alimentaires, consulte avant d'ajuster
            ton alimentation.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
  palette,
}: {
  title: string;
  children: React.ReactNode;
  palette: any;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.sectionTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
        {title}
      </Text>
      <Text style={[styles.body, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
        {children}
      </Text>
    </View>
  );
}

function Stat({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: any;
}) {
  return (
    <View style={[styles.statRow, { backgroundColor: palette.surface }]}>
      <Text style={[styles.statLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
        {label.toUpperCase()}
      </Text>
      <Text style={[styles.statValue, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  title: { fontSize: 30, letterSpacing: -0.5, marginTop: Spacing.lg },
  body: { fontSize: 14, lineHeight: 22 },
  sectionTitle: { fontSize: 16, marginTop: Spacing.sm },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  statLabel: { fontSize: 11, letterSpacing: 1.4 },
  statValue: { fontSize: 14 },
  disclaimer: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  disclaimerText: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
});
