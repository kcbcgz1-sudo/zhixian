// 知闲 · 发起约伴(활동 만들기)
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

import RegionInline from '@/components/region-inline';
import { Brand, F, R, S } from '@/constants/brand';
import { DEFAULT_CITY, DEFAULT_PROVINCE } from '@/constants/regions';
import { injectThinBar } from '@/constants/thinbar';
import { createActivity, fetchCategories, type ApiCategory } from '@/data/api';
import { useAuth } from '@/data/auth';

function toIso(date: string, time: string): string | null {
  const d = date.trim().replace(/\//g, '-');
  const t = (time.trim() || '08:00').replace(/：/g, ':');
  const m = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const tm = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m || !tm) return null;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(tm[1]), Number(tm[2]), 0);
  if (isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

export default function ActivityNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [category, setCategory] = useState('');
  const [province, setProvince] = useState(DEFAULT_PROVINCE);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [district, setDistrict] = useState('');
  const [title, setTitle] = useState('');
  const [meetPoint, setMeetPoint] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:00');
  const [maxp, setMaxp] = useState('');
  const [contact, setContact] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => injectThinBar(), []);
  useEffect(() => {
    fetchCategories()
      .then((list) => { setCats(list); setCategory((prev) => prev || list[0]?.code || 'fishing'); })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (user) {
      if (user.city) setCity(user.city);
      if (user.province) setProvince(user.province);
    }
  }, [user?.id]);

  async function submit() {
    if (!user) {
      Alert.alert('请先登录', '发起活动前需要登录账号');
      router.push('/login' as any);
      return;
    }
    if (!title.trim()) { Alert.alert('提示', '请填写活动标题'); return; }
    if (!meetPoint.trim()) { Alert.alert('提示', '请填写集合地点'); return; }
    const iso = toIso(date, time);
    if (!iso) { Alert.alert('提示', '请填写正确的出发日期，例如 2026-10-03，时间 08:00'); return; }
    if (new Date(iso).getTime() < Date.now()) { Alert.alert('提示', '出发时间需要晚于现在'); return; }
    const max = maxp.trim() ? Number(maxp.trim()) : null;
    if (max != null && (!Number.isFinite(max) || max < 1)) { Alert.alert('提示', '人数上限需为正整数，或留空表示不限'); return; }
    setSubmitting(true);
    try {
      await createActivity({
        category: category || 'fishing',
        title: title.trim(),
        description: desc.trim(),
        province,
        city,
        district: district || undefined,
        meetPoint: meetPoint.trim(),
        startAt: iso,
        maxParticipants: max,
        contact: contact.trim() || undefined,
      });
      setDone(true);
      setTimeout(() => router.replace('/(tabs)/activities' as any), 900);
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert('发起失败', String(e?.message ?? '请检查网络后重试'));
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.bar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.barTitle}>发起约伴</Text>
          <Pressable onPress={submit} disabled={submitting} style={[styles.submitBtn, submitting && { opacity: 0.6 }]}>
            {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>发布</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>类型</Text>
          <View style={styles.catBox}>
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.catRow}
              {...(Platform.OS === 'web' ? ({ dataSet: { thinbar: 'cat' } } as any) : {})}>
              {cats.map((c) => {
                const active = c.code === category;
                return (
                  <Pressable key={c.code} onPress={() => setCategory(c.code)} style={[styles.cat, active ? styles.catOn : styles.catOff]}>
                    <Text style={[styles.catText, { color: active ? '#fff' : Brand.text }]}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Text style={styles.label}>活动标题</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="例：周六白云山轻松登山，招4人" placeholderTextColor={Brand.textFaint} style={styles.input} maxLength={40} />

          <Text style={styles.label}>所在地区</Text>
          <RegionInline province={province} city={city} district={district} showDistrict onChange={(p, c, d) => { setProvince(p); setCity(c); setDistrict(d); }} />

          <Text style={styles.label}>集合地点</Text>
          <TextInput value={meetPoint} onChangeText={setMeetPoint} placeholder="例：白云山南门 / 地铁3号线XX站A口" placeholderTextColor={Brand.textFaint} style={styles.input} maxLength={50} />

          <Text style={styles.label}>出发时间</Text>
          <View style={styles.dtRow}>
            <TextInput value={date} onChangeText={setDate} placeholder="2026-10-03" placeholderTextColor={Brand.textFaint} style={[styles.input, styles.dtDate]} maxLength={10} />
            <TextInput value={time} onChangeText={setTime} placeholder="08:00" placeholderTextColor={Brand.textFaint} style={[styles.input, styles.dtTime]} maxLength={5} />
          </View>
          <Text style={styles.hint}>日期格式 年-月-日，时间 时:分（24小时制）</Text>

          <Text style={styles.label}>人数上限（选填）</Text>
          <TextInput value={maxp} onChangeText={setMaxp} placeholder="留空表示不限人数" placeholderTextColor={Brand.textFaint} style={styles.input} keyboardType="number-pad" maxLength={3} />

          <Text style={styles.label}>联系方式（选填）</Text>
          <TextInput value={contact} onChangeText={setContact} placeholder="例：微信号，方便报名后联系" placeholderTextColor={Brand.textFaint} style={styles.input} maxLength={40} />

          <Text style={styles.label}>活动详情（选填）</Text>
          <TextInput value={desc} onChangeText={setDesc} placeholder="路线难度、需要带的装备、节奏快慢、费用AA等，写清楚更容易招到合适的伙伴" placeholderTextColor={Brand.textFaint} style={styles.bodyInput} multiline textAlignVertical="top" />

          <Text style={styles.hint}>发布后，报名的伙伴会出现在活动详情里，你也会收到报名通知。</Text>
        </ScrollView>
      </SafeAreaView>

      {done && (
        <View style={styles.overlay}>
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={56} color={Brand.green} />
            <Text style={styles.successText}>发起成功</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.card },
  flex: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  barTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
  submitBtn: { backgroundColor: Brand.green, paddingHorizontal: S.lg, paddingVertical: S.sm, borderRadius: R.pill, minWidth: 64, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: F.body, fontWeight: '700' },
  content: { padding: S.lg, gap: S.sm, paddingBottom: S.xxl },
  label: { fontSize: F.sub, fontWeight: '700', color: Brand.text, marginTop: S.md },
  catBox: { height: 56 },
  catRow: { flexDirection: 'row', gap: S.sm, alignItems: 'center', paddingRight: S.lg },
  cat: { paddingHorizontal: S.xl, paddingVertical: 10, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  catOn: { backgroundColor: Brand.green },
  catOff: { backgroundColor: '#E7EAEC' },
  catText: { fontSize: F.body, fontWeight: '700', lineHeight: 24, includeFontPadding: false },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    paddingHorizontal: S.lg,
    height: 52,
    fontSize: F.body,
    color: Brand.text,
  },
  dtRow: { flexDirection: 'row', gap: S.sm },
  dtDate: { flex: 2 },
  dtTime: { flex: 1 },
  bodyInput: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    padding: S.lg,
    minHeight: 120,
    fontSize: F.body,
    color: Brand.text,
    lineHeight: 24,
  },
  hint: { fontSize: F.small, color: Brand.textSub, marginTop: 4, lineHeight: 18 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: { backgroundColor: '#fff', paddingHorizontal: S.xxl, paddingVertical: S.xl, borderRadius: R.lg, alignItems: 'center', gap: S.sm },
  successText: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
});
