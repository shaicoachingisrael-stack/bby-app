// Espace admin de Shaï, dans la charte de la refonte (noir, blanc, jaune).
// Pensé pour être rempli sans aide : chaque champ dit où il apparaît dans l'app.
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRouter } from 'expo-router';
import { ReactNode, useEffect, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { BFont, Bby, RoundButton } from '@/components/bby/kit';

/** Prévient avant de quitter une page modifiée sans l'avoir enregistrée (bouton retour ou geste). */
export function useLeaveGuard(isDirty: () => boolean) {
  const navigation = useNavigation();
  const check = useRef(isDirty);
  check.current = isDirty;
  // Le geste « glisser depuis le bord » d'iOS ne peut pas être retenu une fois lancé :
  // on le coupe tant qu'il y a des modifications ; le bouton retour affiche alors l'avertissement.
  const dirtyNow = isDirty();
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !dirtyNow });
    // Sans ça, le geste coupé ici passe au niveau au-dessus et ferme tout l'espace admin.
    const parent = navigation.getParent();
    parent?.setOptions({ gestureEnabled: !dirtyNow });
    return () => parent?.setOptions({ gestureEnabled: true });
  }, [navigation, dirtyNow]);
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e: any) => {
        if (!check.current()) return;
        e.preventDefault();
        Alert.alert('Quitter sans enregistrer ?', 'Tes modifications seront perdues.', [
          { text: 'Rester', style: 'cancel' },
          { text: 'Quitter', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]);
      }),
    [navigation],
  );
}

/** Retour + titre de l'écran + phrase d'explication. */
export function AdminHeader({ title, intro, right }: { title: string; intro?: string; right?: ReactNode }) {
  const router = useRouter();
  return (
    <View style={{ gap: 10 }}>
      <View style={a.rowBetween}>
        <RoundButton icon={ArrowLeft} variant="outline" size={44} onPress={() => router.back()} label="Retour" />
        {right}
      </View>
      <Text style={a.title}>{title}</Text>
      {intro ? <Text style={a.intro}>{intro}</Text> : null}
    </View>
  );
}

/** Un champ : titre, aide (« où ça apparaît »), puis la saisie. */
export function AdminField({ label, hint, children, counter }: { label: string; hint?: string; children: ReactNode; counter?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={a.rowBetween}>
        <Text style={a.label}>{label}</Text>
        {counter ? <Text style={a.counter}>{counter}</Text> : null}
      </View>
      {hint ? <Text style={a.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

/** Zone de saisie ; `big` pour les textes longs (idée du jour, « Pour toi si »). */
export function AdminInput({ big, style, ...props }: TextInputProps & { big?: boolean }) {
  return (
    <TextInput
      placeholderTextColor="#6E6E6A"
      selectionColor={Bby.yellow}
      multiline={big || props.multiline}
      {...props}
      style={[a.input, (big || props.multiline) && a.inputBig, big && { minHeight: 160 }, style]}
    />
  );
}

/** Puces de choix (une seule active). */
export function AdminChoice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T | null;
  onChange: (k: T) => void;
}) {
  return (
    <View style={a.chips}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[a.chip, on && a.chipOn]}
          >
            <Text style={[a.chipText, on && { color: Bby.ink }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Ligne de liste cliquable (un jour, une affirmation…). */
export function AdminRow({
  top,
  title,
  sub,
  onPress,
  highlight,
  empty,
}: {
  top?: string;
  title: string;
  sub?: string;
  onPress: () => void;
  highlight?: boolean;
  empty?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [a.row, highlight && a.rowOn, empty && a.rowEmpty, pressed && { opacity: 0.8 }]}
    >
      {top ? <Text style={[a.rowTop, highlight && { color: Bby.mutedOnLight }]}>{top}</Text> : null}
      <Text style={[a.rowTitle, highlight && { color: Bby.ink }, empty && { color: Bby.muted }]} numberOfLines={3}>
        {title}
      </Text>
      {sub ? (
        <Text style={[a.rowSub, highlight && { color: Bby.mutedOnLight }]} numberOfLines={2}>
          {sub}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** Petit lien texte (supprimer, etc.). */
export function AdminLink({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={{ alignSelf: 'center', paddingVertical: 10 }}>
      <Text style={[a.link, danger && { color: '#E07A6E' }]}>{label}</Text>
    </Pressable>
  );
}

export const a = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontFamily: BFont.display, fontSize: 30, lineHeight: 35, color: Bby.text, letterSpacing: -0.5, marginTop: 6 },
  intro: { fontFamily: BFont.sans, fontSize: 15, lineHeight: 21, color: Bby.muted },
  label: { fontFamily: BFont.sansBold, fontSize: 15, color: Bby.text },
  counter: { fontFamily: BFont.sans, fontSize: 12, color: Bby.muted },
  hint: { fontFamily: BFont.sans, fontSize: 13, lineHeight: 18, color: Bby.muted },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Bby.line,
    backgroundColor: Bby.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: BFont.sans,
    fontSize: 16,
    color: Bby.text,
  },
  inputBig: { minHeight: 96, lineHeight: 22, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: Bby.line, borderRadius: 999, paddingHorizontal: 14, height: 40, justifyContent: 'center' },
  chipOn: { backgroundColor: Bby.yellow, borderColor: 'transparent' },
  chipText: { fontFamily: BFont.sansSemibold, fontSize: 14, color: Bby.text },
  row: { backgroundColor: Bby.card, borderRadius: 20, padding: 16, gap: 4 },
  rowOn: { backgroundColor: Bby.light },
  rowEmpty: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Bby.line, borderStyle: 'dashed' },
  rowTop: { fontFamily: BFont.sansMedium, fontSize: 12, color: Bby.muted },
  rowTitle: { fontFamily: BFont.sansSemibold, fontSize: 16, lineHeight: 21, color: Bby.text },
  rowSub: { fontFamily: BFont.sans, fontSize: 13, lineHeight: 18, color: Bby.muted },
  link: { fontFamily: BFont.sansMedium, fontSize: 14, color: Bby.muted, textDecorationLine: 'underline' },
});
