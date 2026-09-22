// 知闲 · 管理后台 · 发送通知 (全体 공지)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { adminBroadcast } from '@/data/api';

export default function AdminNotifyScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    if (!body.trim()) {
      Alert.alert('提示', '请填写通知内容');
      return;
    }
    setSending(true);
    try {
      const r = await adminBroadcast(body.trim(), title.trim() || undefined);
      Alert.alert('已发送', `已发送给 ${r?.count ?? 0} 位用户`);
      setTitle('');
      setBody('');
    } catch (e: any) {
      Alert.alert('发送失败', String(e?.message ?? '请重试'));
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.headerTitle}>发送通知</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>发送给全体用户，会出现在每个人的「消息」里。</Text>

          <Text style={styles.label}>标题 (选填)</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="例：系统维护通知"
            placeholderTextColor={Brand.textFaint}
            maxLength={30}
          />

          <Text style={styles.label}>内容</Text>
          <TextInput
            style={styles.bodyInput}
            value={body}
            onChangeText={setBody}
            placeholder="写下要通知全体会员的内容…"
            placeholderTextColor={Brand.textFaint}
            multiline
            textAlignVertical="top"
            maxLength={300}
          />

          <Pressable
            style={[styles.sendBtn, sending && { opacity: 0.6 }]}
            onPress={send}
            disabled={sending}>
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendText}>发送给全体</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    backgroundColor: Brand.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  headerTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
  content: { padding: S.lg, gap: S.sm },
  hint: { fontSize: F.small, color: Brand.textSub, marginBottom: S.sm },
  label: { fontSize: F.sub, fontWeight: '700', color: Brand.text, marginTop: S.md },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    paddingHorizontal: S.lg,
    height: 50,
    fontSize: F.body,
    color: Brand.text,
    backgroundColor: '#fff',
  },
  bodyInput: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    padding: S.lg,
    minHeight: 130,
    fontSize: F.body,
    color: Brand.text,
    backgroundColor: '#fff',
    lineHeight: 22,
  },
  sendBtn: {
    marginTop: S.lg,
    height: 52,
    borderRadius: R.md,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontSize: F.h2, fontWeight: '800' },
});
