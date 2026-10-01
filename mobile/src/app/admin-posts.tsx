// 知闲 · 管理后台 · 内容管理 (검색 + 필터 + 더보기)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  adminPointConfig,
  adminPostDelete,
  adminPostPin,
  adminPostQuality,
  adminPostRemove,
  adminPostRestore,
  adminPosts,
  fetchCategories,
  type AdminPost,
} from '@/data/api';
import { useAuth } from '@/data/auth';

const CAT_LABEL: Record<string, string> = { fishing: '钓鱼', hiking: '登山', stay: '短租' };
const PAGE = 20;

type Quick = 'all' | 'published' | 'removed' | 'pinned' | 'quality';
const QUICKS: { key: Quick; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'published', label: '已发布' },
  { key: 'removed', label: '已下架' },
  { key: 'pinned', label: '置顶' },
  { key: 'quality', label: '干货' },
];

export default function AdminPostsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [debQ, setDebQ] = useState('');
  const [quick, setQuick] = useState<Quick>('all');
  const [cat, setCat] = useState('all');
  const [cats, setCats] = useState<{ code: string; name: string }[]>([]);
  const [items, setItems] = useState<AdminPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [minLikes, setMinLikes] = useState(100);

  const catName = (code: string) =>
    cats.find((c) => c.code === code)?.name ?? CAT_LABEL[code] ?? code;

  const buildParams = () => {
    const status = quick === 'published' ? 'published' : quick === 'removed' ? 'removed' : 'all';
    const flag = quick === 'pinned' ? 'pinned' : quick === 'quality' ? 'quality' : 'all';
    return { q: debQ, status, category: cat, flag };
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminPosts({ ...buildParams(), skip: 0, take: PAGE });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (more || items.length >= total) return;
    setMore(true);
    try {
      const res = await adminPosts({ ...buildParams(), skip: items.length, take: PAGE });
      setItems((prev) => [...prev, ...res.items]);
      setTotal(res.total);
    } catch {
      /* noop */
    } finally {
      setMore(false);
    }
  };

  // 액션(下架/置顶/삭제 등) 후: 현재 보던 개수 유지하며 갱신
  const reload = async () => {
    const keep = Math.min(50, Math.max(PAGE, items.length));
    try {
      const res = await adminPosts({ ...buildParams(), skip: 0, take: keep });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      /* noop */
    }
  };

  // 분류/설정 1회 로드
  useEffect(() => {
    fetchCategories()
      .then((cs) => setCats(cs.map((c) => ({ code: c.code, name: c.name }))))
      .catch(() => {});
    adminPointConfig()
      .then((cfg: any) => {
        if (cfg && typeof cfg.quality_min_likes === 'number') setMinLikes(cfg.quality_min_likes);
      })
      .catch(() => {});
  }, []);

  // 검색어 디바운스
  useEffect(() => {
    const t = setTimeout(() => setDebQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // 검색/필터 변경 시 처음부터 로드
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debQ, quick, cat, user?.id]);

  async function act(fn: () => Promise<any>) {
    try {
      await fn();
      await reload();
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

        {/* 검색창 */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={Brand.textSub} />
            <TextInput
              style={styles.searchInput}
              value={q}
              onChangeText={setQ}
              placeholder="搜索标题或作者昵称"
              placeholderTextColor={Brand.textFaint}
              returnKeyType="search"
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={Brand.textFaint} />
              </Pressable>
            )}
          </View>
        </View>

        {/* 빠른 필터 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {QUICKS.map((qk) => (
            <Pressable
              key={qk.key}
              onPress={() => setQuick(qk.key)}
              style={[styles.chip, quick === qk.key && styles.chipOn]}
            >
              <Text style={[styles.chipText, quick === qk.key && styles.chipTextOn]}>{qk.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 분류 필터 */}
        {cats.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <Pressable
              onPress={() => setCat('all')}
              style={[styles.chip, cat === 'all' && styles.chipOn]}
            >
              <Text style={[styles.chipText, cat === 'all' && styles.chipTextOn]}>全部分类</Text>
            </Pressable>
            {cats.map((c) => (
              <Pressable
                key={c.code}
                onPress={() => setCat(c.code)}
                style={[styles.chip, cat === c.code && styles.chipOn]}
              >
                <Text style={[styles.chipText, cat === c.code && styles.chipTextOn]}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.countText}>共 {total} 条</Text>
            {items.map((p) => {
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
                    {catName(p.category)} · {p.author} · ♥ {p.likes}
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
            {items.length === 0 && <Text style={styles.empty}>暂无内容</Text>}
            {items.length < total && (
              <Pressable style={styles.moreBtn} onPress={loadMore} disabled={more}>
                {more ? (
                  <ActivityIndicator color={Brand.green} />
                ) : (
                  <Text style={styles.moreBtnText}>加载更多（{items.length}/{total}）</Text>
                )}
              </Pressable>
            )}
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
  searchWrap: { paddingHorizontal: S.lg, paddingTop: S.md, backgroundColor: Brand.card },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: Brand.bg,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: F.body, color: Brand.text, paddingVertical: 0 },
  chipRow: { paddingHorizontal: S.lg, paddingVertical: S.sm, gap: S.sm, backgroundColor: Brand.card },
  chip: {
    paddingHorizontal: S.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Brand.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
  },
  chipOn: { backgroundColor: Brand.green, borderColor: Brand.green },
  chipText: { fontSize: F.small, color: Brand.textSub, fontWeight: '700' },
  chipTextOn: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: S.lg, gap: S.md },
  countText: { fontSize: F.small, color: Brand.textSub, marginBottom: 2 },
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
  moreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: S.md,
    borderRadius: R.md,
    backgroundColor: Brand.card,
    marginTop: 4,
  },
  moreBtnText: { color: Brand.green, fontWeight: '800', fontSize: F.body },
  empty: { textAlign: 'center', color: Brand.textSub, marginTop: S.xxl },
});
