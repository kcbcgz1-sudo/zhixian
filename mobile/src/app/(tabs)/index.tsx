// 知闲 · 情报流(홈) — 커버 이미지 + 간략설명 + 태그 + 포커스 새로고침
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { fetchPosts } from '@/data/api';
import { FILTERS, type Category, type Post } from '@/data/seed';

export default function HomeScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPosts(await fetchPosts(filter));
    } catch {
      setError('加载失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={Brand.textSub} />
          <Text style={styles.location}>广州</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}>
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
                <Text style={[styles.chipText, { color: active ? '#fff' : Brand.text }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={Brand.textSub} />
            <TextInput
              placeholder="Search"
              placeholderTextColor={Brand.textFaint}
              style={styles.searchInput}
            />
          </View>
          <Pressable style={styles.filterBtn}>
            <Ionicons name="options-outline" size={22} color="#fff" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryText}>重试</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
              />
            ))}
            {posts.length === 0 && <Text style={styles.empty}>暂无内容，来发布第一条干货吧</Text>}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function PostCard({ post, onPress }: { post: Post; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {post.cover ? (
        <Image source={{ uri: post.cover }} style={styles.thumb} contentFit="cover" />
      ) : (
        <LinearGradient colors={['#CDEBD6', '#A9DCBB']} style={styles.thumb}>
          <Ionicons name="image-outline" size={26} color="#5FA277" />
        </LinearGradient>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {post.title}
        </Text>
        {post.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={2}>
            {post.excerpt}
          </Text>
        ) : null}
        {post.tags.length > 0 ? (
          <Text style={styles.tags} numberOfLines={1}>
            {post.tags.join('  ')}
          </Text>
        ) : null}
        <Text style={styles.author} numberOfLines={1}>
          {post.district ? `${post.district} · ` : ''}
          {post.author}
          {post.authorTitle ? <Text style={styles.authorTitle}>{`  「${post.authorTitle}」`}</Text> : null}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="chatbubble-outline" size={16} color={Brand.textSub} />
            <Text style={styles.metaText}>{post.comments}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="heart-outline" size={16} color={Brand.textSub} />
            <Text style={styles.metaText}>{post.likes}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg },
  safe: { flex: 1, paddingHorizontal: S.lg },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: S.sm },
  location: { fontSize: F.sub, color: Brand.textSub, fontWeight: '600' },
  chipsRow: { marginTop: S.md, flexGrow: 0 },
  chipsContent: { gap: S.sm, paddingRight: S.lg },
  chip: { paddingHorizontal: S.xl, paddingVertical: S.sm, borderRadius: R.pill },
  chipActive: { backgroundColor: Brand.green },
  chipIdle: { backgroundColor: '#E7EAEC' },
  chipText: { fontSize: F.body, fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: S.md, marginTop: S.md },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: Brand.card,
    borderRadius: R.lg,
    paddingHorizontal: S.lg,
    height: 52,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: F.body, color: Brand.text },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: R.lg,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.md },
  errorText: { fontSize: F.body, color: Brand.textSub },
  retryBtn: { paddingHorizontal: S.xl, paddingVertical: S.sm, backgroundColor: Brand.green, borderRadius: R.pill },
  retryText: { color: '#fff', fontSize: F.body, fontWeight: '700' },
  listContent: { paddingTop: S.lg, paddingBottom: 100, gap: S.md },
  card: {
    flexDirection: 'row',
    gap: S.md,
    backgroundColor: Brand.card,
    borderRadius: R.lg,
    padding: S.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  thumb: { width: 104, height: 104, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.bg },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: F.body, fontWeight: '800', color: Brand.text, lineHeight: 22 },
  excerpt: { fontSize: F.small, color: Brand.textSub, lineHeight: 18 },
  tags: { fontSize: F.tiny, color: Brand.green, fontWeight: '600' },
  author: { fontSize: F.tiny, color: Brand.textSub, marginTop: 2 },
  authorTitle: { color: Brand.textFaint },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: S.lg, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: F.tiny, color: Brand.textSub, fontWeight: '600' },
  empty: { textAlign: 'center', color: Brand.textSub, marginTop: S.xxl },
});
