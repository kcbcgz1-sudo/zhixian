// 知闲 · 发布(발행 선택) — 모달
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';

export default function PublishScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View style={styles.bar}>
          <Text style={styles.title}>发布</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={26} color={Brand.text} />
          </Pressable>
        </View>

        <View style={styles.options}>
          {/* 구조화 발제(메인) → 글쓰기 폼 */}
          <Pressable
            style={[styles.card, styles.cardPrimary]}
            onPress={() => router.replace('/post-new' as any)}>
            <View style={styles.cardIcon}>
              <Ionicons name="document-text-outline" size={28} color="#fff" />
            </View>
            <View style={styles.cardTextWrap}>
              <View style={styles.titleLine}>
                <Text style={styles.cardTitle}>结构化发布</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>推荐</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>按模板填写钓点/线路参数，可评干货、赚积分、上首页</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Brand.textFaint} />
          </Pressable>

          {/* 随手记(경량) — 추후 */}
          <Pressable style={styles.card} onPress={() => Alert.alert('随手记', '即将上线')}>
            <View style={[styles.cardIcon, { backgroundColor: Brand.textFaint }]}>
              <Ionicons name="camera-outline" size={28} color="#fff" />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>随手记</Text>
              <Text style={styles.cardDesc}>图 + 一句话，随手分享（不计干货/积分）</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Brand.textFaint} />
          </Pressable>
        </View>
      </SafeAreaView>
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
  },
  title: { fontSize: F.title, fontWeight: '800', color: Brand.text },
  options: { padding: S.lg, gap: S.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.lg,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  cardPrimary: { borderColor: Brand.green, backgroundColor: Brand.greenSoft },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: R.md,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: { flex: 1, gap: 4 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  cardTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
  badge: { backgroundColor: Brand.green, borderRadius: R.sm, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { color: '#fff', fontSize: F.tiny, fontWeight: '700' },
  cardDesc: { fontSize: F.small, color: Brand.textSub, lineHeight: 18 },
});
