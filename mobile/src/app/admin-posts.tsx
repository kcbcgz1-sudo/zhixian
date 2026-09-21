// 知闲 · 管理后台 · 内容管理
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { adminPostDelete, adminPostRemove, adminPostRestore, adminPosts, type AdminPost } from '@/data/api';
import { useAuth } from '@/data/auth';

const CAT_LABEL: Record<string, string> = { fishing: '钓鱼', hiking: '登山', stay: '短租' };

export default function AdminPostsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setList(await adminPosts());
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [user?.id]);

  async function act(fn: () => Promise<any>) {
    try {
      await fn();
      await load();
    } catch {
      Alert.alert('操作失败', '请重试');
    }
  }

  function confirmDelete(p: AdminPost) {
    const run = () => act(() => adminPostDelete(p.id));
    // RN Web에서는 Alert.alert 버튼 콜백이 동작하지 않아 window.confirm 사용
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`确定删除「${p.title}」？此操作不可恢复。`)) run();
      return;
    }
    Alert.alert('删除内容', `确定删除「${p.title}」？不可恢复。`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: run },
    ]);
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.headerTitle}>内容管理</Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {list.map((p) => {
              const removed = p.status === 'removed';
              return (
                <View key={p.id} style={styles.card}>
                  <View style={styles.row}>
                    <Text style={styles.title} numberOfLines={1}>
                      {p.title}
                    </Text>
                    <View style={[styles.badge, removed ? styles.badgeOff : styles.badgeOn]}>
                      <Text style={styles.badgeText}>{removed ? '已下架' : '已发布'}</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>
                    {CAT_LABEL[p.category] ?? p.category} · {p.author}
                  </Text>
                  <View style={styles.actions}>
                    {removed ? (
                      <Pressable style={[styles.btn, styles.btnGreen]} onPress={() => act(() => adminPostRestore(p.id))}>
                        <Text style={styles.btnGreenText}>恢复</Text>
                      </Pressable>
                    ) : (
                      <Pressable style={[styles.btn, styles.btnGray]} onPress={() => act(() => adminPostRemove(p.id))}>
                        <Text style={styles.btnGrayText}>下架</Text>
                      </Pressable>
                    )}
                    <Pressable style={[styles.btn, styles.btnRed]} onPress={() => confirmDelete(p)}>
                      <Text style={styles.btnRedText}>删除</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
            {list.length === 0 && <Text style={styles.empty}>暂无内容</Text>}
          </ScrollView>
        )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: S.lg, gap: S.md },
  card: { backgroundColor: Brand.card, borderRadius: R.lg, padding: S.lg, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  title: { flex: 1, fontSize: F.body, fontWeight: '700', color: Brand.text },
  badge: { paddingHorizontal: S.sm, paddingVertical: 2, borderRadius: R.sm },
  badgeOn: { backgroundColor: Brand.greenSoft },
  badgeOff: { backgroundColor: '#F3D9D2' },
  badgeText: { fontSize: F.tiny, color: Brand.text },
  meta: { fontSize: F.small, color: Brand.textSub },
  actions: { flexDirection: 'row', gap: S.sm, marginTop: 4 },
  btn: { paddingHorizontal: S.lg, paddingVertical: S.sm, borderRadius: R.md },
  btnGray: { backgroundColor: '#E7EAEC' },
  btnGrayText: { color: Brand.text, fontWeight: '700', fontSize: F.small },
  btnGreen: { backgroundColor: Brand.green },
  btnGreenText: { color: '#fff', fontWeight: '700', fontSize: F.small },
  btnRed: { backgroundColor: '#FBE9E7' },
  btnRedText: { color: Brand.danger, fontWeight: '700', fontSize: F.small },
  empty: { textAlign: 'center', color: Brand.textSub, marginTop: S.xxl },
});
