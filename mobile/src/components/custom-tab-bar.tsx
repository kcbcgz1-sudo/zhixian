// 知闲 · 커스텀 하단 탭바 (초록 바 + 중앙 발행 FAB + 消息 안읽음 배지)
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { notifUnreadCount } from '@/data/api';
import { useAuth } from '@/data/auth';

// 탭 이름 → 아이콘 매핑
const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  index: { on: 'home', off: 'home-outline' },
  activities: { on: 'people', off: 'people-outline' },
  mine: { on: 'person', off: 'person-outline' },
  messages: { on: 'chatbubble', off: 'chatbubble-outline' },
  favorites: { on: 'bookmark', off: 'bookmark-outline' },
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    const fetchUnread = () => {
      if (!user) {
        if (alive) setUnread(0);
        return;
      }
      notifUnreadCount()
        .then((r) => {
          if (alive) setUnread(r.count || 0);
        })
        .catch(() => {});
    };
    fetchUnread();
    const t = setInterval(fetchUnread, 25000);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // 탭 전환 시(state.index)에도 갱신 → 消息 읽고 나오면 배지 반영
  }, [user?.id, state.index]);

  const routes = state.routes.filter((r) => ICONS[r.name]);
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const renderTab = (route: (typeof routes)[number]) => {
    const index = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === index;
    const icon = ICONS[route.name];
    const showBadge = route.name === 'messages' && unread > 0;
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
    };
    return (
      <Pressable key={route.key} onPress={onPress} style={styles.tab} hitSlop={8}>
        <View>
          <Ionicons
            name={focused ? icon.on : icon.off}
            size={26}
            color="#FFFFFF"
            style={{ opacity: focused ? 1 : 0.75 }}
          />
          {showBadge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </View>
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
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#E8604C',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
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
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 4,
    borderColor: Brand.green,
  },
});
