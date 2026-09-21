// 知闲 · 搜索 (최근 검색 + 인기 검색 + 실제 검색)
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { fetchHotKeywords, searchPosts } from '@/data/api';
import type { Post } from '@/data/seed';

const RECENT_KEY = 'zhixian_recent_search';
const MAX_RECENT = 10;

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [hot, setHot] = useState<string[]>([]);
  const [results, setResults] = useState<Post[] | null>(null); // null = 미검색(브라우즈)
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await AsyncStorage.getItem(RECENT_KEY);
        if (r) setRecent(JSON.parse(r));
      } catch {}
      try {
        setHot(await fetchHotKeywords());
      } catch {}
    })();
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const saveRecent = async (kw: string) => {
    const next = [kw, ...recent.filter((x) => x !== kw)].slice(0, MAX_RECENT);
    setRecent(next);
    try {
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  };

  const doSearch = async (raw?: string) => {
    const kw = (raw ?? q).trim();
    if (!kw) return;
    if (raw != null) setQ(kw);
    setLoading(true);
    setResults([]);
    try {
      const data = await searchPosts(kw);
      setResults(data);
      saveRecent(kw);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearRecent = async () => {
    setRecent([]);
    try {
      await AsyncStorage.removeItem(RECENT_KEY);
    } catch {}
  };

  const resetToBrowse = () => {
    setQ('');
    setResults(null);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.bar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <View style={styles.inputBox}>
            <Ionicons name="search" size={18} color={Brand.textSub} />
            <TextInput
              ref={inputRef}
              value={q}
              onChangeText={(t) => {
                setQ(t);
                if (!t.trim()) setResults(null);
              }}
              onSubmitEditing={() => doSearch()}
              returnKeyType="search"
              placeholder="搜索路线、钓点、关键词"
              placeholderTextColor={Brand.textFaint}
              style={styles.input}
            />
            {q.length > 0 && (
              <Pressable onPress={resetToBrowse} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={Brand.textFaint} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={() => doSearch()} hitSlop={8}>
            <Text style={styles.searchBtn}>搜索</Text>
          </Pressable>
        </View>

        {results !== null ? (
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Brand.green} size="large" />
            </View>
          ) : results.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="search-outline" size={46} color={Brand.textFaint} />
              <Text style={styles.emptyText}>没有找到「{q}」相关内容</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.results}>
              {results.map((p) => (
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
          )
        ) : (
          <ScrollView contentContainerStyle={styles.browse}>
            {recent.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>最近搜索</Text>
                  <Pressable onPress={clearRecent} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={Brand.textSub} />
                  </Pressable>
                </View>
                <View style={styles.chipWrap}>
                  {recent.map((kw) => (
                    <Pressable key={kw} style={styles.chip} onPress={() => doSearch(kw)}>
                      <Text style={styles.chipText}>{kw}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>热门搜索</Text>
              <View style={styles.chipWrap}>
                {hot.map((kw, i) => (
                  <Pressable
                    key={kw}
                    style={[styles.chip, styles.hotChip]}
                    onPress={() => doSearch(kw)}>
                    <Text style={styles.hotRank}>{i + 1}</Text>
                    <Text style={styles.chipText}>{kw}</Text>
                  </Pressable>
                ))}
                {hot.length === 0 && <Text style={styles.meta}>暂无热门</Text>}
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg },
  flex: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    backgroundColor: Brand.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: Brand.bg,
    borderRadius: R.pill,
    paddingHorizontal: S.md,
    height: 40,
  },
  input: { flex: 1, fontSize: F.body, color: Brand.text, paddingVertical: 0 },
  searchBtn: { fontSize: F.body, fontWeight: '700', color: Brand.green },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.md, paddingBottom: 80 },
  emptyText: { fontSize: F.body, color: Brand.textSub },
  results: { padding: S.lg, gap: S.md },
  browse: { padding: S.lg, gap: S.xl },
  section: { gap: S.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: F.sub, fontWeight: '800', color: Brand.text },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Brand.card,
    borderRadius: R.pill,
    paddingHorizontal: S.lg,
    paddingVertical: 8,
  },
  hotChip: { backgroundColor: '#EAF5EE' },
  hotRank: { fontSize: F.small, fontWeight: '800', color: Brand.green },
  chipText: { fontSize: F.small, color: Brand.text, fontWeight: '600' },
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
