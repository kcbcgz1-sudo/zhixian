// 知闲 · 管理后台 · 用户管理
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import {
  adminUserBan,
  adminUsers,
  adminUserSetLevel,
  adminUserUnban,
  type AdminUser,
} from '@/data/api';
import { useAuth } from '@/data/auth';

export default function AdminUsersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setList(await adminUsers());
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
    } catch {
      Alert.alert('操作失败', '请重试');
    }
  }

  function changeLevel(u: AdminUser, next: number) {
    const lv = Math.max(1, Math.min(10, next));
    if (lv === u.level) return;
    act(() => adminUserSetLevel(u.id, lv));
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.headerTitle}>用户管理</Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {list.map((u) => {
              const banned = u.status === 'banned';
              const isAdmin = u.role === 'admin';
              return (
                <View key={u.id} style={styles.card}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={22} color={Brand.green} />
                  </View>
                  <View style={styles.info}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>
                        {u.nickname}
                      </Text>
                      {isAdmin && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>管理员</Text>
                        </View>
                      )}
                      {banned && (
                        <View style={styles.banBadge}>
                          <Text style={styles.banBadgeText}>已封禁</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.sub} numberOfLines={1}>
                      {u.username ?? '—'} · 帖 {u.posts} · 积分 {u.points}
                    </Text>
                    <View style={styles.lvRow}>
                      <Text style={styles.lvLabel}>等级</Text>
                      <Pressable style={styles.lvBtn} onPress={() => changeLevel(u, u.level - 1)} hitSlop={6}>
                        <Text style={styles.lvBtnText}>−</Text>
                      </Pressable>
                      <Text style={styles.lvText}>Lv{u.level}</Text>
                      <Pressable style={styles.lvBtn} onPress={() => changeLevel(u, u.level + 1)} hitSlop={6}>
                        <Text style={styles.lvBtnText}>＋</Text>
                      </Pressable>
                    </View>
                  </View>
                  {!isAdmin &&
                    (banned ? (
                      <Pressable style={[styles.btn, styles.btnGreen]} onPress={() => act(() => adminUserUnban(u.id))}>
                        <Text style={styles.btnGreenText}>解封</Text>
                      </Pressable>
                    ) : (
                      <Pressable style={[styles.btn, styles.btnRed]} onPress={() => act(() => adminUserBan(u.id))}>
                        <Text style={styles.btnRedText}>封禁</Text>
                      </Pressable>
                    ))}
                </View>
              );
            })}
            {list.length === 0 && <Text style={styles.empty}>暂无用户</Text>}
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
  content: { padding: S.lg, gap: S.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: Brand.card, borderRadius: R.lg, padding: S.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: Brand.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  name: { fontSize: F.body, fontWeight: '700', color: Brand.text, flexShrink: 1 },
  adminBadge: { backgroundColor: Brand.green, borderRadius: R.sm, paddingHorizontal: 6, paddingVertical: 1 },
  adminBadgeText: { color: '#fff', fontSize: F.tiny, fontWeight: '700' },
  banBadge: { backgroundColor: '#F3D9D2', borderRadius: R.sm, paddingHorizontal: 6, paddingVertical: 1 },
  banBadgeText: { color: Brand.danger, fontSize: F.tiny, fontWeight: '700' },
  sub: { fontSize: F.small, color: Brand.textSub },
  lvRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: 4 },
  lvLabel: { fontSize: F.tiny, color: Brand.textSub },
  lvBtn: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: Brand.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lvBtnText: { fontSize: 18, fontWeight: '800', color: Brand.greenDeep, lineHeight: 20 },
  lvText: { fontSize: F.small, fontWeight: '800', color: Brand.text, minWidth: 36, textAlign: 'center' },
  btn: { paddingHorizontal: S.lg, paddingVertical: S.sm, borderRadius: R.md },
  btnGreen: { backgroundColor: Brand.green },
  btnGreenText: { color: '#fff', fontWeight: '700', fontSize: F.small },
  btnRed: { backgroundColor: '#FBE9E7' },
  btnRedText: { color: Brand.danger, fontWeight: '700', fontSize: F.small },
  empty: { textAlign: 'center', color: Brand.textSub, marginTop: S.xxl },
});
