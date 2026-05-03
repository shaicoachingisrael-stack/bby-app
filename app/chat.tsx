import { useRouter } from 'expo-router';
import { ChevronLeft, Send, Sparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useChat } from '@/lib/use-chat';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { messages, loading, sending, send } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length, sending]);

  function handleSend() {
    if (!input.trim() || sending) return;
    const text = input;
    setInput('');
    send(text);
  }

  const showEmpty = !loading && messages.length === 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: palette.text }]}>
            <Sparkles size={14} color={palette.background} />
          </View>
          <Text style={[styles.headerTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
            Coach IA
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.lg,
          paddingBottom: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.xxl }}>
            <ActivityIndicator color={palette.textSecondary} />
          </View>
        )}

        {showEmpty && <EmptyState palette={palette} onSuggest={(t) => send(t)} />}

        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} palette={palette} />
        ))}

        {sending && (
          <View style={[styles.bubble, styles.assistant, { backgroundColor: palette.surface }]}>
            <Text style={[styles.bubbleText, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              Coach écrit…
            </Text>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.inputRow,
          {
            borderTopColor: palette.border,
            backgroundColor: palette.background,
            paddingBottom: insets.bottom + Spacing.sm,
          },
        ]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Pose ta question…"
          placeholderTextColor={palette.textSecondary}
          editable={!sending}
          multiline
          style={[
            styles.input,
            {
              backgroundColor: palette.surface,
              color: palette.text,
              fontFamily: Fonts.sans,
            },
          ]}
        />
        <Pressable
          onPress={handleSend}
          disabled={!input.trim() || sending}
          style={({ pressed }) => [
            styles.send,
            {
              backgroundColor: input.trim() && !sending ? palette.text : palette.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Send size={18} color={palette.background} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const SUGGESTIONS = [
  'Donne-moi une idée de petit-dej protéiné',
  "J'ai pas envie de m'entraîner aujourd'hui, qu'est-ce que je fais ?",
  'Comment je gère une fringale en fin de journée ?',
];

function EmptyState({
  palette,
  onSuggest,
}: {
  palette: any;
  onSuggest: (text: string) => void;
}) {
  return (
    <View style={{ alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.xxl }}>
      <View style={[styles.headerIconBig, { backgroundColor: palette.text }]}>
        <Sparkles size={28} color={palette.background} />
      </View>
      <Text style={[styles.emptyTitle, { color: palette.text, fontFamily: Fonts.displayBold }]}>
        Coach IA
      </Text>
      <Text style={[styles.emptyText, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
        Pose toutes tes questions sur l'entraînement, la nutrition ou le mindset.
      </Text>
      <View style={{ gap: Spacing.sm, marginTop: Spacing.md, width: '100%' }}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => onSuggest(s)}
            style={({ pressed }) => [
              styles.suggestion,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[styles.suggestionText, { color: palette.text, fontFamily: Fonts.sans }]}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Bubble({
  role,
  content,
  palette,
}: {
  role: 'user' | 'assistant';
  content: string;
  palette: any;
}) {
  const isUser = role === 'user';
  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.user : styles.assistant,
        {
          backgroundColor: isUser ? palette.text : palette.surface,
        },
      ]}
    >
      <Text
        style={[
          styles.bubbleText,
          {
            color: isUser ? palette.background : palette.text,
            fontFamily: Fonts.sans,
          },
        ]}
      >
        {content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16 },
  emptyTitle: { fontSize: 28, letterSpacing: -0.4 },
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  suggestion: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 14 },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  user: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  assistant: { alignSelf: 'flex-start', borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    fontSize: 15,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
