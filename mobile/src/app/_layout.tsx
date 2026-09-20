// 루트 레이아웃 — Stack(탭 그룹 + 상세 + 발행) + 스플래시 오버레이
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
      </Stack>
      <BrandSplash />
    </>
  );
}
