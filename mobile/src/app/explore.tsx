// 知闲 · 我的(개인 중심) 화면 — P10 (임시 버전)
// 지금은 자리만 잡아둡니다. 나중에 로그인/적립/내 글/수집을 채웁니다.
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function MineScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* 프로필 카드 (미로그인 상태) */}
        <ThemedView type="backgroundElement" style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="subtitle">👤</ThemedText>
          </View>
          <View style={styles.profileText}>
            <ThemedText type="subtitle">未登录</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              登录后可发布干货、赚积分、解段位
            </ThemedText>
          </View>
        </ThemedView>

        {/* 적립/단계 요약 (더미) */}
        <View style={styles.statsRow}>
          {[
            { label: '积分', value: '0' },
            { label: '段位', value: 'Lv.1' },
            { label: '干货帖', value: '0' },
          ].map((s) => (
            <ThemedView key={s.label} type="backgroundElement" style={styles.stat}>
              <ThemedText type="subtitle">{s.value}</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                {s.label}
              </ThemedText>
            </ThemedView>
          ))}
        </View>

        {/* 메뉴 목록 (자리) */}
        <ThemedView type="backgroundElement" style={styles.menu}>
          {['我的发布', '我的收藏', '适老化设置', '关于知闲'].map((m, i) => (
            <View
              key={m}
              style={[
                styles.menuItem,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.backgroundSelected },
              ]}>
              <ThemedText style={styles.menuText}>{m}</ThemedText>
              <ThemedText themeColor="textSecondary">›</ThemedText>
            </View>
          ))}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.three, gap: Spacing.three },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1, gap: 2 },
  statsRow: { flexDirection: 'row', gap: Spacing.two },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    gap: 2,
  },
  menu: { borderRadius: Spacing.three, paddingHorizontal: Spacing.three },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  menuText: { fontSize: 17 },
});
