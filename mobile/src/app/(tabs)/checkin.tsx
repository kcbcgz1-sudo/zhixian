// 知闲 · 每日打卡(签到) — 연속일수 + 포인트 적립
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { injectThinBar } from '@/constants/thinbar';
import { checkinStatus, doCheckin, type CheckinStatus } from '@/data/api';
import { useAuth } from '@/data/auth';

export default function CheckinScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [st, setSt] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [justGained, setJustGained] = useState(0);

  useEffect(() => injectThinBar(), []);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSt(await checkinStatus());
    } catch {
      setSt(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onCheck() {
    if (!user) {
      Alert.alert('请先登录', '签到前需要登录账号');
      router.push('/login' as any);
      return;
    }
    setBusy(true);
    try {
      const r = await doCheckin();
      setSt(r);
      if (!r.already && r.gained) {
        setJustGained(r.gained);
        setTimeout(() => setJustGained(0), 1800);
      }
    } catch (e: any) {
      Alert.alert('签到失败', String(e?.message ?? '请重试'));
    } finally {
      setBusy(false);
    }
  }

  const streak = st?.streak ?? 0;
  const total = st?.total ?? 0;
  const pts = st?.points ?? 5;
  const checked = st?.checkedToday ?? false;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.head}>
          <Text style={styles.headTitle}>每日打卡</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>连续打卡</Text>
            <View style={styles.streakRow}>
              <Text style={styles.streakNum}>{loading ? '—' : streak}</Text>
              <Text style={styles.streakUnit}>天</Text>
            </View>
            <Text style={styles.heroSub}>累计打卡 {total} 天 · 每次 +{pts} 积分</Text>

            <Pressable
              style={[styles.checkBtn, checked && styles.checkedBtn]}
              onPress={onCheck}
              disabled={busy || checked}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name={checked ? 'checkmark-circle' : 'flame'} size={22} color="#fff" />
                  <Text style={styles.checkText}>{checked ? '今日已打卡' : '打卡签到'}</Text>
                </>
              )}
            </Pressable>
            {!user && <Text style={styles.loginHint}>登录后即可签到赚积分</Text>}
          </View>

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>坚持打卡，攒积分升等级</Text>
            <Text style={styles.tipsBody}>
              每天来知闲打个卡，顺便看看同城的约伴和干货。连续打卡的天数会一直累积，积分可以提升你的等级和称号。
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {justGained > 0 && (
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.gainCard}>
            <Ionicons name="add-circle" size={40} color={Brand.green} />
            <Text style={styles.gainText}>+{justGained} 积分</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg },
  safe: { flex: 1 },
  head: { paddingHorizontal: S.lg, paddingVertical: S.md },
  headTitle: { fontSize: F.title, fontWeight: '800', color: Brand.text },
  content: { padding: S.lg, gap: S.lg },
  hero: {
    backgroundColor: Brand.card,
    borderRadius: R.lg,
    padding: S.xl,
    alignItems: 'center',
    gap: S.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heroLabel: { fontSize: F.body, color: Brand.textSub, fontWeight: '600' },
  streakRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  streakNum: { fontSize: 56, fontWeight: '900', color: Brand.green, lineHeight: 60 },
  streakUnit: { fontSize: F.h2, fontWeight: '800', color: Brand.green, marginBottom: 10 },
  heroSub: { fontSize: F.sub, color: Brand.textSub, marginTop: 2 },
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    backgroundColor: Brand.green,
    borderRadius: R.pill,
    paddingVertical: 14,
    paddingHorizontal: S.xxl,
    marginTop: S.md,
    minWidth: 200,
  },
  checkedBtn: { backgroundColor: Brand.textFaint },
  checkText: { color: '#fff', fontSize: F.body, fontWeight: '800' },
  loginHint: { fontSize: F.small, color: Brand.textSub, marginTop: S.sm },
  tips: { backgroundColor: Brand.greenSoft, borderRadius: R.lg, padding: S.lg, gap: 6 },
  tipsTitle: { fontSize: F.body, fontWeight: '800', color: Brand.greenDark },
  tipsBody: { fontSize: F.sub, color: Brand.text, lineHeight: 22 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gainCard: {
    backgroundColor: '#fff',
    paddingHorizontal: S.xxl,
    paddingVertical: S.xl,
    borderRadius: R.lg,
    alignItems: 'center',
    gap: S.sm,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  gainText: { fontSize: F.title, fontWeight: '900', color: Brand.green },
});
