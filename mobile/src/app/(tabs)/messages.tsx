// 知闲 · 消息 (앱 내 알림함)
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { fetchNotifications, notifMarkAll, notifMarkRead, type AppNotification } from '@/data/api';
import { useAuth } from '@/data/auth';

const ICON: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  welcome: { name: 'gift-outline', color: Brand.green },
  like: { name: 'heart', color: '#E8604C' },
  favorite: { name: 'bookmark', color: Brand.green },
  comment: { name: 'chatbubble-ellipses-outline', color: '#3A82F7' },
  quality: { name: 'ribbon-outline', color: '#D19A00' },
  levelup: { name: 'trending-up-outline', color: Brand.green },
  dm: { name: 'mail-outline', color: '#3A82F7' },
  admin: { name: 'megaphone-outline', color: '#D19A00' },
};

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setList(await fetchNotifications());
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onTap(n: AppNotification) {
    if (!n.read) {
      setList((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      notifMarkRead(n.id).catch(() => {});
    }
    if (n.postId) router.push({ pathname: '/post/[id]', params: { id: n.postId } });
  }

  async function markAll() {
    setList((prev) => prev.map((x) => ({ ...x, read: true })));
    try {
      await notifMarkAll();
    } catch {}
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>消息</Text>
          {!!user && list.some((n) => !n.read) && (
            <Pressable onPress={markAll} hitSlop={8}>
              <Text style={styles.readAll}>全部已读</Text>
            </Pressable>
          )}
        </View>

        {!user ? (
          <View style={styles.center}>
            <Ionicons name="notifications-outline" size={48} color={Brand.textFaint} />
            <Text style={styles.hint}>登录后查看消息</Text>
            <Pressable style={styles.loginBtn} onPress={() => router.push('/login' as any)}>
              <Text style={styles.loginBtnText}>去登录</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : list.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="notifications-outline" size={48} color={Brand.textFaint} />
            <Text style={styles.hint}>还没有消息</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {list.map((n) => {
              const ic = ICON[n.type] ?? { name: 'notifications-outline' as const, color: Brand.textSub };
              return (
                <Pressable key={n.id} style={styles.row} onPress={() => onTap(n)}>
                  <View style={[styles.iconWrap, { backgroundColor: ic.color + '1A' }]}>
                    <Ionicons name={ic.name} size={20} color={ic.color} />
                  </View>
                  <View style={styles.body}>
                    {!!n.title && <Text style={styles.title}>{n.title}</Text>}
                    <Text style={styles.text}>{n.body}</Text>
                    <Text style={styles.date}>{n.date}</Text>
                  </View>
                  {!n.read && <View style={styles.dot} />}
                </Pressable>
              );
            })}
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
  headerTitle: { fontSize: F.title, fontWeight: '800', color: Brand.text },
  readAll: { fontSize: F.small, color: Brand.green, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.md },
  hint: { fontSize: F.body, color: Brand.textSub },
  loginBtn: { backgroundColor: Brand.green, paddingHorizontal: S.xl, paddingVertical: S.md, borderRadius: R.pill, marginTop: S.sm },
  loginBtnText: { color: '#fff', fontSize: F.body, fontWeight: '700' },
  content: { padding: S.lg, gap: S.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: Brand.card,
    borderRadius: R.lg,
    padding: S.md,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  title: { fontSize: F.body, fontWeight: '800', color: Brand.text },
  text: { fontSize: F.small, color: Brand.text, lineHeight: 19 },
  date: { fontSize: F.tiny, color: Brand.textFaint, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#E8604C' },
});
