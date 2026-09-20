// 知闲 · 커스텀 하단 탭바 (피그마: 초록 바 + 중앙 발행 FAB)
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';

// 탭 이름 → 아이콘 매핑
const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  index: { on: 'home', off: 'home-outline' },
  mine: { on: 'person', off: 'person-outline' },
  messages: { on: 'chatbubble', off: 'chatbubble-outline' },
  favorites: { on: 'heart', off: 'heart-outline' },
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // 좌측 2개 / 우측 2개로 나누고 가운데 FAB
  const routes = state.routes.filter((r) => ICONS[r.name]);
  const left = routes.slice(0, 2);
  const right = routes.slice(2, 4);

  const renderTab = (route: (typeof routes)[number]) => {
    const index = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === index;
    const icon = ICONS[route.name];
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
    };
    return (
      <Pressable key={route.key} onPress={onPress} style={styles.tab} hitSlop={8}>
        <Ionicons
          name={focused ? icon.on : icon.off}
          size={26}
          color="#FFFFFF"
          style={{ opacity: focused ? 1 : 0.75 }}
        />
        {focused && <View style={styles.dot} />}
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom || 10 }]}>
      <View style={styles.row}>
        {left.map(renderTab)}
        <View style={styles.fabSlot} />
        {right.map(renderTab)}
      </View>

      {/* 중앙 발행 FAB */}
      <Pressable style={styles.fab} onPress={() => router.push('/publish')} hitSlop={8}>
        <Ionicons name="add" size={34} color={Brand.green} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Brand.green,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, height: 40 },
  dot: { width: 5, height: 5, borderRadius: 999, backgroundColor: '#FFFFFF' },
  fabSlot: { width: 72 },
  fab: {
    position: 'absolute',
    top: -22,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // 그림자
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 4,
    borderColor: Brand.green,
  },
});
