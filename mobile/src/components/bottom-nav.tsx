// 知闲 · 하단 빠른 이동바 (상세/글쓰기 등 푸시된 화면에서 메인 탭으로 바로 이동)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';

type Item = { route: string; icon: keyof typeof Ionicons.glyphMap };

const LEFT: Item[] = [
  { route: '/', icon: 'home-outline' },
  { route: '/checkin', icon: 'calendar-outline' },
];
const RIGHT: Item[] = [
  { route: '/messages', icon: 'chatbubble-outline' },
  { route: '/mine', icon: 'person-outline' },
];

export default function BottomNav() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const go = (route: string) => router.replace(route as never);

  const renderTab = (it: Item) => (
    <Pressable key={it.route} onPress={() => go(it.route)} style={styles.tab} hitSlop={8}>
      <Ionicons name={it.icon} size={26} color="#FFFFFF" style={{ opacity: 0.85 }} />
    </Pressable>
  );

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom || 10 }]}>
      <View style={styles.row}>
        {LEFT.map(renderTab)}
        <View style={styles.fabSlot}>
          <Text style={styles.fabLabel}>约伴</Text>
        </View>
        {RIGHT.map(renderTab)}
      </View>
      <Pressable style={styles.fab} onPress={() => go('/activities')} hitSlop={8}>
        <Ionicons name="people" size={30} color={Brand.green} />
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
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 40 },
  fabSlot: { width: 72, alignItems: 'center', justifyContent: 'flex-end', height: 40 },
  fabLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', marginBottom: 1 },
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
