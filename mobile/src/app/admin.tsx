// 知闲 · 管理后台(대시보드)
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { adminStats, type AdminStats } from '@/data/api';
import { useAuth } from '@/data/auth';

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setLoading(true);
        try {
          const s = await adminStats();
          if (alive) setStats(s);
        } catch {
          if (alive) setStats(null);
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  if (user && user.role !== 'admin') {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.flex}>
          <Header onBack={() => router.back()} />
          <View style={styles.center}>
            <Text style={styles.noPerm}>无管理员权限</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const cards = [
    { label: '用户', value: stats?.users, icon: 'people-outline' as const },
    { label: '内容', value: stats?.posts, icon: 'document-text-outline' as const },
    { label: '今日发布', value: stats?.postsToday, icon: 'today-outline' as const },
    { label: '已下架', value: stats?.removed, icon: 'remove-circle-outline' as const },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <Header onBack={() => router.back()} />
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.grid}>
              {cards.map((c) => (
                <View key={c.label} style={styles.card}>
                  <Ionicons name={c.icon} size={22} color={Brand.green} />
                  <Text style={styles.cardValue}>{c.value ?? '-'}</Text>
                  <Text style={styles.cardLabel}>{c.label}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.nav} onPress={() => router.push('/admin-posts' as any)}>
              <Ionicons name="document-text-outline" size={24} color={Brand.text} />
              <Text style={styles.navText}>内容管理</Text>
              <Text style={styles.navSub}>下架 / 恢复 / 删除</Text>
              <Ionicons name="chevron-forward" size={22} color={Brand.textFaint} />
            </Pressable>
            <Pressable style={styles.nav} onPress={() => router.push('/admin-categories' as any)}>
              <Ionicons name="pricetags-outline" size={24} color={Brand.text} />
              <Text style={styles.navText}>分类管理</Text>
              <Text style={styles.navSub}>新增 / 排序 / 权限</Text>
              <Ionicons name="chevron-forward" size={22} color={Brand.textFaint} />
            </Pressable>
            <Pressable style={styles.nav} onPress={() => router.push('/admin-users' as any)}>
              <Ionicons name="people-outline" size={24} color={Brand.text} />
              <Text style={styles.navText}>用户管理</Text>
              <Text style={styles.navSub}>封禁 / 解封</Text>
              <Ionicons name="chevron-forward" size={22} color={Brand.textFaint} />
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10}>
        <Ionicons name="arrow-back" size={26} color={Brand.text} />
      </Pressable>
      <Text style={styles.headerTitle}>管理后台</Text>
      <View style={{ width: 26 }} />
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
  noPerm: { fontSize: F.body, color: Brand.textSub },
  content: { padding: S.lg, gap: S.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  card: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: Brand.card,
    borderRadius: R.lg,
    padding: S.lg,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardValue: { fontSize: 28, fontWeight: '800', color: Brand.text },
  cardLabel: { fontSize: F.small, color: Brand.textSub },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: Brand.card,
    borderRadius: R.lg,
    padding: S.lg,
    marginTop: S.xs,
  },
  navText: { fontSize: F.h2, fontWeight: '700', color: Brand.text },
  navSub: { flex: 1, fontSize: F.small, color: Brand.textSub },
});
