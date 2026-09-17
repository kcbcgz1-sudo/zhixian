// 知闲 · 情报流(홈) 화면 — P4
// 광저우 낚시/등산 干货 정보 피드. 지금은 시드(더미) 데이터로 화면을 확인하고,
// 나중에 백엔드(NestJS) API로 교체합니다.
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 垂类(버티컬) 정의 — MVP는 낚시 + 등산
type Category = 'fishing' | 'hiking';
const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'fishing', label: '钓鱼' },
  { key: 'hiking', label: '登山徒步' },
];

// 干货 帖(게시글) 시드 데이터 — 데이터 모델의 posts 구조를 단순화한 형태
type Post = {
  id: string;
  category: Category;
  title: string;
  district: string; // 구/지역
  tags: string[]; // 핵심 구조화 태그(카드에 노출)
  author: string;
  authorTitle: string; // 称号
  favorites: number;
  isQuality: boolean; // 干货 인증 여부
};

const SEED_POSTS: Post[] = [
  {
    id: '1',
    category: 'fishing',
    title: '从化流溪河水库野钓实测：鲮鱼上货快，免费好停车',
    district: '从化',
    tags: ['免费', '水库', '鲮鱼·罗非', '有停车', '中老年友好'],
    author: '老陈',
    authorTitle: '江河钓客',
    favorites: 128,
    isQuality: true,
  },
  {
    id: '2',
    category: 'fishing',
    title: '增城挂绿湖黑坑避坑：收费偏贵，工作日更划算',
    district: '增城',
    tags: ['收费', '黑坑', '草鱼', '避坑提醒'],
    author: '珠江钓叟',
    authorTitle: '溪畔闲钓',
    favorites: 76,
    isQuality: true,
  },
  {
    id: '3',
    category: 'hiking',
    title: '白云山摩星岭轻松线：8km缓坡，补给点多，适合慢走',
    district: '白云区',
    tags: ['适中', '8km', '爬升400m', '有补给', '公交直达'],
    author: '云山客',
    authorTitle: '青山闲步',
    favorites: 203,
    isQuality: true,
  },
];

export default function HomeScreen() {
  const theme = useTheme();
  const [category, setCategory] = useState<Category>('fishing');

  // 선택된 버티컬의 글만 필터링
  const posts = useMemo(
    () => SEED_POSTS.filter((p) => p.category === category),
    [category]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* 상단 헤더: 앱 이름 + 도시 */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.brand}>
            知闲
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.cityChip}>
            <ThemedText type="small">📍 广州</ThemedText>
          </ThemedView>
        </View>
        <ThemedText themeColor="textSecondary" style={styles.slogan}>
          退休不褪色，玩好后半生 · 同龄人实测
        </ThemedText>

        {/* 垂类 전환 탭 */}
        <View style={styles.tabRow}>
          {CATEGORIES.map((c) => {
            const active = c.key === category;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active
                      ? theme.text
                      : theme.backgroundElement,
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.tabText,
                    { color: active ? theme.background : theme.text },
                  ]}>
                  {c.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* 干货 정보 피드 */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {posts.map((post) => (
            <ThemedView key={post.id} type="backgroundElement" style={styles.card}>
              {/* 실사진 자리(지금은 색 블록) */}
              <View
                style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText themeColor="textSecondary" type="small">
                  实拍图
                </ThemedText>
                {post.isQuality && (
                  <View style={styles.qualityBadge}>
                    <ThemedText style={styles.qualityText}>干货</ThemedText>
                  </View>
                )}
              </View>

              {/* 제목 */}
              <ThemedText type="subtitle" style={styles.cardTitle}>
                {post.title}
              </ThemedText>

              {/* 핵심 구조화 태그 */}
              <View style={styles.tagRow}>
                {post.tags.map((t) => (
                  <View
                    key={t}
                    style={[styles.tag, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="small" style={styles.tagText}>
                      {t}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* 작성자 + 收藏 수 */}
              <View style={styles.metaRow}>
                <ThemedText themeColor="textSecondary" type="small">
                  {post.district} · {post.author}
                  <ThemedText type="small"> 「{post.authorTitle}」</ThemedText>
                </ThemedText>
                <ThemedText themeColor="textSecondary" type="small">
                  ☆ {post.favorites}
                </ThemedText>
              </View>
            </ThemedView>
          ))}

          {posts.length === 0 && (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              暂无内容，来发布第一条干货吧
            </ThemedText>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.three },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  brand: { fontSize: 30, fontWeight: '800' },
  cityChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  slogan: { marginTop: Spacing.half, fontSize: 15 },
  tabRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three },
  tab: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  tabText: { fontSize: 17, fontWeight: '700' },
  list: { flex: 1, marginTop: Spacing.three },
  listContent: { gap: Spacing.three, paddingBottom: Spacing.six },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  thumb: {
    height: 160,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    backgroundColor: '#E8552D',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
  },
  qualityText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  cardTitle: { fontSize: 19, lineHeight: 26 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
  },
  tagText: { fontSize: 13 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.half,
  },
  empty: { textAlign: 'center', marginTop: Spacing.six },
});
