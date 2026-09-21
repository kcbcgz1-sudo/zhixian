// 知闲 · 结构化发布(글쓰기) — 로그인 필요 + 제목/내용 + 이미지·동영상, 성공 후 홈
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
import { createPost, fetchCategories, uploadMedia, type ApiCategory } from '@/data/api';
import { useAuth } from '@/data/auth';
import { type Category } from '@/data/seed';

type Asset = ImagePicker.ImagePickerAsset;

// 광저우 11개 구 (지역 선택)
const DISTRICTS = ['天河', '越秀', '海珠', '荔湾', '白云', '黄埔', '番禺', '花都', '南沙', '从化', '增城'];

export default function PostNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [category, setCategory] = useState<Category>('');
  const [district, setDistrict] = useState('');

  useEffect(() => {
    fetchCategories()
      .then((list) => {
        setCats(list);
        setCategory((prev) => prev || list[0]?.code || '');
      })
      .catch(() => {});
  }, []);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function pick() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('需要相册权限', '请在系统设置中允许访问相册');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
      videoMaxDuration: 120,
    });
    if (!res.canceled) setAssets((prev) => [...prev, ...res.assets].slice(0, 9));
  }

  function removeAsset(i: number) {
    setAssets((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!user) {
      Alert.alert('请先登录', '发布前需要登录账号');
      router.push('/login' as any);
      return;
    }
    if (!category) {
      Alert.alert('提示', '请选择类型');
      return;
    }
    if (!title.trim() || !body.trim()) {
      Alert.alert('提示', '请填写标题和内容');
      return;
    }
    setSubmitting(true);
    try {
      const media = [];
      for (const a of assets) {
        const r = await uploadMedia({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType });
        media.push(r);
      }
      await createPost({
        category,
        title: title.trim(),
        body: body.trim(),
        district: district || undefined,
        media,
      });
      setDone(true);
      setTimeout(() => router.replace('/' as any), 1000);
    } catch (e) {
      setSubmitting(false);
      Alert.alert('发布失败', '请检查网络后重试');
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.bar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.barTitle}>结构化发布</Text>
          <Pressable
            onPress={submit}
            disabled={submitting}
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}>
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>发布</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>类型</Text>
          <View style={styles.catRow}>
            {cats.map((c) => {
              const active = c.code === category;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => setCategory(c.code)}
                  style={[styles.cat, active ? styles.catOn : styles.catOff]}>
                  <Text style={[styles.catText, { color: active ? '#fff' : Brand.text }]}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>地区（广州）</Text>
          <View style={styles.distWrap}>
            {DISTRICTS.map((d) => {
              const active = d === district;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDistrict(active ? '' : d)}
                  style={[styles.dist, active ? styles.distOn : styles.distOff]}>
                  <Text style={[styles.distText, { color: active ? '#fff' : Brand.text }]}>{d}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>标题</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="例：白云山摩星岭轻松线，8km缓坡"
            placeholderTextColor={Brand.textFaint}
            style={styles.titleInput}
            maxLength={40}
          />

          <Text style={styles.label}>内容</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="写下真实实测：路况、收费、停车、避坑提醒…&#10;用 #标签 添加话题，例如 #白水寨 #秋游"
            placeholderTextColor={Brand.textFaint}
            style={styles.bodyInput}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>图片 / 视频</Text>
          <View style={styles.mediaWrap}>
            {assets.map((a, i) => (
              <View key={i} style={styles.thumb}>
                {a.type === 'video' ? (
                  <View style={[styles.thumbImg, styles.videoThumb]}>
                    <Ionicons name="play-circle" size={30} color="#fff" />
                    <Text style={styles.videoLabel}>视频</Text>
                  </View>
                ) : (
                  <Image source={{ uri: a.uri }} style={styles.thumbImg} contentFit="cover" />
                )}
                <Pressable style={styles.remove} onPress={() => removeAsset(i)} hitSlop={6}>
                  <Ionicons name="close-circle" size={22} color="#333" />
                </Pressable>
              </View>
            ))}
            {assets.length < 9 && (
              <Pressable style={styles.addBtn} onPress={pick}>
                <Ionicons name="camera-outline" size={26} color={Brand.textSub} />
                <Text style={styles.addText}>添加</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.hint}>真实实拍更容易被评为「干货」、赚积分、上首页。内容里的 #标签 会显示在列表上。</Text>
        </ScrollView>
      </SafeAreaView>

      {done && (
        <View style={styles.overlay}>
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={56} color={Brand.green} />
            <Text style={styles.successText}>发布成功</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.card },
  flex: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  barTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
  submitBtn: {
    backgroundColor: Brand.green,
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
    borderRadius: R.pill,
    minWidth: 64,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: F.body, fontWeight: '700' },
  content: { padding: S.lg, gap: S.sm, paddingBottom: S.xxl },
  label: { fontSize: F.sub, fontWeight: '700', color: Brand.text, marginTop: S.md },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  cat: { paddingHorizontal: S.xl, paddingVertical: 10, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  catOn: { backgroundColor: Brand.green },
  catOff: { backgroundColor: '#E7EAEC' },
  catText: { fontSize: F.body, fontWeight: '700', lineHeight: 24, includeFontPadding: false, textAlignVertical: 'center' },
  distWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  dist: { paddingHorizontal: S.lg, paddingVertical: 8, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  distOn: { backgroundColor: Brand.green },
  distOff: { backgroundColor: '#E7EAEC' },
  distText: { fontSize: F.small, fontWeight: '700', lineHeight: 20, includeFontPadding: false, textAlignVertical: 'center' },
  titleInput: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    paddingHorizontal: S.lg,
    height: 52,
    fontSize: F.body,
    color: Brand.text,
  },
  bodyInput: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    padding: S.lg,
    minHeight: 140,
    fontSize: F.body,
    color: Brand.text,
    lineHeight: 24,
  },
  mediaWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  thumb: { width: 100, height: 100 },
  thumbImg: { width: 100, height: 100, borderRadius: R.md, backgroundColor: Brand.bg },
  videoThumb: { backgroundColor: '#3A3D42', alignItems: 'center', justifyContent: 'center' },
  videoLabel: { color: '#fff', fontSize: F.tiny, marginTop: 2 },
  remove: { position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 999 },
  addBtn: {
    width: 100,
    height: 100,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: Brand.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addText: { fontSize: F.small, color: Brand.textSub },
  hint: { fontSize: F.small, color: Brand.textSub, marginTop: S.sm, lineHeight: 18 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: {
    backgroundColor: '#fff',
    paddingHorizontal: S.xxl,
    paddingVertical: S.xl,
    borderRadius: R.lg,
    alignItems: 'center',
    gap: S.sm,
  },
  successText: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
});
