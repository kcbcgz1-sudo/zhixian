// (tabs) 그룹 레이아웃 — 커스텀 초록 탭바 사용
import { Tabs } from 'expo-router';

import CustomTabBar from '@/components/custom-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="mine" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="favorites" />
    </Tabs>
  );
}
