import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BFont, Bby, RoundButton } from '@/components/bby/kit';
import { CoachChat } from '@/components/ui/coach-chat';

// Messagerie avec une cliente. Le fil (CoachChat) est partagé avec l'app cliente : seule l'enveloppe change ici.
export default function ClientChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Bby.bg }}>
      <View style={[st.topBar, { paddingTop: insets.top + 8 }]}>
        <RoundButton icon={ArrowLeft} variant="outline" size={44} onPress={() => router.back()} label="Retour" />
        <Text style={st.title}>Messagerie</Text>
        <View style={{ width: 44 }} />
      </View>
      <CoachChat clientId={id} role="coach" />
    </View>
  );
}

const st = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Bby.line,
  },
  title: { fontFamily: BFont.display, fontSize: 20, color: Bby.text },
});
