// 知闲 · 私信 채팅방 (양방향, 폴링)
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { getChatMessages, sendChatMessage, type ChatMessage, type UserCard } from '@/data/api';

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const convId = String(id ?? '');
  const [other, setOther] = useState<UserCard | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 60);

  const load = useCallback(
    async (silent?: boolean) => {
      if (!convId) return;
      if (!silent) setLoading(true);
      try {
        const d = await getChatMessages(convId);
        setOther(d.other);
        setMessages((prev) => {
          if (prev.length !== d.messages.length) scrollToEnd();
          return d.messages;
        });
      } catch {
        /* noop */
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [convId],
  );

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      const t = setInterval(() => load(true), 4000);
      return () => clearInterval(t);
    }, [load]),
  );

  async function onSend() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText('');
    try {
      const m = await sendChatMessage(convId, body);
      setMessages((prev) => [...prev, m]);
      scrollToEnd();
    } catch (e: any) {
      setText(body);
      const msg = String(e?.message ?? '发送失败');
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.bar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Pressable
            style={styles.barUser}
            onPress={() => other && router.push(`/user/${other.id}` as any)}
          >
            {other?.avatar ? (
              <Image source={{ uri: other.avatar }} style={styles.barAvatar} contentFit="cover" />
            ) : (
              <View style={[styles.barAvatar, styles.barAvatarFallback]}>
                <Ionicons name="person" size={14} color="#fff" />
              </View>
            )}
            <Text style={styles.barTitle} numberOfLines={1}>
              {other?.nickname ?? '私信'}
            </Text>
          </Pressable>
          <View style={{ width: 26 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Brand.green} size="large" />
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.msgs}
              onContentSizeChange={scrollToEnd}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 && (
                <Text style={styles.hint}>还没有消息，发一条打个招呼吧～</Text>
              )}
              {messages.map((m) => (
                <View key={m.id} style={[styles.row, m.mine ? styles.rowMine : styles.rowOther]}>
                  <View style={[styles.bubble, m.mine ? styles.bubbleMine : styles.bubbleOther]}>
                    <Text style={[styles.bubbleText, m.mine && styles.bubbleTextMine]}>{m.body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="输入消息…"
              placeholderTextColor={Brand.textFaint}
              multiline
              onSubmitEditing={onSend}
              returnKeyType="send"
            />
            <Pressable
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnOff]}
              onPress={onSend}
              disabled={!text.trim() || sending}
            >
              <Text style={styles.sendText}>发送</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    backgroundColor: Brand.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  barUser: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.sm },
  barAvatar: { width: 28, height: 28, borderRadius: 999, backgroundColor: Brand.bg },
  barAvatarFallback: { backgroundColor: Brand.green, alignItems: 'center', justifyContent: 'center' },
  barTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text, flexShrink: 1 },
  msgs: { padding: S.lg, gap: S.sm },
  hint: { textAlign: 'center', color: Brand.textSub, marginTop: S.xl },
  row: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.lg },
  bubbleMine: { backgroundColor: Brand.green, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Brand.card, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: F.body, color: Brand.text, lineHeight: 21 },
  bubbleTextMine: { color: '#fff' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: S.sm,
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
    backgroundColor: Brand.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 40,
    backgroundColor: Brand.bg,
    borderRadius: R.lg,
    paddingHorizontal: S.md,
    paddingVertical: 10,
    fontSize: F.body,
    color: Brand.text,
  },
  sendBtn: {
    backgroundColor: Brand.green,
    borderRadius: R.lg,
    paddingHorizontal: S.lg,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: '#B9D9C4' },
  sendText: { color: '#fff', fontWeight: '800', fontSize: F.small },
});
