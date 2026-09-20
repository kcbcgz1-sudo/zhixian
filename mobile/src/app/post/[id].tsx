// 知闲 · 帖子详情 — 서버 연동 + 이미지/동영상 표시
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { fetchPost } from '@/data/api';
import type { Post } from '@/data/seed';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await fetchPost(id ?? '');
        if (alive) setPost(p);
      } catch {
        if (alive) setPost(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const media = post?.media ?? [];
  const images = media.filter((m) => m.type === 'image');
  const videoUri = media.find((m) => m.type === 'video')?.url ?? null;
  const player = useVideoPlayer(videoUri, (p: any) => {
    p.loop = false;
  });

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Pressable hitSlop={10}>
            <Ionicons name="search" size={24} color={Brand.text} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {/* 미디어 */}
              {videoUri ? (
                <VideoView player={player} style={styles.hero} contentFit="cover" nativeControls />
              ) : images.length > 0 ? (
                <Image source={{ uri: images[0].url }} style={styles.hero} contentFit="cover" />
              ) : (
                <LinearGradient colors={['#CDEBD6', '#9FD7B4']} style={styles.hero}>
                  <Ionicons name="image-outline" size={40} color="#5FA277" />
                  {post?.aiImage && (
                    <View style={styles.aiTag}>
                      <Text style={styles.aiTagText}>AI生成</Text>
                    </View>
                  )}
                </LinearGradient>
              )}

              {/* 추가 이미지 */}
              {images.slice(videoUri ? 0 : 1).map((img, i) => (
                <Image key={i} source={{ uri: img.url }} style={styles.subImg} contentFit="cover" />
              ))}

              <Text style={styles.title}>{post?.title ?? '内容不存在'}</Text>
              {post?.date ? <Text style={styles.date}>{post.date}</Text> : null}
              {post?.body ? <Text style={styles.body}>{post.body}</Text> : null}
            </ScrollView>

            <View style={styles.actions}>
              <Pressable hitSlop={8}>
                <Ionicons name="ban-outline" size={26} color={Brand.textSub} />
              </Pressable>
              <View style={styles.actionRight}>
                <Pressable onPress={() => setLiked((v) => !v)} hitSlop={8}>
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={28}
                    color={liked ? Brand.green : Brand.textSub}
                  />
                </Pressable>
                <Pressable hitSlop={8}>
                  <Ionicons name="share-social-outline" size={26} color={Brand.textSub} />
                </Pressable>
              </View>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.card },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
  },
  content: { paddingHorizontal: S.lg, paddingBottom: S.xl },
  hero: {
    width: '100%',
    height: 300,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  subImg: { width: '100%', height: 240, borderRadius: R.md, marginTop: S.md, backgroundColor: Brand.bg },
  aiTag: {
    position: 'absolute',
    right: S.sm,
    bottom: S.sm,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: S.sm,
    paddingVertical: 2,
    borderRadius: R.sm,
  },
  aiTagText: { color: '#fff', fontSize: F.tiny },
  title: { fontSize: F.h2, fontWeight: '800', color: Brand.text, marginTop: S.lg, lineHeight: 26 },
  date: { fontSize: F.small, color: Brand.textSub, marginTop: S.sm },
  body: { fontSize: F.body, color: '#3A3D42', lineHeight: 28, marginTop: S.lg },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  actionRight: { flexDirection: 'row', alignItems: 'center', gap: S.xl },
});
