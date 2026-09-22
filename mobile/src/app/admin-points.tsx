// 知闲 · 管理后台 · 分数设置 (포인트 규칙)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { adminPointConfig, adminSetPointConfig } from '@/data/api';
import { useAuth } from '@/data/auth';

// 표시 순서 + 라벨/설명
const FIELDS: { key: string; label: string; sub: string }[] = [
  { key: 'post_create', label: '发帖', sub: '原帖作者获得' },
  { key: 'like', label: '被点赞', sub: '原帖作者获得（每个赞）' },
  { key: 'favorite', label: '被收藏', sub: '原帖作者获得（每次收藏）' },
  { key: 'comment_author', label: '被评论', sub: '原帖作者获得（每条评论）' },
  { key: 'comment_commenter', label: '发评论', sub: '评论者获得' },
  { key: 'quality', label: '入选干货', sub: '原帖作者获得' },
  { key: 'quality_min_likes', label: '干货门槛', sub: '设为干货所需最低赞数（非积分）' },
];

export default function AdminPointsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const c = await adminPointConfig();
      const s: Record<string, string> = {};
      for (const f of FIELDS) s[f.key] = String(c[f.key] ?? 0);
      setCfg(s);
    } catch {
      setCfg({});
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [user?.id]);

  function setVal(key: string, v: string) {
    setCfg((prev) => ({ ...prev, [key]: v.replace(/[^0-9]/g, '') }));
  }

  async function saveAll() {
    setSaving(true);
    try {
      for (const f of FIELDS) {
        await adminSetPointConfig(f.key, Number(cfg[f.key] || 0));
      }
      Alert.alert('已保存', '积分规则已更新，立即生效');
      await load();
    } catch (e: any) {
      Alert.alert('保存失败', String(e?.message ?? '请重试'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.headerTitle}>分数设置</Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.hint}>各行为的积分，随时可改、立即生效。</Text>
            {FIELDS.map((f) => (
              <View key={f.key} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{f.label}</Text>
                  <Text style={styles.rowSub}>{f.sub}</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={cfg[f.key] ?? ''}
                  onChangeText={(t) => setVal(f.key, t)}
                  keyboardType="number-pad"
                  maxLength={9}
                />
              </View>
            ))}
            <Pressable
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={saveAll}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveText}>保存全部</Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    backgroundColor: Brand.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  headerTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: S.lg, gap: S.sm },
  hint: { fontSize: F.small, color: Brand.textSub, marginBottom: S.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: Brand.card,
    borderRadius: R.lg,
    padding: S.md,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: F.body, fontWeight: '700', color: Brand.text },
  rowSub: { fontSize: F.small, color: Brand.textSub },
  input: {
    width: 90,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    height: 44,
    fontSize: F.body,
    color: Brand.text,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: S.lg,
    height: 50,
    borderRadius: R.md,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#fff', fontSize: F.body, fontWeight: '800' },
});
