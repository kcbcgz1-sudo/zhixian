// 知闲 · 我的关注 (내가 팔로우한 사람 목록)
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { chatWith, getMyFollowing, type UserCard } from '@/data/api';
import { useAuth } from '@/data/auth';

export default function FollowingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setList(await getMyFollowing());
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

  async function onDm(u: UserCard) {
    try {
      const r = await chatWith(u.id);
      router.push(`/chat/${r.conversationId}` as any);
    } catch (e: any) {
      const m = String(e?.message ?? '操作失败');
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(m);
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.bar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.barTitle}>我的关注</Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : list.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={48} color={Brand.textFaint} />
            <Text style={styles.hint}>还没有关注的人</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {list.map((u) => (
              <Pressable key={u.id} style={styles.row} onPress={() => router.push(`/user/${u.id}` as any)}>
                {u.avatar ? (
                  <Image source={{ uri: u.avatar }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Ionicons name="person" size={20} color="#fff" />
                  </View>
                )}
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {u.nickname}
                    </Text>
                    {u.verified && (
                      <View style={styles.vBadge}>
                        <Ionicons name="shield-checkmark" size={11} color="#fff" />
                        <Text style={styles.vBadgeText}>实名</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sub}>Lv{u.level}</Text>
                </View>
                <Pressable style={styles.dmBtn} onPress={() => onDm(u)} hitSlop={6}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={Brand.green} />
                  <Text style={styles.dmText}>私信</Text>
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.md },
  hint: { fontSize: F.body, color: Brand.textSub },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    backgroundColor: Brand.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  barTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
  content: { padding: S.lg, gap: S.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: Brand.card,
    borderRadius: R.lg,
    padding: S.md,
  },
  avatar: { width: 44, height: 44, borderRadius: 999, backgroundColor: Brand.bg },
  avatarFallback: { backgroundColor: Brand.green, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  name: { fontSize: F.body, fontWeight: '700', color: Brand.text, flexShrink: 1 },
  vBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Brand.green,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  vBadgeText: { color: '#fff', fontSize: F.tiny, fontWeight: '800' },
  sub: { fontSize: F.small, color: Brand.textSub },
  dmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Brand.greenSoft,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 7,
  },
  dmText: { color: Brand.green, fontWeight: '800', fontSize: F.small },
});
