// 知闲 · 管理后台 · 内容管理 (下架/删除 + 干货 지정)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import {
  adminPointConfig,
  adminPostDelete,
  adminPostPin,
  adminPostQuality,
  adminPostRemove,
  adminPostRestore,
  adminPosts,
  type AdminPost,
} from '@/data/api';
import { useAuth } from '@/data/auth';

const CAT_LABEL: Record<string, string> = { fishing: '钓鱼', hiking: '登山', stay: '短租' };

export default function AdminPostsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<AdminPost[]>([]);
  const [minLikes, setMinLikes] = useState(100);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [posts, cfg] = await Promise.all([adminPosts(), adminPointConfig().catch(() => ({}))]);
      setList(posts);
      if (cfg && typeof (cfg as any).quality_min_likes === 'number') {
        setMinLikes((cfg as any).quality_min_likes);
      }
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
    } catch (e: any) {
      const msg = String(e?.message ?? '请重试');
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('操作失败', msg);
    }
  }

  function confirmDelete(p: AdminPost) {
    const run = () => act(() => adminPostDelete(p.id));
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
              const canGanhuo = p.likes >= minLikes;
              return (
                <View key={p.id} style={styles.card}>
                  <View style={styles.row}>
                    <Text style={styles.title} numberOfLines={1}>
                      {p.title}
                    </Text>
                    {p.pinned && (
                      <View style={styles.pinBadge}>
                        <Text style={styles.pinBadgeText}>置顶</Text>
                      </View>
                    )}
                    {p.isQuality && (
                      <View style={styles.ganhuoBadge}>
                        <Text style={styles.ganhuoBadgeText}>干货</Text>
                      </View>
                    )}
                    <View style={[styles.badge, removed ? styles.badgeOff : styles.badgeOn]}>
                      <Text style={styles.badgeText}>{removed ? '已下架' : '已发布'}</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>
                    {CAT_LABEL[p.category] ?? p.category} · {p.author} · ♥ {p.likes}
                  </Text>
                  <View style={styles.actions}>
                    {p.pinned ? (
                      <Pressable style={[styles.btn, styles.btnPinOn]} onPress={() => act(() => adminPostPin(p.id, false))}>
                        <Text style={styles.btnPinOnText}>取消置顶</Text>
                      </Pressable>
                    ) : (
                      <Pressable style={[styles.btn, styles.btnPin]} onPress={() => act(() => adminPostPin(p.id, true))}>
                        <Text style={styles.btnPinText}>置顶</Text>
                      </Pressable>
                    )}
                    {removed ? (
                      <Pressable style={[styles.btn, styles.btnGreen]} onPress={() => act(() => adminPostRestore(p.id))}>
                        <Text style={styles.btnGreenText}>恢复</Text>
                      </Pressable>
                    ) : (
                      <Pressable style={[styles.btn, styles.btnGray]} onPress={() => act(() => adminPostRemove(p.id))}>
                        <Text style={styles.btnGrayText}>下架</Text>
                      </Pressable>
                    )}
                    {p.isQuality ? (
                      <Pressable style={[styles.btn, styles.btnGold]} onPress={() => act(() => adminPostQuality(p.id, false))}>
                        <Text style={styles.btnGoldText}>取消干货</Text>
                      </Pressable>
                    ) : canGanhuo ? (
                      <Pressable style={[styles.btn, styles.btnGold]} onPress={() => act(() => adminPostQuality(p.id, true))}>
                        <Text style={styles.btnGoldText}>设为干货</Text>
                      </Pressable>
                    ) : (
                      <View style={[styles.btn, styles.btnDisabled]}>
                        <Text style={styles.btnDisabledText}>干货需{minLikes}赞</Text>
                      </View>
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
  ganhuoBadge: { paddingHorizontal: S.sm, paddingVertical: 2, borderRadius: R.sm, backgroundColor: '#FBE5C0' },
  ganhuoBadgeText: { fontSize: F.tiny, color: '#8A5A00', fontWeight: '800' },
  pinBadge: { paddingHorizontal: S.sm, paddingVertical: 2, borderRadius: R.sm, backgroundColor: '#FBE0DE' },
  pinBadgeText: { fontSize: F.tiny, color: Brand.danger, fontWeight: '800' },
  meta: { fontSize: F.small, color: Brand.textSub },
  actions: { flexDirection: 'row', gap: S.sm, marginTop: 4, flexWrap: 'wrap' },
  btn: { paddingHorizontal: S.lg, paddingVertical: S.sm, borderRadius: R.md },
  btnGray: { backgroundColor: '#E7EAEC' },
  btnGrayText: { color: Brand.text, fontWeight: '700', fontSize: F.small },
  btnGreen: { backgroundColor: Brand.green },
  btnGreenText: { color: '#fff', fontWeight: '700', fontSize: F.small },
  btnGold: { backgroundColor: '#F6C453' },
  btnGoldText: { color: '#5A3D00', fontWeight: '800', fontSize: F.small },
  btnDisabled: { backgroundColor: '#EFEFEF' },
  btnDisabledText: { color: Brand.textFaint, fontWeight: '700', fontSize: F.small },
  btnRed: { backgroundColor: '#FBE9E7' },
  btnRedText: { color: Brand.danger, fontWeight: '700', fontSize: F.small },
  btnPin: { backgroundColor: Brand.danger },
  btnPinText: { color: '#fff', fontWeight: '800', fontSize: F.small },
  btnPinOn: { backgroundColor: '#FBE0DE' },
  btnPinOnText: { color: Brand.danger, fontWeight: '800', fontSize: F.small },
  empty: { textAlign: 'center', color: Brand.textSub, marginTop: S.xxl },
});
