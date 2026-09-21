// 知闲 · 我的发布 / 我的收藏
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { deletePost, fetchMyFavorites, fetchMyPosts } from '@/data/api';
import { useAuth } from '@/data/auth';
import type { Post } from '@/data/seed';

const STATUS_LABEL: Record<string, string> = { reviewing: '审核中', removed: '已下架' };

export default function MyPostsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const isFav = type === 'fav';
  const [list, setList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setList(isFav ? await fetchMyFavorites() : await fetchMyPosts());
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [user?.id, isFav]);

  function confirmDelete(p: Post) {
    const run = async () => {
      try {
        await deletePost(p.id);
        await load();
      } catch (e: any) {
        Alert.alert('删除失败', String(e?.message ?? '请重试'));
      }
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`确定删除「${p.title}」？此操作不可恢复。`)) run();
      return;
    }
    Alert.alert('删除内容', `确定删除「${p.title}」？不可恢复。`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: run },
    ]);
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{isFav ? '我的收藏' : '我的发布'}</Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {list.map((p) => (
              <View key={p.id} style={styles.card}>
                <Pressable
                  style={styles.cardMain}
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
                      {p.status && STATUS_LABEL[p.status] ? `${STATUS_LABEL[p.status]} · ` : ''}
                      评论 {p.comments} · 赞 {p.likes}
                    </Text>
                  </View>
                </Pressable>
                {!isFav && (
                  <Pressable style={styles.delBtn} onPress={() => confirmDelete(p)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={Brand.danger} />
                  </Pressable>
                )}
              </View>
            ))}
            {list.length === 0 && (
              <Text style={styles.empty}>{isFav ? '还没有收藏的内容' : '还没有发布内容'}</Text>
            )}
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
  content: { padding: S.lg, gap: S.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.card,
    borderRadius: R.lg,
    padding: S.md,
    gap: S.md,
  },
  cardMain: { flex: 1, flexDirection: 'row', gap: S.md, alignItems: 'center' },
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
  delBtn: {
    width: 40,
    height: 40,
    borderRadius: R.md,
    backgroundColor: '#FBE9E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { textAlign: 'center', color: Brand.textSub, marginTop: S.xxl },
});
