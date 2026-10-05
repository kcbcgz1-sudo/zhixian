// 知闲 · 管理后台 · 横幅管理 (배너 관리)
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
  adminBannerCreate,
  adminBannerDelete,
  adminBannerUpdate,
  adminBanners,
  fetchCategories,
  uploadMedia,
  type Banner,
} from '@/data/api';
import { shrinkImage } from '@/data/image';
import { useAuth } from '@/data/auth';

export default function AdminBannersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<Banner[]>([]);
  const [places, setPlaces] = useState<{ code: string; name: string }[]>([{ code: 'home', name: '首页(全部)' }]);
  const [loading, setLoading] = useState(true);

  // 새 배너 폼
  const [image, setImage] = useState('');
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [placement, setPlacement] = useState('home');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const placeName = (code: string) => places.find((p) => p.code === code)?.name ?? code;

  const load = async () => {
    setLoading(true);
    try {
      setList(await adminBanners());
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    fetchCategories()
      .then((cs) => setPlaces([{ code: 'home', name: '首页(全部)' }, ...cs.map((c) => ({ code: c.code, name: c.name }))]))
      .catch(() => {});
  }, [user?.id]);

  function toast(msg: string) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
    else Alert.alert('提示', msg);
  }

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast('请在系统设置中允许访问相册');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (res.canceled) return;
    setUploading(true);
    try {
      const a = res.assets[0];
      const uri = await shrinkImage(a.uri, a.width, a.height);
      const r = await uploadMedia({ uri, fileName: a.fileName, mimeType: 'image/jpeg' });
      setImage((r as any).url);
    } catch (e: any) {
      toast(String(e?.message ?? '上传失败'));
    } finally {
      setUploading(false);
    }
  }

  async function onCreate() {
    if (!image) {
      toast('请先上传横幅图片');
      return;
    }
    setSaving(true);
    try {
      await adminBannerCreate({ image, title: title.trim(), link: link.trim(), placement, sort: list.length });
      setImage('');
      setTitle('');
      setLink('');
      await load();
    } catch (e: any) {
      toast(String(e?.message ?? '保存失败'));
    } finally {
      setSaving(false);
    }
  }

  async function act(fn: () => Promise<any>) {
    try {
      await fn();
      await load();
    } catch (e: any) {
      toast(String(e?.message ?? '操作失败'));
    }
  }

  function confirmDelete(b: Banner) {
    const run = () => act(() => adminBannerDelete(b.id));
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('确定删除该横幅？')) run();
      return;
    }
    Alert.alert('删除横幅', '确定删除该横幅？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: run },
    ]);
  }

  async function move(b: Banner, dir: 'up' | 'down') {
    const group = list
      .filter((x) => x.placement === b.placement)
      .sort((a, c) => a.sort - c.sort || (a.createdAt < c.createdAt ? 1 : -1));
    const i = group.findIndex((x) => x.id === b.id);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= group.length) return;
    [group[i], group[j]] = [group[j], group[i]];
    await act(() => Promise.all(group.map((x, k) => adminBannerUpdate(x.id, { sort: k }))));
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.headerTitle}>横幅管理</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* 새 배너 */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>新增横幅</Text>
            <Pressable style={styles.picker} onPress={pickImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color={Brand.green} />
              ) : image ? (
                <Image source={{ uri: image }} style={styles.preview} contentFit="cover" />
              ) : (
                <View style={styles.pickerEmpty}>
                  <Ionicons name="image-outline" size={28} color={Brand.textSub} />
                  <Text style={styles.pickerHint}>点击上传横幅图片（建议宽图）</Text>
                </View>
              )}
            </Pressable>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="标题/说明（可选）"
              placeholderTextColor={Brand.textFaint}
            />
            <TextInput
              style={styles.input}
              value={link}
              onChangeText={setLink}
              placeholder="点击跳转：帖子ID 或 http(s) 链接（可选）"
              placeholderTextColor={Brand.textFaint}
              autoCapitalize="none"
            />
            <Text style={styles.label}>显示位置</Text>
            <View style={styles.chipRow}>
              {places.map((p) => (
                <Pressable
                  key={p.code}
                  onPress={() => setPlacement(p.code)}
                  style={[styles.chip, placement === p.code && styles.chipOn]}
                >
                  <Text style={[styles.chipText, placement === p.code && styles.chipTextOn]}>{p.name}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.saveBtn, (!image || saving) && styles.saveBtnOff]} onPress={onCreate} disabled={!image || saving}>
              <Text style={styles.saveText}>{saving ? '保存中…' : '保存横幅'}</Text>
            </Pressable>
          </View>

          <Text style={styles.listTitle}>已有横幅（{list.length}）</Text>
          {loading ? (
            <ActivityIndicator color={Brand.green} style={{ marginTop: S.lg }} />
          ) : list.length === 0 ? (
            <Text style={styles.empty}>还没有横幅</Text>
          ) : (
            list.map((b) => (
              <View key={b.id} style={styles.card}>
                <Image source={{ uri: b.image }} style={styles.thumb} contentFit="cover" />
                <View style={styles.cardBody}>
                  <View style={styles.badgeRow}>
                    <View style={styles.placeBadge}>
                      <Text style={styles.placeBadgeText}>{placeName(b.placement)}</Text>
                    </View>
                    <View style={[styles.stateBadge, b.active ? styles.stateOn : styles.stateOff]}>
                      <Text style={[styles.stateText, { color: b.active ? Brand.green : Brand.textSub }]}>
                        {b.active ? '显示中' : '已隐藏'}
                      </Text>
                    </View>
                  </View>
                  {!!b.title && <Text style={styles.cardTitle} numberOfLines={1}>{b.title}</Text>}
                  {!!b.link && <Text style={styles.cardLink} numberOfLines={1}>→ {b.link}</Text>}
                  <View style={styles.actions}>
                    <Pressable style={styles.act} onPress={() => act(() => adminBannerUpdate(b.id, { active: !b.active }))}>
                      <Text style={styles.actText}>{b.active ? '隐藏' : '显示'}</Text>
                    </Pressable>
                    <Pressable style={styles.act} onPress={() => move(b, 'up')}>
                      <Ionicons name="arrow-up" size={15} color={Brand.text} />
                    </Pressable>
                    <Pressable style={styles.act} onPress={() => move(b, 'down')}>
                      <Ionicons name="arrow-down" size={15} color={Brand.text} />
                    </Pressable>
                    <Pressable style={[styles.act, styles.actDel]} onPress={() => confirmDelete(b)}>
                      <Text style={styles.actDelText}>删除</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
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
  content: { padding: S.lg, gap: S.md },
  form: { backgroundColor: Brand.card, borderRadius: R.lg, padding: S.lg, gap: S.sm },
  formTitle: { fontSize: F.body, fontWeight: '800', color: Brand.text },
  picker: { borderRadius: R.md, overflow: 'hidden', backgroundColor: Brand.bg },
  preview: { width: '100%', aspectRatio: 2.6 },
  pickerEmpty: { aspectRatio: 2.6, alignItems: 'center', justifyContent: 'center', gap: 6 },
  pickerHint: { fontSize: F.small, color: Brand.textSub },
  input: {
    backgroundColor: Brand.bg,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    paddingVertical: 10,
    fontSize: F.body,
    color: Brand.text,
  },
  label: { fontSize: F.small, color: Brand.textSub, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  chip: {
    paddingHorizontal: S.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Brand.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
  },
  chipOn: { backgroundColor: Brand.green, borderColor: Brand.green },
  chipText: { fontSize: F.small, color: Brand.textSub, fontWeight: '700' },
  chipTextOn: { color: '#fff' },
  saveBtn: { backgroundColor: Brand.green, borderRadius: R.md, paddingVertical: S.md, alignItems: 'center', marginTop: 4 },
  saveBtnOff: { backgroundColor: '#B9D9C4' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: F.body },
  listTitle: { fontSize: F.body, fontWeight: '800', color: Brand.text, marginTop: S.sm },
  empty: { textAlign: 'center', color: Brand.textSub, marginTop: S.lg },
  card: { backgroundColor: Brand.card, borderRadius: R.lg, padding: S.md, gap: S.sm, flexDirection: 'row' },
  thumb: { width: 96, aspectRatio: 1.4, borderRadius: R.md, backgroundColor: Brand.greenSoft },
  cardBody: { flex: 1, gap: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  placeBadge: { backgroundColor: Brand.greenSoft, borderRadius: R.sm, paddingHorizontal: 7, paddingVertical: 2 },
  placeBadgeText: { color: Brand.greenDeep, fontSize: F.tiny, fontWeight: '800' },
  stateBadge: { borderRadius: R.sm, paddingHorizontal: 7, paddingVertical: 2 },
  stateOn: { backgroundColor: Brand.greenSoft },
  stateOff: { backgroundColor: '#ECEFF1' },
  stateText: { fontSize: F.tiny, fontWeight: '700' },
  cardTitle: { fontSize: F.small, fontWeight: '700', color: Brand.text },
  cardLink: { fontSize: F.tiny, color: Brand.textSub },
  actions: { flexDirection: 'row', gap: S.sm, marginTop: 4, flexWrap: 'wrap' },
  act: {
    backgroundColor: Brand.bg,
    borderRadius: R.sm,
    paddingHorizontal: S.md,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actText: { fontSize: F.small, color: Brand.text, fontWeight: '700' },
  actDel: { backgroundColor: '#FBE9E7' },
  actDelText: { fontSize: F.small, color: Brand.danger, fontWeight: '700' },
});
