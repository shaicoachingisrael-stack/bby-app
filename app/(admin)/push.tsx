import { useLocalSearchParams } from 'expo-router';
import { Bell, Send } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AdminChoice, AdminField, AdminHeader, AdminInput, AdminRow, useLeaveGuard } from '@/components/bby/admin/ui';
import { useCoachingClients } from '@/lib/use-coaching-admin';
import { ActionBar, BFont, Bby } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { supabase } from '@/lib/supabase';

const LINK_CHOICES: { key: string; label: string }[] = [
  { key: '', label: 'Pas de lien' },
  { key: '/today', label: 'Aujourd’hui' },
  { key: '/training', label: 'Training' },
  { key: '/nutrition', label: 'Nutrition' },
  { key: '/(tabs)/mindset', label: 'Mindset' },
  { key: '/chat', label: 'Coach IA' },
];

type Target = 'all' | 'one';
const fold = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function PushAdminScreen() {
  // Ouvert depuis la fiche d'une cliente : elle est déjà choisie.
  const params = useLocalSearchParams<{ client?: string }>();
  const { clients } = useCoachingClients();
  const [target, setTarget] = useState<Target>(params.client ? 'one' : 'all');
  const [clientId, setClientId] = useState<string | null>(params.client ?? null);
  const [search, setSearch] = useState('');
  const chosen = clients.find((c) => c.id === clientId) ?? null;
  const chosenName = chosen?.display_name?.trim() || 'cette cliente';
  const matches = useMemo(() => {
    const q = fold(search.trim());
    return clients.filter((c) => !q || fold(c.display_name ?? '').includes(q)).slice(0, 8);
  }, [clients, search]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sending, setSending] = useState(false);

  // Un message commencé et pas envoyé : on prévient avant de quitter.
  useLeaveGuard(() => !sending && (title.trim().length > 0 || body.trim().length > 0));

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Il manque un texte', 'Écris un titre et un message avant d’envoyer.');
      return;
    }
    if (target === 'one' && !clientId) {
      Alert.alert('Choisis la cliente', 'Touche son nom dans la liste « À qui ».');
      return;
    }
    Alert.alert(
      target === 'one' ? `Envoyer à ${chosenName} ?` : 'Envoyer à toutes tes clientes ?',
      target === 'one'
        ? 'Elle seule la reçoit, tout de suite. On ne peut pas l’annuler ensuite.'
        : 'La notification part tout de suite sur leurs téléphones. On ne peut pas l’annuler ensuite.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          style: 'destructive',
          onPress: () => doSend(),
        },
      ],
    );
  }

  async function doSend() {
    setSending(true);
    try {
      const url = linkUrl.trim();
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          title: title.trim(),
          body: body.trim(),
          data: url ? { url } : undefined,
          user_ids: target === 'one' && clientId ? [clientId] : undefined,
        },
      });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      const errors = (data as any)?.errors ?? 0;
      const total = (data as any)?.total ?? 0;
      if (target === 'one' && total === 0) {
        Alert.alert(
          'Notification gardée dans l’app',
          `${chosenName} n’a pas activé les notifications sur son téléphone : rien n’est arrivé sur son écran. Elle la verra dans la cloche de l’app.`,
        );
      } else {
        Alert.alert(
          'Notification envoyée',
          target === 'one'
            ? `Envoyée à ${chosenName}${errors ? ` (${errors} téléphone(s) en erreur)` : ''}.`
            : `${sent} téléphone(s) sur ${total}${errors ? ` (${errors} en erreur)` : ''}.`,
        );
      }
      setTitle('');
      setBody('');
      setLinkUrl('');
    } catch (e: any) {
      Alert.alert('Échec', e?.message ?? 'Erreur inconnue.');
    } finally {
      setSending(false);
    }
  }

  return (
    <FooterScreen
      footer={
        <ActionBar
          icon={Send}
          label={sending ? 'Envoi…' : 'Envoyer'}
          onPress={handleSend}
          disabled={sending}
          note={
            target === 'one'
              ? chosen
                ? `À ${chosenName} seulement.`
                : 'Choisis d’abord la cliente.'
              : 'À toutes tes clientes qui ont accepté les notifications.'
          }
        />
      }
    >
      <View style={{ gap: 22 }}>
        <AdminHeader
          title="Envoyer une notification"
          intro="À toutes tes clientes, ou à une seule. Tu confirmes avant l’envoi."
        />

        <AdminField label="À qui" hint="Toutes tes clientes, ou une seule que tu choisis.">
          <AdminChoice
            options={[
              { key: 'all', label: 'Toutes mes clientes' },
              { key: 'one', label: 'Une cliente' },
            ]}
            value={target}
            onChange={setTarget}
          />
        </AdminField>

        {target === 'one' ? (
          <View style={{ gap: 10 }}>
            {chosen ? (
              <AdminRow top="Cliente choisie" title={chosenName} sub="Touche pour en choisir une autre" highlight onPress={() => setClientId(null)} />
            ) : (
              <>
                <AdminInput value={search} onChangeText={setSearch} placeholder="Cherche son prénom…" autoCorrect={false} />
                {matches.map((c) => (
                  <AdminRow
                    key={c.id}
                    title={c.display_name?.trim() || 'Sans prénom'}
                    sub={c.is_personal_coaching ? 'Coaching perso' : undefined}
                    onPress={() => {
                      setClientId(c.id);
                      setSearch('');
                    }}
                  />
                ))}
                {!matches.length ? <Text style={st.empty}>Aucune cliente à ce nom.</Text> : null}
              </>
            )}
          </View>
        ) : null}

        <AdminField label="Titre" hint="En gras, en haut de la notification." counter={`${title.length} / 60`}>
          <AdminInput value={title} onChangeText={setTitle} placeholder="Ex : Nouvelle séance dispo" maxLength={60} />
        </AdminField>

        <AdminField label="Message" hint="Le texte sous le titre." counter={`${body.length} / 200`}>
          <AdminInput value={body} onChangeText={setBody} placeholder="Ex : Full body 30 min, rejoins-moi maintenant 💪" multiline maxLength={200} />
        </AdminField>

        <AdminField label="Quand elle touche la notification" hint="L’écran de l’app qui s’ouvre.">
          <AdminChoice options={LINK_CHOICES} value={linkUrl} onChange={setLinkUrl} />
        </AdminField>

        <View style={{ gap: 8 }}>
          <Text style={st.previewLabel}>Aperçu</Text>
          <View style={st.notif}>
            <View style={st.notifIcon}>
              <Bell size={18} color={Bby.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={st.notifTop}>
                <Text style={st.notifApp}>BODY BY YOU</Text>
                <Text style={st.notifTime}>maintenant</Text>
              </View>
              <Text style={st.notifTitle} numberOfLines={1}>
                {title.trim() || 'Titre de ta notification'}
              </Text>
              <Text style={st.notifBody} numberOfLines={4}>
                {body.trim() || 'Ton message apparaîtra ici.'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </FooterScreen>
  );
}

const st = StyleSheet.create({
  empty: { fontFamily: BFont.sans, fontSize: 14, color: Bby.muted, textAlign: 'center', paddingVertical: 8 },
  previewLabel: { fontFamily: BFont.sansBold, fontSize: 15, color: Bby.text },
  notif: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 22, backgroundColor: Bby.cardAlt },
  notifIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: Bby.yellow, alignItems: 'center', justifyContent: 'center' },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifApp: { fontFamily: BFont.sansSemibold, fontSize: 11, letterSpacing: 0.6, color: Bby.muted },
  notifTime: { fontFamily: BFont.sans, fontSize: 11, color: Bby.muted },
  notifTitle: { fontFamily: BFont.sansSemibold, fontSize: 15, color: Bby.text, marginTop: 2 },
  notifBody: { fontFamily: BFont.sans, fontSize: 14, lineHeight: 19, color: Bby.text, marginTop: 1 },
});
