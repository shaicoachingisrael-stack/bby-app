// Encart « Tes notifications » pour la coach (comptes admin).
// Sans téléphone enregistré, Shaï n'est PAS prévenue quand une cliente lui écrit
// ou se dit intéressée par le coaching : l'encart le dit clairement et permet d'activer.
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { Bell, BellOff, Check } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { BFont, Bby, PillButton } from '@/components/bby/kit';
import { useAuth } from '@/lib/auth-provider';
import { registerPushToken } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/lib/use-profile';

type State = 'loading' | 'on' | 'off' | 'blocked' | 'simulator';

export function useCoachNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);

  const check = useCallback(async () => {
    if (!user) return;
    if (!Device.isDevice) return setState('simulator');
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return setState(perm.canAskAgain === false ? 'blocked' : 'off');
    // Permission donnée : on (ré)enregistre ce téléphone, puis on vérifie qu'il est bien en base.
    await registerPushToken(user.id).catch(() => null);
    const { count } = await supabase.from('push_tokens').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    setState((count ?? 0) > 0 ? 'on' : 'off');
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      check();
    }, [check]),
  );
  // Retour des Réglages d'iOS : on revérifie.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, [check]);

  const enable = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    try {
      const perm = await Notifications.getPermissionsAsync();
      if (!perm.granted && perm.canAskAgain === false) {
        await Linking.openSettings();
        return;
      }
      await registerPushToken(user.id);
      await check();
    } finally {
      setBusy(false);
    }
  }, [user, check]);

  return { state, busy, enable };
}

/** `compact` : n'apparaît que si quelque chose ne va pas (écran Aujourd'hui). */
export function CoachNotificationsCard({ compact }: { compact?: boolean }) {
  const { profile } = useProfile();
  const { state, busy, enable } = useCoachNotifications();
  if (!profile?.is_admin || state === 'loading' || state === 'simulator') return null;
  if (compact && state === 'on') return null;

  if (state === 'on') {
    return (
      <View style={[c.card, { backgroundColor: Bby.card }]}>
        <View style={c.row}>
          <View style={[c.dot, { backgroundColor: Bby.yellow }]}>
            <Check size={18} color={Bby.ink} strokeWidth={2.6} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[c.title, { color: Bby.text }]}>Notifications activées</Text>
            <Text style={[c.text, { color: Bby.muted }]}>
              Tu es prévenue sur ce téléphone quand une cliente t’écrit ou s’intéresse au coaching.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[c.card, { backgroundColor: Bby.yellow }]}>
      <View style={c.row}>
        <View style={[c.dot, { backgroundColor: Bby.ink }]}>
          <BellOff size={18} color={Bby.yellow} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[c.title, { color: Bby.ink }]}>Active tes notifications</Text>
          <Text style={[c.text, { color: Bby.ink }]}>
            {state === 'blocked'
              ? 'Elles sont coupées dans les Réglages de ton téléphone. Sans elles, tu ne sais pas quand une cliente t’écrit.'
              : 'Sans elles, tu ne sais pas quand une cliente t’écrit ou s’intéresse au coaching.'}
          </Text>
        </View>
      </View>
      <PillButton
        label={busy ? '…' : state === 'blocked' ? 'Ouvrir les Réglages' : 'Activer les notifications'}
        icon={Bell}
        onPress={busy ? undefined : enable}
        style={{ marginTop: 14 }}
      />
    </View>
  );
}

const c = StyleSheet.create({
  card: { borderRadius: 22, padding: 16 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  dot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: BFont.display, fontSize: 17, lineHeight: 21 },
  text: { fontFamily: BFont.sans, fontSize: 14, lineHeight: 19, marginTop: 4 },
});
