// 知闲 · 管理后台 · 等级称号
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
import { adminLevels, adminLevelSetName, type LevelTitle } from '@/data/api';
import { useAuth } from '@/data/auth';

export default function AdminLevelsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [rows, setRows] = useState<LevelTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await adminLevels());
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [user?.id]);

  function setName(level: number, name: string) {
    setRows((prev) => prev.map((r) => (r.level === level ? { ...r, name } : r)));
  }

  async function saveAll() {
    if (rows.some((r) => !r.name.trim())) {
      Alert.alert('提示', '称号不能为空');
      return;
    }
    setSaving(true);
    try {
      for (const r of rows) {
        await adminLevelSetName(r.level, r.name.trim());
      }
      Alert.alert('已保存', '等级称号已更新');
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
          <Text style={styles.headerTitle}>等级称号</Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.hint}>会员等级 1~10 的称号。发帖时会作为作者头衔显示。</Text>
            {rows.map((r) => (
              <View key={r.level} style={styles.row}>
                <View style={styles.lvBadge}>
                  <Text style={styles.lvBadgeText}>Lv{r.level}</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={r.name}
                  onChangeText={(t) => setName(r.level, t)}
                  placeholder="称号"
                  placeholderTextColor={Brand.textFaint}
                  maxLength={12}
                />
              </View>
            ))}
            <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveAll} disabled={saving}>
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
  lvBadge: {
    width: 48,
    height: 32,
    borderRadius: R.md,
    backgroundColor: Brand.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lvBadgeText: { fontSize: F.small, fontWeight: '800', color: Brand.greenDeep },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    height: 44,
    fontSize: F.body,
    color: Brand.text,
    backgroundColor: '#fff',
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
