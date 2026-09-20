// 知闲 · 我的(프로필) — 로그인 상태 반영
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { useAuth } from '@/data/auth';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}
function Row({ label }: { label: string }) {
  return (
    <Pressable style={styles.row}>
      <Text style={styles.rowText}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={Brand.textFaint} />
    </Pressable>
  );
}

export default function MineScreen() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Brand.greenDeep, Brand.green]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerBar}>
            <View style={{ width: 26 }} />
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={44} color={Brand.green} />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Brand.green} size="large" />
        </View>
      ) : !user ? (
        // 미로그인
        <View style={styles.body}>
          <Text style={styles.guestTitle}>未登录</Text>
          <Text style={styles.guestSub}>登录后可发布干货、赚积分、解段位</Text>
          <View style={styles.authBtns}>
            <Pressable style={styles.btnPrimary} onPress={() => router.push('/login' as any)}>
              <Text style={styles.btnPrimaryText}>登录</Text>
            </Pressable>
            <Pressable style={styles.btnOutline} onPress={() => router.push('/register' as any)}>
              <Text style={styles.btnOutlineText}>注册</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        // 로그인 상태
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Field label="昵称" value={user.nickname} />
          <Field label="用户名" value={user.username ?? '—'} />
          <Field label="邮箱" value={user.email ?? '—'} />
          <Field label="所在城市" value={user.city} />

          <View style={styles.stats}>
            {[
              { label: '积分', value: String(user.points) },
              { label: '段位', value: `Lv.${user.level}` },
              { label: '干货帖', value: '0' },
            ].map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.rows}>
            <Row label="我的发布" />
            <Row label="我的收藏" />
            <Row label="适老化设置" />
            <Row label="关于知闲" />
          </View>

          <Pressable style={styles.logout} onPress={logout}>
            <Text style={styles.logoutText}>退出登录</Text>
            <Ionicons name="log-out-outline" size={18} color={Brand.text} />
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const AVATAR = 88;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.card },
  header: { height: 150, borderBottomLeftRadius: R.xl, borderBottomRightRadius: R.xl },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingTop: S.sm,
  },
  avatarWrap: { alignItems: 'center', marginTop: -AVATAR / 2 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: R.lg,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: S.xxl },
  body: { paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: 120, gap: S.md },

  guestTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text, textAlign: 'center', marginTop: S.sm },
  guestSub: { fontSize: F.sub, color: Brand.textSub, textAlign: 'center' },
  authBtns: { flexDirection: 'row', gap: S.md, marginTop: S.lg },
  btnPrimary: {
    flex: 1,
    backgroundColor: Brand.green,
    height: 52,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: '#fff', fontSize: F.body, fontWeight: '800' },
  btnOutline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Brand.green,
    height: 52,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: { color: Brand.green, fontSize: F.body, fontWeight: '800' },

  field: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    paddingHorizontal: S.lg,
    paddingTop: 18,
    paddingBottom: 12,
  },
  fieldLabel: {
    position: 'absolute',
    top: -9,
    left: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    fontSize: F.small,
    color: Brand.textSub,
  },
  fieldValue: { fontSize: F.body, color: Brand.text, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: S.md, marginTop: S.xs },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Brand.greenSoft,
    borderRadius: R.md,
    paddingVertical: S.md,
    gap: 2,
  },
  statValue: { fontSize: F.h2, fontWeight: '800', color: Brand.greenDark },
  statLabel: { fontSize: F.small, color: Brand.textSub },
  rows: { marginTop: S.sm, borderWidth: 1, borderColor: Brand.border, borderRadius: R.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
  },
  rowText: { fontSize: F.body, color: Brand.text },
  logout: {
    flexDirection: 'row',
    gap: S.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Brand.border,
    height: 52,
    borderRadius: R.md,
    marginTop: S.md,
  },
  logoutText: { color: Brand.text, fontSize: F.body, fontWeight: '700' },
});
