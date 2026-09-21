// 知闲 · 收藏 — 실제 즐겨찾기 목록(하단 ♡ 탭)
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { fetchMyFavorites } from '@/data/api';
import { useAuth } from '@/data/auth';
import type { Post } from '@/data/seed';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        if (!user) {
          if (alive) {
            setList([]);
            setLoading(false);
          }
          return;
        }
        if (alive) setLoading(true);
        try {
          const data = await fetchMyFavorites();
          if (alive) setList(data);
        } catch {
          if (alive) setList([]);
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, [user?.id])
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <Text style={styles.header}>收藏</Text>

        {!user ? (
          <View style={styles.center}>
            <Ionicons name="bookmark-outline" size={52} color={Brand.textFaint} />
            <Text style={styles.loginMsg}>登录后查看收藏</Text>
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
            <Ionicons name="bookmark-outline" size={52} color={Brand.textFaint} />
            <Text style={styles.emptyText}>还没有收藏的干货</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {list.map((p) => (
              <Pressable
                key={p.id}
                style={styles.card}
                onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })}>
                {p.cover ? (
                  <Image source={{ uri: p.cover }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <LinearGradient colors={['#CDEBD6', '#A9DCBB']} style={styles.thumb}>
                    <Ionicons name="image-outline" size={22} color="#5FA277" />
                  </LinearGradient>
                )}
                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={2}>
                    {p.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    评论 {p.comments} · 赞 {p.likes}
                  </Text>
                </View>
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
  header: { fontSize: F.title, fontWeight: '800', color: Brand.text, padding: S.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.md },
  loginMsg: { fontSize: F.body, color: Brand.textSub },
  loginBtn: {
    backgroundColor: Brand.green,
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    borderRadius: R.pill,
    marginTop: S.sm,
  },
  loginBtnText: { color: '#fff', fontSize: F.body, fontWeight: '700' },
  emptyText: { fontSize: F.body, color: Brand.textSub },
  content: { padding: S.lg, gap: S.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.card,
    borderRadius: R.lg,
    padding: S.md,
    gap: S.md,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.bg,
  },
  info: { flex: 1, gap: 4 },
  title: { fontSize: F.body, fontWeight: '700', color: Brand.text, lineHeight: 20 },
  meta: { fontSize: F.small, color: Brand.textSub },
});
