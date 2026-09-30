// 知闲 · 관리자 자동생성 & 审核箱 (매일 AI 干货 자동생성 → 검수 → 上架)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import {
  autogenDiscard,
  autogenPending,
  autogenPublish,
  autogenRun,
  autogenStatus,
  autogenToggle,
  type AutogenStatus,
  type PendingPost,
} from '@/data/api';
import { useAuth } from '@/data/auth';

export default function AdminAutogenScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<AutogenStatus | null>(null);
  const [list, setList] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const nameOf = (code: string) =>
    status?.perCategory.find((c) => c.code === code)?.name ?? code;

  const load = async () => {
    try {
      const [st, pend] = await Promise.all([autogenStatus(), autogenPending()]);
      setStatus(st);
      setList(pend);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user?.id]);

  const onToggle = async (v: boolean) => {
    if (!status) return;
    setStatus({ ...status, enabled: v });
    try {
      await autogenToggle(v);
    } catch {
      setStatus({ ...status, enabled: !v });
      Alert.alert('提示', '切换失败，请重试');
    }
  };

  const onRun = async () => {
    setRunning(true);
    try {
      const r = await autogenRun();
      await load();
      Alert.alert('生成完成', `本次新增 ${r?.created ?? 0} 篇待审核内容`);
    } catch {
      Alert.alert('提示', '生成失败，请稍后重试');
    } finally {
      setRunning(false);
    }
  };

  const onPublish = async (id: string) => {
    setBusyId(id);
    try {
      await autogenPublish(id);
      setList((prev) => prev.filter((x) => x.id !== id));
    } catch {
      Alert.alert('提示', '上架失败，请重试');
    } finally {
      setBusyId(null);
    }
  };

  const onDiscard = async (id: string) => {
    setBusyId(id);
    try {
      await autogenDiscard(id);
      setList((prev) => prev.filter((x) => x.id !== id));
    } catch {
      Alert.alert('提示', '删除失败，请重试');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.bar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.barTitle}>自动生成 · 审核箱</Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {status && !status.hasKey && (
              <View style={styles.warn}>
                <Ionicons name="warning-outline" size={18} color={Brand.danger} />
                <Text style={styles.warnText}>未配置 AI 密钥（DASHSCOPE_API_KEY），暂无法生成。</Text>
              </View>
            )}

            {/* 자동생성 스위치 카드 */}
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>每日自动生成</Text>
                  <Text style={styles.cardSub}>
                    每天凌晨按分类自动生成，每类 {status?.dailyPerCategory ?? 3} 篇，待审核累计满{' '}
                    {status?.pendingCap ?? 20} 篇即停。作者：{status?.editor?.nickname ?? '知闲小编'}
                  </Text>
                </View>
                <Switch
                  value={!!status?.enabled}
                  onValueChange={onToggle}
                  disabled={!status?.hasKey}
                  trackColor={{ true: Brand.green, false: '#CBD5D1' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.statsRow}>
                {status?.perCategory.map((c) => (
                  <View key={c.code} style={styles.stat}>
                    <Text style={styles.statNum}>{c.pending}</Text>
                    <Text style={styles.statLabel}>{c.name}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={[styles.runBtn, (running || !status?.hasKey) && { opacity: 0.5 }]}
                onPress={onRun}
                disabled={running || !status?.hasKey}>
                {running ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={styles.runText}>立即生成一批</Text>
                  </>
                )}
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>
              待审核 · 待上架（{list.length}）
            </Text>

            {list.length === 0 && (
              <Text style={styles.empty}>暂无待审核内容。点击上方「立即生成一批」试试。</Text>
            )}

            {list.map((p) => (
              <View key={p.id} style={styles.item}>
                <View style={styles.itemHead}>
                  <Text style={styles.catTag}>{nameOf(p.category)}</Text>
                  <Text style={styles.itemMeta}>{p.createdAt}</Text>
                </View>
                <Text style={styles.itemTitle}>{p.title}</Text>
                <Text style={styles.itemBody} selectable>
                  {p.body}
                </Text>
                {p.tags.length > 0 && (
                  <Text style={styles.itemTags}>{p.tags.map((t) => `#${t}`).join(' ')}</Text>
                )}
                <View style={styles.itemBtns}>
                  <Pressable
                    style={[styles.discardBtn, busyId === p.id && { opacity: 0.5 }]}
                    onPress={() => onDiscard(p.id)}
                    disabled={busyId === p.id}>
                    <Ionicons name="trash-outline" size={17} color={Brand.danger} />
                    <Text style={styles.discardText}>删除</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.publishBtn, busyId === p.id && { opacity: 0.5 }]}
                    onPress={() => onPublish(p.id)}
                    disabled={busyId === p.id}>
                    {busyId === p.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="arrow-up-circle" size={18} color="#fff" />
                        <Text style={styles.publishText}>上架</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            ))}
            <View style={{ height: 30 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg ?? '#F2F4F3' },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    backgroundColor: Brand.card,
  },
  barTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
  content: { padding: S.lg, gap: S.md },
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDECEA',
    borderRadius: R.md,
    padding: 12,
  },
  warnText: { flex: 1, fontSize: F.small, color: Brand.danger, lineHeight: 18 },
  card: { backgroundColor: Brand.card, borderRadius: R.lg, padding: S.lg, gap: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: F.body, fontWeight: '800', color: Brand.text },
  cardSub: { fontSize: F.small, color: Brand.textSub, lineHeight: 18, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    paddingTop: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '900', color: Brand.green },
  statLabel: { fontSize: F.small, color: Brand.textSub, marginTop: 2 },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.green,
    borderRadius: R.md,
    paddingVertical: 13,
  },
  runText: { color: '#fff', fontSize: F.body, fontWeight: '800' },
  sectionTitle: { fontSize: F.body, fontWeight: '800', color: Brand.text, marginTop: 4 },
  empty: { fontSize: F.small, color: Brand.textFaint, paddingVertical: 20, textAlign: 'center' },
  item: { backgroundColor: Brand.card, borderRadius: R.lg, padding: S.lg, gap: 8 },
  itemHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catTag: {
    fontSize: F.small,
    fontWeight: '800',
    color: Brand.green,
    backgroundColor: '#E7F5EF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  itemMeta: { fontSize: F.small, color: Brand.textFaint },
  itemTitle: { fontSize: F.h3 ?? 17, fontWeight: '800', color: Brand.text },
  itemBody: { fontSize: F.small, color: Brand.textSub, lineHeight: 20 },
  itemTags: { fontSize: F.small, color: Brand.green },
  itemBtns: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: R.md,
    backgroundColor: '#FDECEA',
  },
  discardText: { color: Brand.danger, fontWeight: '700', fontSize: F.small },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: R.md,
    backgroundColor: Brand.green,
  },
  publishText: { color: '#fff', fontWeight: '800', fontSize: F.small },
});
