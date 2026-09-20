// 루트 레이아웃 — Stack(탭 + 상세 + 발행 + 글쓰기) + 스플래시
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import BrandSplash from '@/components/brand-splash';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="publish" options={{ presentation: 'modal' }} />
        <Stack.Screen name="post-new" />
      </Stack>
      <BrandSplash />
    </>
  );
}
