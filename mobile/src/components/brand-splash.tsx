// 知闲 · 스플래시 인트로 (피그마 2번 화면)
// 앱 시작 시 초록 그라데이션 + 로고 + 문구를 잠깐 보여주고 페이드아웃.
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

import { Brand, F } from '@/constants/brand';

export default function BrandSplash() {
  const [gone, setGone] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setGone(true));
    }, 1800);
    return () => clearTimeout(t);
  }, [opacity]);

  if (gone) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.wrap, { opacity }]} pointerEvents="none">
      <LinearGradient
        colors={['#EAF9EF', '#A9E5BF', Brand.green]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.headline}>辛苦了，该放松一下了！</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  logo: { width: 240, height: 240 },
  headline: { fontSize: 22, fontWeight: '800', color: '#123B22' },
});
