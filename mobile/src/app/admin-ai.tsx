// 知闲 · 관리자 AI 内容生成 (通义千问 초안 + 通义万相 配图 → 검수 → 발행)
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

import RegionInline from '@/components/region-inline';
import { Brand, F, R, S } from '@/constants/brand';
import { DEFAULT_CITY, DEFAULT_PROVINCE } from '@/constants/regions';
import { injectThinBar } from '@/constants/thinbar';
import {
  aiDraft,
  aiImage,
  aiStatus,
  createPost,
  fetchCategories,
  type ApiCategory,
} from '@/data/api';
import { useAuth } from '@/data/auth';

export default function AdminAiScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [category, setCategory] = useState('');
  const [province, setProvince] = useState(DEFAULT_PROVINCE);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [district, setDistrict] = useState('');
  const [topic, setTopic] = useState('');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [imgPrompt, setImgPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [genDraft, setGenDraft] = useState(false);
  const [genImg, setGenImg] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => injectThinBar(), []);
  useEffect(() => {
    aiStatus().then((r) => setHasKey(r.hasKey)).catch(() => setHasKey(false));
    fetchCategories()
      .then((list) => { setCats(list); setCategory((p) => p || list[0]?.code || ''); })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (user) {
      if (user.city) setCity(user.city);
      if (user.province) setProvince(user.province);
    }
  }, [user?.id]);

  const catName = (code: string) => cats.find((c) => c.code === code)?.name ?? code;

  async function onDraft() {
    if (!topic.trim()) { Alert.alert('提示', '请输入主题或地点'); return; }
    setGenDraft(true);
    try {
      const d = await aiDraft(topic.trim(), catName(category), city);
      setTitle(d.title);
      setBody(d.body);
      setTagsText((d.tags || []).join(' '));
      if (!imgPrompt.trim()) setImgPrompt(`${city}${d.title}，真实自然的户外风光照片，中老年友好`);
    } catch (e: any) {
      Alert.alert('生成失败', String(e?.message ?? '请重试'));
    } finally {
      setGenDraft(false);
    }
  }

  async function onImage() {
    const pr = imgPrompt.trim() || title.trim();
    if (!pr) { Alert.alert('提示', '请先生成草稿或填写配图描述'); return; }
    setGenImg(true);
    try {
      const r = await aiImage(pr);
      setImageUrl(r.url);
    } catch (e: any) {
      Alert.alert('生成失败', String(e?.message ?? '请重试'));
    } finally {
      setGenImg(false);
    }
  }

  async function onPublish() {
    if (!title.trim() || !body.trim()) { Alert.alert('提示', '请先生成或填写标题和内容'); return; }
    if (!category) { Alert.alert('提示', '请选择分类'); return; }
    setPublishing(true);
    try {
      const tags = tagsText.split(/[\s,，]+/).map((t) => t.replace(/^#/, '').trim()).filter(Boolean);
      await createPost({
        category: category as any,
        title: title.trim(),
        body: body.trim(),
        province,
        city,
        district: district || undefined,
        tags,
        media: imageUrl ? [{ url: imageUrl, type: 'image' }] : [],
      });
      Alert.alert('发布成功', '已发布到内容流', [
        { text: '再写一篇', onPress: () => { setTopic(''); setTitle(''); setBody(''); setTagsText(''); setImgPrompt(''); setImageUrl(''); } },
        { text: '返回', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('发布失败', String(e?.message ?? '请重试'));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.bar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <Text style={styles.barTitle}>AI 内容生成</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {hasKey === false && (
            <View style={styles.warn}>
              <Ionicons name="alert-circle-outline" size={18} color={Brand.danger} />
              <Text style={styles.warnText}>尚未配置 AI 密钥（DASHSCOPE_API_KEY）。生成功能暂不可用，请先在服务器配置。</Text>
            </View>
          )}

          <Text style={styles.label}>主题 / 地点</Text>
          <TextInput value={topic} onChangeText={setTopic} placeholder="例：白云山摩星岭登山 / 流溪河水库野钓" placeholderTextColor={Brand.textFaint} style={styles.input} />

          <Text style={styles.label}>分类</Text>
          <View style={styles.catBox}>
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.catRow}
              {...(Platform.OS === 'web' ? ({ dataSet: { thinbar: 'cat' } } as any) : {})}>
              {cats.map((c) => {
                const active = c.code === category;
                return (
                  <Pressable key={c.code} onPress={() => setCategory(c.code)} style={[styles.cat, active ? styles.catOn : styles.catOff]}>
                    <Text style={[styles.catText, { color: active ? '#fff' : Brand.text }]}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Text style={styles.label}>所在地区</Text>
          <RegionInline province={province} city={city} district={district} showDistrict onChange={(p, c, d) => { setProvince(p); setCity(c); setDistrict(d); }} />

          <Pressable style={[styles.genBtn, genDraft && { opacity: 0.6 }]} onPress={onDraft} disabled={genDraft}>
            {genDraft ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="sparkles" size={18} color="#fff" />}
            <Text style={styles.genBtnText}>{genDraft ? '生成中…' : '生成草稿'}</Text>
          </Pressable>

          <Text style={styles.label}>标题</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="生成后可修改" placeholderTextColor={Brand.textFaint} style={styles.input} maxLength={40} />

          <Text style={styles.label}>内容</Text>
          <TextInput value={body} onChangeText={setBody} placeholder="生成后可修改" placeholderTextColor={Brand.textFaint} style={styles.bodyInput} multiline textAlignVertical="top" />

          <Text style={styles.label}>标签（空格分隔）</Text>
          <TextInput value={tagsText} onChangeText={setTagsText} placeholder="例：登山 白云山 中老年友好" placeholderTextColor={Brand.textFaint} style={styles.input} />

          <Text style={styles.label}>配图描述</Text>
          <TextInput value={imgPrompt} onChangeText={setImgPrompt} placeholder="生成草稿后自动填充，可修改" placeholderTextColor={Brand.textFaint} style={styles.input} />
          <Pressable style={[styles.genBtnAlt, genImg && { opacity: 0.6 }]} onPress={onImage} disabled={genImg}>
            {genImg ? <ActivityIndicator color={Brand.green} size="small" /> : <Ionicons name="image-outline" size={18} color={Brand.green} />}
            <Text style={styles.genBtnAltText}>{genImg ? '生成中…约20-40秒' : '生成配图'}</Text>
          </Pressable>
          {!!imageUrl && (
            <View style={styles.previewWrap}>
              <Image source={{ uri: imageUrl }} style={styles.preview} contentFit="cover" />
              <Pressable style={styles.removeImg} onPress={() => setImageUrl('')} hitSlop={6}>
                <Ionicons name="close-circle" size={24} color="#333" />
              </Pressable>
            </View>
          )}

          <Pressable style={[styles.publishBtn, publishing && { opacity: 0.6 }]} onPress={onPublish} disabled={publishing}>
            {publishing ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishText}>发布到内容流</Text>}
          </Pressable>
          <Text style={styles.hint}>发布后作者为当前管理员账号。建议逐条审核内容真实性后再发布。</Text>
        </ScrollView>
      </SafeAreaView>
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
  content: { padding: S.lg, gap: S.sm, paddingBottom: S.xxl },
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: '#FDECEA',
    borderRadius: R.md,
    padding: S.md,
    marginBottom: S.sm,
  },
  warnText: { flex: 1, fontSize: F.small, color: Brand.danger, lineHeight: 18 },
  label: { fontSize: F.sub, fontWeight: '700', color: Brand.text, marginTop: S.md },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    paddingHorizontal: S.lg,
    height: 50,
    fontSize: F.body,
    color: Brand.text,
  },
  bodyInput: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    padding: S.lg,
    minHeight: 160,
    fontSize: F.body,
    color: Brand.text,
    lineHeight: 24,
  },
  catBox: { height: 54 },
  catRow: { flexDirection: 'row', gap: S.sm, alignItems: 'center', paddingRight: S.lg },
  cat: { paddingHorizontal: S.lg, paddingVertical: 9, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  catOn: { backgroundColor: Brand.green },
  catOff: { backgroundColor: '#E7EAEC' },
  catText: { fontSize: F.sub, fontWeight: '700', lineHeight: 22, includeFontPadding: false },
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    backgroundColor: Brand.green,
    borderRadius: R.pill,
    height: 50,
    marginTop: S.lg,
  },
  genBtnText: { color: '#fff', fontSize: F.body, fontWeight: '800' },
  genBtnAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    borderWidth: 1.5,
    borderColor: Brand.green,
    backgroundColor: Brand.greenSoft,
    borderRadius: R.pill,
    height: 46,
    marginTop: S.sm,
  },
  genBtnAltText: { color: Brand.greenDark, fontSize: F.sub, fontWeight: '800' },
  previewWrap: { marginTop: S.md, alignSelf: 'flex-start' },
  preview: { width: 200, height: 200, borderRadius: R.md, backgroundColor: Brand.bg },
  removeImg: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 999 },
  publishBtn: {
    backgroundColor: Brand.green,
    borderRadius: R.pill,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: S.xl,
  },
  publishText: { color: '#fff', fontSize: F.body, fontWeight: '800' },
  hint: { fontSize: F.small, color: Brand.textSub, marginTop: S.sm, lineHeight: 18 },
});
