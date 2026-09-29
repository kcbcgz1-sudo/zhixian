// 知闲 · 约伴同行(活动) 목록 탭
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RegionModal from '@/components/region-modal';
import { Brand, F, R, S } from '@/constants/brand';
import { DEFAULT_CITY, DEFAULT_PROVINCE } from '@/constants/regions';
import { injectThinBar } from '@/constants/thinbar';
import { fetchActivities, fetchCategories, type Activity } from '@/data/api';
import { useAuth } from '@/data/auth';

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 周${wk} ${hh}:${mi}`;
}
function statusOf(a: Activity): { text: string; color: string } {
  if (a.status === 'cancelled') return { text: '已取消', color: Brand.textFaint };
  if (a.status === 'closed') return { text: '已结束', color: Brand.textFaint };
  if (new Date(a.startAt).getTime() < Date.now()) return { text: '已开始', color: Brand.textFaint };
  if (a.full || a.status === 'full') return { text: '名额已满', color: Brand.danger };
  return { text: '报名中', color: Brand.green };
}

export default function ActivitiesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [filters, setFilters] = useState<{ key: string; label: string }[]>([{ key: 'all', label: '全部' }]);
  const [filter, setFilter] = useState('all');
  const [list, setList] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [province, setProvince] = useState(DEFAULT_PROVINCE);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [cityModal, setCityModal] = useState(false);

  useEffect(() => injectThinBar(), []);
  useEffect(() => {
    fetchCategories()
      .then((cats) => setFilters([{ key: 'all', label: '全部' }, ...cats.map((c) => ({ key: c.code, label: c.name }))]))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (user) {
      if (user.city) setCity(user.city);
      if (user.province) setProvince(user.province);
    }
  }, [user?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivities(city, filter === 'all' ? undefined : filter, 50, 0);
      setList(data);
    } catch {
      setError('加载失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  }, [city, filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const catName = (code: string) => filters.find((f) => f.key === code)?.label ?? code;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.locationRow}>
          <Pressable style={styles.locBtn} onPress={() => setCityModal(true)} hitSlop={8}>
            <Ionicons name="location-outline" size={16} color={Brand.textSub} />
            <Text style={styles.location}>{province}·{city}</Text>
            <Ionicons name="chevron-down" size={14} color={Brand.textSub} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.newBtn} onPress={() => router.push('/activity-new' as any)} hitSlop={8}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.newText}>发起</Text>
          </Pressable>
        </View>

        <View style={styles.chipsBox}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.chipsRow}
            {...(Platform.OS === 'web' ? ({ dataSet: { thinbar: 'cat' } } as any) : {})}>
            {filters.map((f) => {
              const active = f.key === filter;
              return (
                <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
                  <Text style={[styles.chipText, { color: active ? '#fff' : Brand.text }]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={Brand.green} size="large" /></View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.dim}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={load}><Text style={styles.retryText}>重试</Text></Pressable>
          </View>
        ) : list.length === 0 ? (
          <ScrollView contentContainerStyle={styles.center}>
            <Ionicons name="people-outline" size={54} color={Brand.textFaint} />
            <Text style={styles.emptyTitle}>还没有约伴活动</Text>
            <Text style={styles.dim}>发起一个，招募同行的伙伴吧</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/activity-new' as any)}>
              <Text style={styles.emptyBtnText}>发起约伴</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {list.map((a) => {
              const st = statusOf(a);
              return (
                <Pressable key={a.id} style={styles.card} onPress={() => router.push({ pathname: '/activity/[id]', params: { id: a.id } } as any)}>
                  <View style={styles.cardTop}>
                    <View style={styles.catBadge}><Text style={styles.catBadgeText}>{catName(a.category)}</Text></View>
                    <View style={[styles.stBadge, { backgroundColor: st.color + '22' }]}><Text style={[styles.stText, { color: st.color }]}>{st.text}</Text></View>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>{a.title}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={15} color={Brand.textSub} />
                    <Text style={styles.meta}>{fmtWhen(a.startAt)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={15} color={Brand.textSub} />
                    <Text style={styles.meta} numberOfLines={1}>{[a.city, a.district].filter(Boolean).join(' · ')} {a.meetPoint}</Text>
                  </View>
                  <View style={styles.cardBottom}>
                    <Text style={styles.org} numberOfLines={1}>{a.organizerName} · Lv{a.organizerLevel}</Text>
                    <View style={styles.peopleWrap}>
                      <Ionicons name="people" size={15} color={Brand.green} />
                      <Text style={styles.people}>{a.signupCount}{a.maxParticipants ? `/${a.maxParticipants}` : ''}人</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
      <RegionModal
        visible={cityModal}
        province={province}
        city={city}
        onClose={() => setCityModal(false)}
        onSelect={(p, c) => { setProvince(p); setCity(c); setCityModal(false); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg },
  safe: { flex: 1 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    gap: S.sm,
  },
  locBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: F.sub, color: Brand.textSub, fontWeight: '600' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Brand.green,
    paddingHorizontal: S.md,
    paddingVertical: 6,
    borderRadius: R.pill,
  },
  newText: { color: '#fff', fontSize: F.sub, fontWeight: '700' },
  chipsBox: { height: 48 },
  chipsRow: { flexDirection: 'row', gap: S.sm, alignItems: 'center', paddingHorizontal: S.lg },
  chip: { paddingHorizontal: S.lg, paddingVertical: 8, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: Brand.green },
  chipIdle: { backgroundColor: '#E7EAEC' },
  chipText: { fontSize: F.sub, fontWeight: '700', lineHeight: 20, includeFontPadding: false },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl, gap: S.sm },
  dim: { fontSize: F.sub, color: Brand.textSub },
  emptyTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text, marginTop: S.sm },
  emptyBtn: { marginTop: S.md, backgroundColor: Brand.green, paddingHorizontal: S.xl, paddingVertical: 10, borderRadius: R.pill },
  emptyBtnText: { color: '#fff', fontSize: F.body, fontWeight: '700' },
  retryBtn: { marginTop: S.sm, backgroundColor: Brand.green, paddingHorizontal: S.xl, paddingVertical: 8, borderRadius: R.pill },
  retryText: { color: '#fff', fontSize: F.sub, fontWeight: '700' },
  listContent: { padding: S.lg, gap: S.md, paddingBottom: S.xxl },
  card: {
    backgroundColor: Brand.card,
    borderRadius: R.lg,
    padding: S.lg,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catBadge: { backgroundColor: Brand.greenSoft, borderRadius: R.sm, paddingHorizontal: 8, paddingVertical: 2 },
  catBadgeText: { color: Brand.greenDark, fontSize: F.small, fontWeight: '700' },
  stBadge: { borderRadius: R.sm, paddingHorizontal: 8, paddingVertical: 2 },
  stText: { fontSize: F.small, fontWeight: '800' },
  cardTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text, lineHeight: 24, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: F.sub, color: Brand.textSub, flex: 1 },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: S.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  org: { fontSize: F.sub, color: Brand.textSub, flex: 1 },
  peopleWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  people: { fontSize: F.sub, color: Brand.green, fontWeight: '800' },
});
