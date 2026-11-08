import { Bell, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AdminChoice, AdminField, AdminHeader, AdminInput, useLeaveGuard } from '@/components/bby/admin/ui';
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

export default function PushAdminScreen() {
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
    Alert.alert(
      'Envoyer à toutes tes clientes ?',
      'La notification part tout de suite sur leurs téléphones. On ne peut pas l’annuler ensuite.',
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
        },
      });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      const errors = (data as any)?.errors ?? 0;
      const total = (data as any)?.total ?? 0;
      Alert.alert(
        'Push envoyé',
        `${sent} envoyé(s) sur ${total}${errors ? ` (${errors} erreurs)` : ''}.`,
      );
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
          note="À toutes tes clientes qui ont accepté les notifications."
        />
      }
    >
      <View style={{ gap: 22 }}>
        <AdminHeader
          title="Envoyer une notification"
          intro="Elle arrive sur le téléphone de toutes tes clientes qui ont accepté les notifications. Tu confirmes avant l’envoi."
        />

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
  previewLabel: { fontFamily: BFont.sansBold, fontSize: 15, color: Bby.text },
  notif: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 22, backgroundColor: Bby.cardAlt },
  notifIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: Bby.yellow, alignItems: 'center', justifyContent: 'center' },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifApp: { fontFamily: BFont.sansSemibold, fontSize: 11, letterSpacing: 0.6, color: Bby.muted },
  notifTime: { fontFamily: BFont.sans, fontSize: 11, color: Bby.muted },
  notifTitle: { fontFamily: BFont.sansSemibold, fontSize: 15, color: Bby.text, marginTop: 2 },
  notifBody: { fontFamily: BFont.sans, fontSize: 14, lineHeight: 19, color: Bby.text, marginTop: 1 },
});
