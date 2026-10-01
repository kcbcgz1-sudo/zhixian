// 知闲 · 공개 사용자 프로필 (아바타 + 소개 + 작성글 목록, 실명 배지 자리)
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '../(tabs)/index';
import { Brand, F, R, S } from '@/constants/brand';
import { fetchUser, fetchUserPosts, type UserProfile } from '@/data/api';
import { type Post } from '@/data/seed';

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    Promise.all([fetchUser(String(id)), fetchUserPosts(String(id))])
      .then(([u, ps]) => {
        if (alive) {
          setProfile(u);
          setPosts(ps);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.bar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.barTitle} numberOfLines={1}>
            {profile?.nickname ?? '个人主页'}
          </Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : !profile ? (
          <View style={styles.center}>
            <Text style={styles.empty}>用户不存在</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <View style={styles.cardWrap}>
                <PostCard post={item} onPress={() => router.push(`/post/${item.id}` as any)} />
              </View>
            )}
            ListHeaderComponent={
              <View>
                {profile.coverImage ? (
                  <Image source={{ uri: profile.coverImage }} style={styles.cover} contentFit="cover" />
                ) : (
                  <LinearGradient colors={['#CDEBD6', '#A9DCBB']} style={styles.cover} />
                )}
                <View style={styles.avatarWrap}>
                  {profile.avatar ? (
                    <Image source={{ uri: profile.avatar }} style={styles.avatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Ionicons name="person" size={34} color="#fff" />
                    </View>
                  )}
                </View>
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.nick} numberOfLines={1}>
                      {profile.nickname}
                    </Text>
                    {profile.verified ? (
                      <View style={styles.badge}>
                        <Ionicons name="shield-checkmark" size={12} color="#fff" />
                        <Text style={styles.badgeText}>实名</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeOff}>
                        <Text style={styles.badgeOffText}>未实名</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sub} numberOfLines={1}>
                    Lv{profile.level} · {profile.title}
                    {profile.city ? ` · ${profile.city}` : ''}
                  </Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={styles.statNum}>{profile.postCount}</Text>
                  <Text style={styles.statLabel}>发布内容</Text>
                </View>
                <Text style={styles.listTitle}>TA 的内容</Text>
              </View>
            }
            ListEmptyComponent={<Text style={styles.empty}>还没有发布内容</Text>}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: Brand.textSub, textAlign: 'center', marginTop: S.xl },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    backgroundColor: Brand.card,
  },
  barTitle: { flex: 1, textAlign: 'center', fontSize: F.h2, fontWeight: '800', color: Brand.text },
  listContent: { paddingBottom: S.xxl },
  cover: { width: '100%', height: 130 },
  avatarWrap: { paddingHorizontal: S.lg, marginTop: -38 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: Brand.bg,
    backgroundColor: Brand.bg,
  },
  avatarFallback: { backgroundColor: Brand.green, alignItems: 'center', justifyContent: 'center' },
  info: { paddingHorizontal: S.lg, marginTop: S.sm, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nick: { fontSize: 22, fontWeight: '900', color: Brand.text, flexShrink: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Brand.green,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { color: '#fff', fontSize: F.tiny, fontWeight: '800' },
  badgeOff: {
    backgroundColor: '#E7EAEC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeOffText: { color: Brand.textSub, fontSize: F.tiny, fontWeight: '700' },
  sub: { fontSize: F.small, color: Brand.textSub },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: S.lg,
    marginTop: S.md,
  },
  statNum: { fontSize: 18, fontWeight: '900', color: Brand.green },
  statLabel: { fontSize: F.small, color: Brand.textSub },
  listTitle: {
    fontSize: F.body,
    fontWeight: '800',
    color: Brand.text,
    paddingHorizontal: S.lg,
    marginTop: S.lg,
    marginBottom: S.sm,
  },
  cardWrap: { paddingHorizontal: S.lg, marginBottom: S.md },
});
