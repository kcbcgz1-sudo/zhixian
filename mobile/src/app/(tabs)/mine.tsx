// 知闲 · 我的(프로필) — 피그마 3번 화면
// 디자인의 레이아웃(초록 그라데이션 헤더 + 겹친 아바타 + 라벨 필드 + 하단 2버튼)은 유지하고,
// 내용은 电商 템플릿 대신 知闲에 맞게 교체(배송지/결제 → 도시/발행/수집).
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';

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
  return (
    <View style={styles.container}>
      {/* 초록 그라데이션 헤더 */}
      <LinearGradient colors={[Brand.greenDeep, Brand.green]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerBar}>
            <View style={{ width: 26 }} />
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* 아바타 (헤더/본문 사이에 겹침) */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={44} color={Brand.green} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Field label="用户名" value="未登录用户" />
        <Field label="邮箱" value="—" />
        <Field label="所在城市" value="广州" />

        <View style={styles.stats}>
          {[
            { label: '积分', value: '0' },
            { label: '段位', value: 'Lv.1' },
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

        <View style={styles.buttons}>
          <Pressable style={styles.btnDark}>
            <Text style={styles.btnDarkText}>编辑资料</Text>
            <Ionicons name="create-outline" size={18} color="#fff" />
          </Pressable>
          <Pressable style={styles.btnOutline}>
            <Text style={styles.btnOutlineText}>退出登录</Text>
            <Ionicons name="log-out-outline" size={18} color={Brand.text} />
          </Pressable>
        </View>
      </ScrollView>
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
  body: { paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: 120, gap: S.md },
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

  buttons: { flexDirection: 'row', gap: S.md, marginTop: S.lg },
  btnDark: {
    flex: 1,
    flexDirection: 'row',
    gap: S.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A322E',
    height: 52,
    borderRadius: R.md,
  },
  btnDarkText: { color: '#fff', fontSize: F.body, fontWeight: '700' },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    gap: S.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Brand.green,
    height: 52,
    borderRadius: R.md,
  },
  btnOutlineText: { color: Brand.text, fontSize: F.body, fontWeight: '700' },
});
