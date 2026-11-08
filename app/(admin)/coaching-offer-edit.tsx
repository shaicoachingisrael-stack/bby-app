import { Check, Plus, Star, Trash2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { AdminField, AdminHeader, AdminInput, a, useLeaveGuard } from '@/components/bby/admin/ui';
import { ActionBar, BFont, Bby, PillButton } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { useCoachingOfferAdmin } from '@/lib/use-coaching-admin';

export default function CoachingOfferEditScreen() {
  const { config, plans, loading, saveConfig, addPlan, removePlan } = useCoachingOfferAdmin();

  const [pitch, setPitch] = useState('');
  const [perks, setPerks] = useState('');
  const [months, setMonths] = useState('');
  const [price, setPrice] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [highlighted, setHighlighted] = useState(false);
  const [saved, setSaved] = useState(false);

  // Texte de l'offre tel qu'il est enregistré : sert à prévenir avant de quitter sans enregistrer.
  const initial = useRef<string | null>(null);
  useLeaveGuard(() => initial.current !== null && JSON.stringify([pitch, perks]) !== initial.current);

  useEffect(() => {
    if (config) {
      setPitch(config.pitch ?? '');
      setPerks(config.perks ?? '');
      initial.current = JSON.stringify([config.pitch ?? '', config.perks ?? '']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.id]);

  async function onSave() {
    await saveConfig(pitch, perks);
    initial.current = JSON.stringify([pitch, perks]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function onAddPlan() {
    const m = Number.parseInt(months.replace(/\D/g, ''), 10);
    if (!m || !price.trim()) return;
    await addPlan(m, price.trim(), subtitle.trim(), highlighted);
    setMonths(''); setPrice(''); setSubtitle(''); setHighlighted(false);
  }

  if (loading && !config) {
    return (
      <View style={{ flex: 1, backgroundColor: Bby.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Bby.text} />
      </View>
    );
  }

  return (
    <FooterScreen
      footer={
        <ActionBar
          icon={Check}
          label={saved ? 'Enregistré' : 'Enregistrer le texte'}
          onPress={onSave}
          note="Enregistre la présentation et les bénéfices. Les formules s’ajoutent tout de suite."
        />
      }
    >
      <View style={{ gap: 22 }}>
        <AdminHeader title="Offre de coaching" intro="Ce que tes clientes lisent sur la page de ton coaching perso." />

        <AdminField label="Présentation" hint="Le texte d’accroche de l’offre.">
          <AdminInput big value={pitch} onChangeText={setPitch} placeholder="Présentation de l’offre…" />
        </AdminField>
        <AdminField label="Bénéfices" hint="Un bénéfice par ligne.">
          <AdminInput big value={perks} onChangeText={setPerks} placeholder={'Programme sur-mesure\nMessagerie directe\n…'} />
        </AdminField>

        <View style={{ gap: 10 }}>
          <Text style={st.section}>Formules</Text>
          <Text style={a.hint}>Une formule par durée. L’étoile la met en avant.</Text>
          {plans.map((p) => (
            <View key={p.id} style={[st.planRow, p.highlighted && st.planOn]}>
              {p.highlighted ? <Star size={14} color={Bby.ink} fill={Bby.ink} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={[st.planTitle, p.highlighted && { color: Bby.ink }]}>
                  {p.months} mois · {p.price_text}
                </Text>
                {p.subtitle ? <Text style={[st.planSub, p.highlighted && { color: Bby.mutedOnLight }]}>{p.subtitle}</Text> : null}
              </View>
              <Pressable hitSlop={10} onPress={() => removePlan(p.id)} accessibilityLabel="Supprimer la formule">
                <Trash2 size={18} color={p.highlighted ? Bby.ink : Bby.muted} />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={st.addCard}>
          <Text style={a.label}>Nouvelle formule</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 100 }}>
              <AdminField label="Mois">
                <AdminInput value={months} onChangeText={setMonths} keyboardType="number-pad" placeholder="3" />
              </AdminField>
            </View>
            <View style={{ flex: 1 }}>
              <AdminField label="Prix">
                <AdminInput value={price} onChangeText={setPrice} placeholder="149 €/mois" />
              </AdminField>
            </View>
          </View>
          <AdminField label="Sous-titre" hint="Facultatif.">
            <AdminInput value={subtitle} onChangeText={setSubtitle} placeholder="Ex : soit 387 € · -13 %" />
          </AdminField>
          <View style={a.rowBetween}>
            <Text style={st.toggleText}>Mettre en avant</Text>
            <Switch
              value={highlighted}
              onValueChange={setHighlighted}
              trackColor={{ true: Bby.yellow, false: Bby.cardAlt }}
              thumbColor={highlighted ? Bby.ink : Bby.light}
            />
          </View>
          <PillButton label="Ajouter la formule" icon={Plus} variant="yellow" onPress={onAddPlan} />
        </View>
      </View>
    </FooterScreen>
  );
}

const st = StyleSheet.create({
  section: { fontFamily: BFont.display, fontSize: 20, color: Bby.text },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 16, backgroundColor: Bby.card },
  planOn: { backgroundColor: Bby.yellow },
  planTitle: { fontFamily: BFont.sansSemibold, fontSize: 15, color: Bby.text },
  planSub: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted, marginTop: 2 },
  addCard: { borderRadius: 20, padding: 16, gap: 14, borderWidth: 1.5, borderColor: Bby.line, borderStyle: 'dashed' },
  toggleText: { fontFamily: BFont.sansMedium, fontSize: 15, color: Bby.text },
});
