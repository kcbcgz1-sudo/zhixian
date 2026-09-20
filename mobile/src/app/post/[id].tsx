// 知闲 · 帖子详情(글 상세) — 피그마 4번 화면
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { getPost } from '@/data/seed';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const post = getPost(id ?? '');
  const [liked, setLiked] = useState(true);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        {/* 상단 바 */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Pressable hitSlop={10}>
            <Ionicons name="search" size={24} color={Brand.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* 대표 이미지 */}
          <LinearGradient colors={['#CDEBD6', '#9FD7B4']} style={styles.hero}>
            <Ionicons name="image-outline" size={40} color="#5FA277" />
            {post?.aiImage && (
              <View style={styles.aiTag}>
                <Text style={styles.aiTagText}>AI生成</Text>
              </View>
            )}
          </LinearGradient>

          <Text style={styles.title}>{post?.title ?? '内容不存在'}</Text>
          {post?.date && <Text style={styles.date}>{post.date}</Text>}
          {post?.body && <Text style={styles.body}>{post.body}</Text>}
        </ScrollView>

        {/* 하단 액션 바 */}
        <View style={styles.actions}>
          <Pressable style={styles.actionLeft} hitSlop={8}>
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.card },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
  },
  content: { paddingHorizontal: S.lg, paddingBottom: S.xl },
  hero: {
    height: 300,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
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
  actionLeft: {},
  actionRight: { flexDirection: 'row', alignItems: 'center', gap: S.xl },
});
