// 루트 레이아웃 — AuthProvider + Stack(탭/상세/발행/글쓰기/로그인/가입) + 스플래시
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import BrandSplash from '@/components/brand-splash';
import { AuthProvider } from '@/data/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="publish" options={{ presentation: 'modal' }} />
        <Stack.Screen name="post-new" />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="register" options={{ presentation: 'modal' }} />
      </Stack>
      <BrandSplash />
    </AuthProvider>
  );
}
