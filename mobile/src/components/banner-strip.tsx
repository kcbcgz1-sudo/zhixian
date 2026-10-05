// 知闲 · 배너 캐러셀 (메인/카테고리별, 자동 슬라이드)
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand, F, S } from '@/constants/brand';
import { fetchBanners, type Banner } from '@/data/api';

const GUTTER = S.lg;

export default function BannerStrip({ placement }: { placement: string }) {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [idx, setIdx] = useState(0);
  const [w, setW] = useState(Dimensions.get('window').width);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setW(window.width));
    setW(Dimensions.get('window').width);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let alive = true;
    fetchBanners(placement)
      .then((b) => {
        if (alive) {
          setBanners(b);
          setIdx(0);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [placement]);

  // 자동 슬라이드
  useEffect(() => {
    if (banners.length <= 1 || w <= 0) return;
    const t = setInterval(() => {
      setIdx((prev) => {
        const next = (prev + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * w, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [banners.length, w]);

  if (banners.length === 0) return null;

  function onPress(b: Banner) {
    const link = (b.link || '').trim();
    if (!link) return;
    if (/^https?:\/\//i.test(link)) {
      Linking.openURL(link).catch(() => {});
    } else {
      router.push(`/post/${link}` as any);
    }
  }

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (w <= 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / w);
    if (i !== idx) setIdx(i);
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEnabled={banners.length > 1}
      >
        {banners.map((b) => (
          <Pressable key={b.id} onPress={() => onPress(b)} style={{ width: w }}>
            <Image source={{ uri: b.image }} style={[styles.img, { width: w }]} contentFit="cover" />
            {!!b.title && (
              <View style={styles.titleWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  {b.title}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <View key={i} style={[styles.dot, i === idx && styles.dotOn]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: -GUTTER, marginBottom: S.md, overflow: 'hidden' },
  img: { aspectRatio: 2.6, backgroundColor: Brand.greenSoft },
  titleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: S.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  title: { color: '#fff', fontSize: F.small, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: Brand.border },
  dotOn: { backgroundColor: Brand.green, width: 16 },
});
