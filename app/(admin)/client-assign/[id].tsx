import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { AdminChoice, AdminField, AdminHeader, AdminInput, a } from '@/components/bby/admin/ui';
import { ActionBar, BFont, Bby, BbyScreen } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { useMindsetContent, useRecipes, useSessions } from '@/lib/use-content';
import { useClientDetail } from '@/lib/use-coaching-admin';

type Kind = 'session' | 'recipe' | 'mindset' | 'custom';

const KIND_OPTIONS: { key: Kind; label: string }[] = [
  { key: 'session', label: 'Séance' },
  { key: 'recipe', label: 'Recette' },
  { key: 'mindset', label: 'Mindset' },
  { key: 'custom', label: 'Sur-mesure' },
];

export default function ClientAssignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addAssignment } = useClientDetail(id);

  const { sessions } = useSessions();
  const { recipes } = useRecipes();
  const { items: mindset } = useMindsetContent();

  const [kind, setKind] = useState<Kind>('session');
  const [note, setNote] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  async function assignCatalog(refId: string, title: string) {
    await addAssignment({ item_type: kind, ref_id: refId, title, coach_note: note.trim() || null });
    router.back();
  }

  async function assignCustom() {
    if (!customTitle.trim()) return;
    await addAssignment({
      item_type: 'custom',
      title: customTitle.trim(),
      description: customDesc.trim() || null,
      coach_note: note.trim() || null,
    });
    router.back();
  }

  const catalog = kind === 'session' ? sessions : kind === 'recipe' ? recipes : mindset;

  const body = (
    <View style={{ gap: 22 }}>
      <AdminHeader title="Ajouter au plan" intro="Choisis dans ton catalogue, ou crée une étape sur-mesure pour elle." />

      <AdminField label="Type">
        <AdminChoice options={KIND_OPTIONS} value={kind} onChange={setKind} />
      </AdminField>

      <AdminField label="Note pour la cliente" hint="Facultatif. Elle la lira sous l’étape.">
        <AdminInput value={note} onChangeText={setNote} placeholder="Ex : 3 séries, à ton rythme…" />
      </AdminField>

      {kind === 'custom' ? (
        <>
          <AdminField label="Titre de l’étape">
            <AdminInput value={customTitle} onChangeText={setCustomTitle} placeholder="Ex : Marche de 20 minutes après le déjeuner" />
          </AdminField>
          <AdminField label="Description" hint="Facultatif.">
            <AdminInput value={customDesc} onChangeText={setCustomDesc} placeholder="Les détails, si besoin" multiline />
          </AdminField>
        </>
      ) : (
        <View style={{ gap: 10 }}>
          <Text style={a.label}>Choisir dans le catalogue</Text>
          <Text style={a.hint}>Touche un élément pour l’ajouter à son plan.</Text>
          {catalog.length === 0 ? (
            <Text style={a.hint}>Rien dans ce catalogue pour l’instant.</Text>
          ) : (
            catalog.map((it: any) => (
              <Pressable
                key={it.id}
                onPress={() => assignCatalog(it.id, it.title)}
                accessibilityRole="button"
                style={({ pressed }) => [st.row, pressed && { opacity: 0.85 }]}
              >
                <Text style={st.rowTitle} numberOfLines={2}>
                  {it.title}
                </Text>
                <View style={st.plus}>
                  <Plus size={18} color={Bby.ink} />
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );

  if (kind === 'custom') {
    return (
      <FooterScreen
        footer={<ActionBar icon={Plus} label="Ajouter au plan" onPress={assignCustom} disabled={!customTitle.trim()} />}
      >
        {body}
      </FooterScreen>
    );
  }
  return <BbyScreen bottomSpace={40}>{body}</BbyScreen>;
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 16, backgroundColor: Bby.card },
  rowTitle: { flex: 1, fontFamily: BFont.sansMedium, fontSize: 15, color: Bby.text },
  plus: { width: 36, height: 36, borderRadius: 18, backgroundColor: Bby.yellow, alignItems: 'center', justifyContent: 'center' },
});
