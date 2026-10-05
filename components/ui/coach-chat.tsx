import { Send } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCoachMessages } from '@/lib/use-coaching';

// Messagerie 1:1 réutilisable. role = qui utilise l'écran (client côté app, coach côté admin).
export function CoachChat({ clientId, role }: { clientId: string | undefined; role: 'client' | 'coach' }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { messages, send } = useCoachMessages(clientId, role);
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  async function onSend() {
    const v = text.trim();
    if (!v) return;
    setText('');
    await send(v);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 44}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.sm, flexGrow: 1, justifyContent: 'flex-end' }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            {t('coaching.chatEmpty')}
          </Text>
        ) : (
          messages.map((m) => {
            const mine = m.sender === role;
            return (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  {
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    backgroundColor: mine ? palette.text : palette.surface,
                  },
                ]}
              >
                <Text style={{ color: mine ? palette.background : palette.text, fontFamily: Fonts.sans, fontSize: 15, lineHeight: 21 }}>
                  {m.content}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing.sm, borderTopColor: palette.border, backgroundColor: palette.background }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('coaching.chatPlaceholder')}
          placeholderTextColor={palette.textSecondary}
          multiline
          style={[styles.input, { backgroundColor: palette.surface, color: palette.text, fontFamily: Fonts.sans }]}
        />
        <Pressable
          onPress={onSend}
          disabled={!text.trim()}
          style={[styles.sendBtn, { backgroundColor: palette.text, opacity: text.trim() ? 1 : 0.4 }]}
        >
          <Send size={18} color={palette.background} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14, textAlign: 'center', marginVertical: Spacing.xxxl },
  bubble: { maxWidth: '82%', borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontSize: 15, maxHeight: 120,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
