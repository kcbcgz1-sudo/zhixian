// 知闲 · 收藏 — 임시(빈 상태)
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, S } from '@/constants/brand';

export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <Text style={styles.header}>收藏</Text>
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={56} color={Brand.textFaint} />
          <Text style={styles.emptyText}>还没有收藏的干货</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg },
  flex: { flex: 1 },
  header: { fontSize: F.title, fontWeight: '800', color: Brand.text, padding: S.lg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.md },
  emptyText: { fontSize: F.body, color: Brand.textSub },
});
