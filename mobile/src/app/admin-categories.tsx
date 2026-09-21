// 知闲 · 管理后台 · 分类管理
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import {
  adminCategories,
  adminCategoryCreate,
  adminCategoryDelete,
  adminCategoryUpdate,
  type AdminCategory,
} from '@/data/api';
import { useAuth } from '@/data/auth';

type Form = {
  id: string | null;
  code: string;
  name: string;
  sort: string;
  writeMinLevel: string;
  commentMinLevel: string;
};
const EMPTY: Form = { id: null, code: '', name: '', sort: '0', writeMinLevel: '1', commentMinLevel: '1' };

export default function AdminCategoriesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setList(await adminCategories());
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // 인증 준비(토큰 세팅)되면 재조회 — 새로고침/딥링크 레이스 방지
  }, [user?.id]);

  function openNew() {
    setForm({ ...EMPTY });
  }
  function openEdit(c: AdminCategory) {
    setForm({
      id: c.id,
      code: c.code,
      name: c.name,
      sort: String(c.sort),
      writeMinLevel: String(c.writeMinLevel),
      commentMinLevel: String(c.commentMinLevel),
    });
  }

  async function save() {
    if (!form) return;
    if (!form.name.trim()) {
      Alert.alert('提示', '请填写名称');
      return;
    }
    if (!form.id && !/^[a-z0-9_]+$/.test(form.code.trim().toLowerCase())) {
      Alert.alert('提示', '代码只能用小写字母 / 数字 / 下划线');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        sort: Number(form.sort) || 0,
        writeMinLevel: Number(form.writeMinLevel) || 1,
        commentMinLevel: Number(form.commentMinLevel) || 1,
      };
      if (form.id) {
        await adminCategoryUpdate(form.id, payload);
      } else {
        await adminCategoryCreate({ ...payload, code: form.code.trim().toLowerCase() });
      }
      setForm(null);
      await load();
    } catch (e: any) {
      Alert.alert('保存失败', String(e?.message ?? '请重试'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: AdminCategory) {
    try {
      await adminCategoryUpdate(c.id, { active: !c.active });
      await load();
    } catch {
      Alert.alert('操作失败', '请重试');
    }
  }

  function confirmDelete(c: AdminCategory) {
    const run = async () => {
      try {
        await adminCategoryDelete(c.id);
        await load();
      } catch (e: any) {
        Alert.alert('无法删除', String(e?.message ?? '请重试'));
      }
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`确定删除「${c.name}」？`)) run();
      return;
    }
    Alert.alert('删除分类', `确定删除「${c.name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: run },
    ]);
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.headerTitle}>分类管理</Text>
          <Pressable onPress={openNew} hitSlop={10}>
            <Ionicons name="add-circle" size={28} color={Brand.green} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {form && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>{form.id ? '编辑分类' : '新增分类'}</Text>

                <Text style={styles.fieldLabel}>名称（中文）</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(t) => setForm({ ...form, name: t })}
                  placeholder="例：钓鱼"
                  placeholderTextColor={Brand.textFaint}
                />

                <Text style={styles.fieldLabel}>代码（英文/数字，唯一）</Text>
                <TextInput
                  style={[styles.input, !!form.id && styles.inputDisabled]}
                  value={form.code}
                  editable={!form.id}
                  autoCapitalize="none"
                  onChangeText={(t) => setForm({ ...form, code: t })}
                  placeholder="例：fishing"
                  placeholderTextColor={Brand.textFaint}
                />
                {!!form.id && <Text style={styles.hint}>代码创建后不可修改（帖子引用）</Text>}

                <View style={styles.row3}>
                  <View style={styles.col}>
                    <Text style={styles.fieldLabel}>排序</Text>
                    <TextInput
                      style={styles.input}
                      value={form.sort}
                      keyboardType="number-pad"
                      onChangeText={(t) => setForm({ ...form, sort: t })}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.fieldLabel}>发帖等级</Text>
                    <TextInput
                      style={styles.input}
                      value={form.writeMinLevel}
                      keyboardType="number-pad"
                      onChangeText={(t) => setForm({ ...form, writeMinLevel: t })}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.fieldLabel}>评论等级</Text>
                    <TextInput
                      style={styles.input}
                      value={form.commentMinLevel}
                      keyboardType="number-pad"
                      onChangeText={(t) => setForm({ ...form, commentMinLevel: t })}
                    />
                  </View>
                </View>

                <View style={styles.formBtns}>
                  <Pressable style={[styles.btn, styles.btnGray]} onPress={() => setForm(null)}>
                    <Text style={styles.btnGrayText}>取消</Text>
                  </Pressable>
                  <Pressable style={[styles.btn, styles.btnGreen]} onPress={save} disabled={saving}>
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.btnGreenText}>保存</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {list.map((c) => (
              <View key={c.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.name}>{c.name}</Text>
                  <View style={[styles.badge, c.active ? styles.badgeOn : styles.badgeOff]}>
                    <Text style={styles.badgeText}>{c.active ? '显示中' : '已隐藏'}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  代码 {c.code} · 排序 {c.sort} · 发帖Lv{c.writeMinLevel} · 评论Lv{c.commentMinLevel} · 帖 {c.posts}
                </Text>
                <View style={styles.actions}>
                  <Pressable style={[styles.sbtn, styles.sbtnGray]} onPress={() => openEdit(c)}>
                    <Text style={styles.sbtnGrayText}>编辑</Text>
                  </Pressable>
                  <Pressable style={[styles.sbtn, styles.sbtnGray]} onPress={() => toggleActive(c)}>
                    <Text style={styles.sbtnGrayText}>{c.active ? '隐藏' : '显示'}</Text>
                  </Pressable>
                  <Pressable style={[styles.sbtn, styles.sbtnRed]} onPress={() => confirmDelete(c)}>
                    <Text style={styles.sbtnRedText}>删除</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            {list.length === 0 && <Text style={styles.empty}>暂无分类，点右上角 + 添加</Text>}
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
  content: { padding: S.lg, gap: S.md },
  form: { backgroundColor: Brand.card, borderRadius: R.lg, padding: S.lg, gap: 6 },
  formTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text, marginBottom: 4 },
  fieldLabel: { fontSize: F.small, fontWeight: '700', color: Brand.textSub, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    height: 44,
    fontSize: F.body,
    color: Brand.text,
    backgroundColor: '#fff',
  },
  inputDisabled: { backgroundColor: '#F0F2F3', color: Brand.textSub },
  hint: { fontSize: F.tiny, color: Brand.textFaint, marginTop: 2 },
  row3: { flexDirection: 'row', gap: S.sm },
  col: { flex: 1 },
  formBtns: { flexDirection: 'row', gap: S.sm, marginTop: S.md, justifyContent: 'flex-end' },
  btn: { paddingHorizontal: S.xl, height: 42, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', minWidth: 84 },
  btnGray: { backgroundColor: '#E7EAEC' },
  btnGrayText: { color: Brand.text, fontWeight: '700', fontSize: F.body },
  btnGreen: { backgroundColor: Brand.green },
  btnGreenText: { color: '#fff', fontWeight: '700', fontSize: F.body },
  card: { backgroundColor: Brand.card, borderRadius: R.lg, padding: S.lg, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  name: { flex: 1, fontSize: F.body, fontWeight: '800', color: Brand.text },
  badge: { paddingHorizontal: S.sm, paddingVertical: 2, borderRadius: R.sm },
  badgeOn: { backgroundColor: Brand.greenSoft },
  badgeOff: { backgroundColor: '#F3D9D2' },
  badgeText: { fontSize: F.tiny, color: Brand.text },
  meta: { fontSize: F.small, color: Brand.textSub },
  actions: { flexDirection: 'row', gap: S.sm, marginTop: 4 },
  sbtn: { paddingHorizontal: S.lg, paddingVertical: S.sm, borderRadius: R.md },
  sbtnGray: { backgroundColor: '#E7EAEC' },
  sbtnGrayText: { color: Brand.text, fontWeight: '700', fontSize: F.small },
  sbtnRed: { backgroundColor: '#FBE9E7' },
  sbtnRedText: { color: Brand.danger, fontWeight: '700', fontSize: F.small },
  empty: { textAlign: 'center', color: Brand.textSub, marginTop: S.xxl },
});
