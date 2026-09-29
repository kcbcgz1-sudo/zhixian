// 知闲 · 结构化发布(글쓰기) — 로그인 필요 + 제목/내용 + 이미지·동영상, 성공 후 홈
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { injectThinBar } from '@/constants/thinbar';
import { aiAssist, createPost, fetchCategories, fetchPost, updatePost, uploadMedia, type ApiCategory } from '@/data/api';
import { shrinkImage } from '@/data/image';
import { useAuth } from '@/data/auth';
import { type Category } from '@/data/seed';
import RegionInline from '@/components/region-inline';
import { DEFAULT_CITY, DEFAULT_PROVINCE } from '@/constants/regions';

type Asset = ImagePicker.ImagePickerAsset;

export default function PostNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [category, setCategory] = useState<Category>('');
  const [province, setProvince] = useState(DEFAULT_PROVINCE);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [district, setDistrict] = useState('');

  useEffect(() => {
    fetchCategories()
      .then((list) => {
        setCats(list);
        setCategory((prev) => prev || list[0]?.code || '');
      })
      .catch(() => {});
  }, []);
  useEffect(() => injectThinBar(), []);
  useEffect(() => {
    if (user) {
      if (user.city) setCity(user.city);
      if (user.province) setProvince(user.province);
    }
  }, [user?.id]);
  // 선택된 카테고리가 레벨 부족이면 발제 가능한 첫 카테고리로 전환
  useEffect(() => {
    if (editing) return;
    if (!cats.length || !user || user.role === 'admin') return;
    const cur = cats.find((c) => c.code === category);
    if (cur && user.level < cur.writeMinLevel) {
      const allowed = cats.find((c) => user.level >= c.writeMinLevel);
      if (allowed) setCategory(allowed.code);
    }
  }, [cats, user, category]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [existingMedia, setExistingMedia] = useState<{ url: string; type: string }[]>([]);

  useEffect(() => {
    if (!id) return;
    fetchPost(String(id))
      .then((p: any) => {
        if (p.category) setCategory(p.category);
        setTitle(p.title || '');
        setBody(p.body || '');
        if (p.province) setProvince(p.province);
        if (p.city) setCity(p.city);
        setDistrict(p.district || '');
        setExistingMedia(Array.isArray(p.media) ? p.media : []);
      })
      .catch(() => {});
  }, [id]);

  const [aiBusy, setAiBusy] = useState(false);
  async function onAiAssist() {
    if (!user) {
      Alert.alert('请先登录', 'AI 整理需要登录账号');
      router.push('/login' as any);
      return;
    }
    if (body.trim().length < 4) {
      Alert.alert('提示', '先写几句你的想法或经历（去了哪、路况、停车、花费、感受…），AI 再帮你整理');
      return;
    }
    setAiBusy(true);
    try {
      const catName = cats.find((c) => c.code === category)?.name;
      const d = await aiAssist(body.trim(), catName, city);
      setBody(d.body);
      if (!title.trim()) setTitle(d.title);
    } catch (e: any) {
      Alert.alert('整理失败', String(e?.message ?? '请重试'));
    } finally {
      setAiBusy(false);
    }
  }

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
      const uploaded = [];
      for (const a of assets) {
        const isVideo = a.type === 'video';
        const uri = isVideo ? a.uri : await shrinkImage(a.uri, a.width, a.height);
        const r = await uploadMedia({
          uri,
          fileName: a.fileName,
          mimeType: isVideo ? a.mimeType : 'image/jpeg',
        });
        uploaded.push(r);
      }
      const media = [...existingMedia, ...uploaded];
      const payload = {
        category,
        title: title.trim(),
        body: body.trim(),
        province,
        city,
        district: district || undefined,
        media,
      };
      if (editing) {
        await updatePost(String(id), payload as any);
      } else {
        await createPost(payload as any);
      }
      setDone(true);
      setTimeout(() => router.replace((editing ? `/post/${id}` : '/') as any), 1000);
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert(editing ? '保存失败' : '发布失败', String(e?.message ?? '请检查网络后重试'));
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.bar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.barTitle}>{editing ? '编辑内容' : '结构化发布'}</Text>
          <Pressable
            onPress={submit}
            disabled={submitting}
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}>
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>{editing ? '保存' : '发布'}</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>类型</Text>
          <View style={styles.catScrollBox}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              contentContainerStyle={styles.catRow}
              {...(Platform.OS === 'web' ? ({ dataSet: { thinbar: 'cat' } } as any) : {})}>
              {cats.map((c) => {
                const active = c.code === category;
                const locked = !!user && user.role !== 'admin' && user.level < c.writeMinLevel;
                return (
                  <Pressable
                    key={c.code}
                    onPress={() => {
                      if (locked) {
                        Alert.alert('提示', `该分类需要 Lv${c.writeMinLevel} 才能发帖`);
                        return;
                      }
                      setCategory(c.code);
                    }}
                    style={[styles.cat, active ? styles.catOn : styles.catOff, locked && styles.catLocked]}>
                    <Text
                      style={[
                        styles.catText,
                        { color: active ? '#fff' : locked ? Brand.textFaint : Brand.text },
                      ]}>
                      {c.name}
                      {locked ? ` 🔒Lv${c.writeMinLevel}` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Text style={styles.label}>所在地区</Text>
          <RegionInline province={province} city={city} district={district} showDistrict onChange={(p, c, d) => { setProvince(p); setCity(c); setDistrict(d); }} />

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
          <Pressable style={[styles.aiBtn, aiBusy && { opacity: 0.6 }]} onPress={onAiAssist} disabled={aiBusy}>
            {aiBusy ? (
              <ActivityIndicator color={Brand.green} size="small" />
            ) : (
              <Ionicons name="sparkles" size={16} color={Brand.green} />
            )}
            <Text style={styles.aiBtnText}>{aiBusy ? 'AI 整理中…' : 'AI 帮我整理成干货'}</Text>
          </Pressable>
          <Text style={styles.aiHint}>不想长篇写？随便写几句，AI 帮你整理成通顺的干货帖（会保留你说的内容，不乱编）。</Text>

          <Text style={styles.label}>图片 / 视频</Text>
          <View style={styles.mediaWrap}>
            {existingMedia.map((m, i) => (
              <View key={`ex-${i}`} style={styles.thumb}>
                {m.type === 'video' ? (
                  <View style={[styles.thumbImg, styles.videoThumb]}>
                    <Ionicons name="play-circle" size={30} color="#fff" />
                    <Text style={styles.videoLabel}>视频</Text>
                  </View>
                ) : (
                  <Image source={{ uri: m.url }} style={styles.thumbImg} contentFit="cover" />
                )}
                <Pressable style={styles.remove} onPress={() => setExistingMedia((prev) => prev.filter((_, idx) => idx !== i))} hitSlop={6}>
                  <Ionicons name="close-circle" size={22} color="#333" />
                </Pressable>
              </View>
            ))}
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
            <Text style={styles.successText}>{editing ? '保存成功' : '发布成功'}</Text>
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
  catScrollBox: { height: 56 },
  catRow: { flexDirection: 'row', gap: S.sm, alignItems: 'center', paddingRight: S.lg },
  cat: { paddingHorizontal: S.xl, paddingVertical: 10, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  catOn: { backgroundColor: Brand.green },
  catOff: { backgroundColor: '#E7EAEC' },
  catLocked: { opacity: 0.55 },
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
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    borderWidth: 1.5,
    borderColor: Brand.green,
    backgroundColor: Brand.greenSoft,
    borderRadius: R.pill,
    height: 44,
    marginTop: S.sm,
  },
  aiBtnText: { color: Brand.greenDark, fontSize: F.sub, fontWeight: '800' },
  aiHint: { fontSize: F.small, color: Brand.textSub, marginTop: 6, lineHeight: 18 },
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
