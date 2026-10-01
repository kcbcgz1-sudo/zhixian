// 知闲 · 帖子详情 — 서버 연동 + 이미지/동영상 표시
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  createComment,
  deleteComment,
  deletePost,
  fetchCategories,
  fetchComments,
  fetchPost,
  toggleFavorite,
  toggleLike,
  sendDm,
  type Comment,
} from '@/data/api';
import { useAuth } from '@/data/auth';
import type { Post } from '@/data/seed';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [commentMinLevel, setCommentMinLevel] = useState(1);
  const [dmOpen, setDmOpen] = useState(false);
  const [dmText, setDmText] = useState('');
  const [dmSending, setDmSending] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await fetchPost(id ?? '');
        if (alive) {
          setPost(p);
          setLiked(!!p.liked);
          setFavorited(!!p.favorited);
          setLikeCount(Number(p.likes) || 0);
          setFavCount(p.favorites ?? 0);
        }
        try {
          const cats = await fetchCategories();
          const cat = cats.find((c) => c.code === p.category);
          if (alive && cat) setCommentMinLevel(cat.commentMinLevel);
        } catch {}
      } catch {
        if (alive) setPost(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    fetchComments(id ?? '')
      .then((list) => setComments(list))
      .catch(() => {});
  }, [id]);

  const canComment = !user || user.role === 'admin' || user.level >= commentMinLevel;

  async function submitDm() {
    const text = dmText.trim();
    if (!text || !post?.authorId) return;
    setDmSending(true);
    try {
      await sendDm(post.authorId, text);
      setDmOpen(false);
      setDmText('');
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('私信已发送');
      else Alert.alert('已发送', '私信已发送');
    } catch (e: any) {
      const m = String(e?.message ?? '发送失败');
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(m);
      else Alert.alert('发送失败', m);
    } finally {
      setDmSending(false);
    }
  }

  async function sendComment() {
    if (!user) {
      router.push('/login' as any);
      return;
    }
    const t = commentText.trim();
    if (!t) return;
    setSending(true);
    try {
      const c = await createComment(id ?? '', t);
      setComments((prev) => [c, ...prev]);
      setCommentText('');
    } catch (e: any) {
      Alert.alert('评论失败', String(e?.message ?? '请重试'));
    } finally {
      setSending(false);
    }
  }

  async function onLike() {
    if (!user) {
      router.push('/login' as any);
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      const r = await toggleLike(id ?? '');
      setLiked(r.liked);
      setLikeCount(r.likes);
    } catch {
      setLiked(!next);
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
    }
  }

  async function onFavorite() {
    if (!user) {
      router.push('/login' as any);
      return;
    }
    const next = !favorited;
    setFavorited(next);
    setFavCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      const r = await toggleFavorite(id ?? '');
      setFavorited(r.favorited);
      setFavCount(r.favorites);
    } catch {
      setFavorited(!next);
      setFavCount((c) => Math.max(0, c + (next ? -1 : 1)));
    }
  }

  const isAdmin = user?.role === 'admin';
  const canDeletePost = !!post && (post.mine || isAdmin);

  function onDeletePost() {
    const run = async () => {
      try {
        await deletePost(id ?? '');
        router.back();
      } catch (e: any) {
        Alert.alert('删除失败', String(e?.message ?? '请重试'));
      }
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('确定删除这条内容？不可恢复。')) run();
      return;
    }
    Alert.alert('删除内容', '确定删除这条内容？不可恢复。', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: run },
    ]);
  }

  function onDeleteComment(c: Comment) {
    const run = async () => {
      try {
        await deleteComment(id ?? '', c.id);
        setComments((prev) => prev.filter((x) => x.id !== c.id));
      } catch (e: any) {
        Alert.alert('删除失败', String(e?.message ?? '请重试'));
      }
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('确定删除这条评论？')) run();
      return;
    }
    Alert.alert('删除评论', '确定删除这条评论？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: run },
    ]);
  }

  const media = post?.media ?? [];
  const images = media.filter((m) => m.type === 'image');
  const videoUri = media.find((m) => m.type === 'video')?.url ?? null;
  const player = useVideoPlayer(videoUri, (p: any) => {
    p.loop = false;
  });

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={Brand.text} />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            {canDeletePost && (
              <Pressable onPress={() => post && router.push(`/post-new?id=${post.id}` as any)} hitSlop={10}>
                <Ionicons name="create-outline" size={24} color={Brand.text} />
              </Pressable>
            )}
            <Pressable onPress={() => router.replace('/' as any)} hitSlop={10}>
              <Ionicons name="home-outline" size={24} color={Brand.text} />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Brand.green} size="large" />
          </View>
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {/* 미디어 */}
              {videoUri ? (
                <VideoView player={player} style={styles.hero} contentFit="cover" nativeControls />
              ) : images.length > 0 ? (
                <Image source={{ uri: images[0].url }} style={styles.hero} contentFit="cover" />
              ) : (
                <LinearGradient colors={['#CDEBD6', '#9FD7B4']} style={styles.hero}>
                  <Ionicons name="image-outline" size={40} color="#5FA277" />
                  {post?.aiImage && (
                    <View style={styles.aiTag}>
                      <Text style={styles.aiTagText}>AI生成</Text>
                    </View>
                  )}
                </LinearGradient>
              )}

              {/* 추가 이미지 */}
              {images.slice(videoUri ? 0 : 1).map((img, i) => (
                <Image key={i} source={{ uri: img.url }} style={styles.subImg} contentFit="cover" />
              ))}

              <Text style={styles.title}>{post?.title ?? '内容不存在'}</Text>
              {post?.date ? <Text style={styles.date}>{post.date}</Text> : null}

              {post?.authorId ? (
                <Pressable
                  style={styles.authorRow}
                  onPress={() => router.push(`/user/${post.authorId}` as any)}>
                  {post.authorAvatar ? (
                    <Image source={{ uri: post.authorAvatar }} style={styles.authorAvatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.authorAvatar, styles.authorAvatarFallback]}>
                      <Ionicons name="person" size={18} color="#fff" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={styles.authorNameRow}>
                      <Text style={styles.authorName} numberOfLines={1}>{post.author}</Text>
                      {post.authorVerified ? (
                        <View style={styles.vBadge}>
                          <Ionicons name="shield-checkmark" size={10} color="#fff" />
                          <Text style={styles.vBadgeText}>实名</Text>
                        </View>
                      ) : (
                        <View style={styles.vBadgeOff}>
                          <Text style={styles.vBadgeOffText}>未实名</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.authorMeta} numberOfLines={1}>
                      Lv{post.authorLevel ?? 1}
                      {post.authorTitle ? ` · ${post.authorTitle}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Brand.textFaint} />
                </Pressable>
              ) : null}

              {post?.body ? <Text style={styles.body}>{post.body}</Text> : null}

              {/* 댓글 */}
              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>
                  评论{comments.length ? ` ${comments.length}` : ''}
                </Text>
                {comments.map((c) => (
                  <View key={c.id} style={styles.commentItem}>
                    <View style={styles.commentHead}>
                      <Text style={styles.commentAuthor}>{c.author}</Text>
                      <View style={styles.cLvBadge}>
                        <Text style={styles.cLvText}>Lv{c.authorLevel}</Text>
                      </View>
                      <Text style={styles.commentDate}>{c.date}</Text>
                      {(c.mine || isAdmin) && (
                        <Pressable onPress={() => onDeleteComment(c)} hitSlop={8} style={styles.cDel}>
                          <Ionicons name="trash-outline" size={16} color={Brand.textFaint} />
                        </Pressable>
                      )}
                    </View>
                    <Text style={styles.commentBody}>{c.content}</Text>
                  </View>
                ))}
                {comments.length === 0 && (
                  <Text style={styles.noComments}>还没有评论，来抢沙发～</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.commentBar}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                editable={canComment}
                placeholder={canComment ? '写评论…' : `需要 Lv${commentMinLevel} 才能评论`}
                placeholderTextColor={Brand.textFaint}
                maxLength={500}
              />
              <Pressable
                style={[styles.sendBtn, (!canComment || sending) && { opacity: 0.5 }]}
                onPress={sendComment}
                disabled={!canComment || sending}>
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sendText}>发送</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.actions}>
              {canDeletePost ? (
                <Pressable onPress={onDeletePost} hitSlop={8}>
                  <Ionicons name="trash-outline" size={25} color={Brand.danger} />
                </Pressable>
              ) : (
                <Pressable hitSlop={8}>
                  <Ionicons name="ban-outline" size={26} color={Brand.textSub} />
                </Pressable>
              )}
              <View style={styles.actionRight}>
                <Pressable style={styles.actionItem} onPress={onFavorite} hitSlop={8}>
                  <Ionicons
                    name={favorited ? 'bookmark' : 'bookmark-outline'}
                    size={25}
                    color={favorited ? Brand.green : Brand.textSub}
                  />
                  <Text style={[styles.actionLabel, favorited && styles.actionLabelOn]}>{favCount > 0 ? `收藏 ${favCount}` : '收藏'}</Text>
                </Pressable>
                <Pressable style={styles.actionItem} onPress={onLike} hitSlop={8}>
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={28}
                    color={liked ? Brand.green : Brand.textSub}
                  />
                  <Text style={[styles.actionLabel, liked && styles.actionLabelOn]}>{likeCount > 0 ? `赞 ${likeCount}` : '赞'}</Text>
                </Pressable>
                {!post?.mine && !!user && !!post?.authorId && (
                  <Pressable style={styles.actionItem} onPress={() => setDmOpen(true)} hitSlop={8}>
                    <Ionicons name="paper-plane-outline" size={24} color={Brand.textSub} />
                    <Text style={styles.actionLabel}>私信</Text>
                  </Pressable>
                )}
                <Pressable style={styles.actionItem} hitSlop={8}>
                  <Ionicons name="share-social-outline" size={26} color={Brand.textSub} />
                  <Text style={styles.actionLabel}>分享</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </SafeAreaView>
      <Modal visible={dmOpen} transparent animationType="fade" onRequestClose={() => setDmOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 360, gap: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: Brand.text }}>私信 {post?.author}</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: Brand.border, borderRadius: 10, padding: 12, minHeight: 100, fontSize: 15, color: Brand.text, backgroundColor: '#fff' }}
              value={dmText}
              onChangeText={setDmText}
              placeholder="写下要发送的私信…"
              placeholderTextColor={Brand.textFaint}
              multiline
              textAlignVertical="top"
              maxLength={300}
            />
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              <Pressable onPress={() => setDmOpen(false)} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: '#E7EAEC' }}>
                <Text style={{ color: Brand.text, fontWeight: '700' }}>取消</Text>
              </Pressable>
              <Pressable onPress={submitDm} disabled={dmSending} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: Brand.green, opacity: dmSending ? 0.6 : 1 }}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>发送</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.card },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
  },
  content: { paddingHorizontal: S.lg, paddingBottom: S.xl },
  hero: {
    width: '100%',
    height: 300,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  subImg: { width: '100%', height: 240, borderRadius: R.md, marginTop: S.md, backgroundColor: Brand.bg },
  aiTag: {
    position: 'absolute',
    right: S.sm,
    bottom: S.sm,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: S.sm,
    paddingVertical: 2,
    borderRadius: R.sm,
  },
  aiTagText: { color: '#fff', fontSize: F.tiny },
  title: { fontSize: F.h2, fontWeight: '800', color: Brand.text, marginTop: S.lg, lineHeight: 26 },
  date: { fontSize: F.small, color: Brand.textSub, marginTop: S.sm },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    marginTop: S.lg,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    backgroundColor: Brand.bg,
    borderRadius: R.md,
  },
  authorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Brand.card },
  authorAvatarFallback: { backgroundColor: Brand.green, alignItems: 'center', justifyContent: 'center' },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { fontSize: F.body, fontWeight: '800', color: Brand.text, flexShrink: 1 },
  authorMeta: { fontSize: F.small, color: Brand.textSub, marginTop: 1 },
  vBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Brand.green,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  vBadgeText: { color: '#fff', fontSize: F.tiny, fontWeight: '800' },
  vBadgeOff: { backgroundColor: '#E7EAEC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  vBadgeOffText: { color: Brand.textSub, fontSize: F.tiny, fontWeight: '700' },
  body: { fontSize: F.body, color: '#3A3D42', lineHeight: 28, marginTop: S.lg },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  actionRight: { flexDirection: 'row', alignItems: 'flex-end', gap: S.xl },
  actionItem: { flexDirection: 'column', alignItems: 'center', gap: 3 },
  actionCount: { fontSize: F.small, color: Brand.textSub, fontWeight: '600' },
  actionLabel: { fontSize: F.tiny, color: Brand.textSub, fontWeight: '600' },
  actionLabelOn: { color: Brand.green },
  commentsSection: {
    marginTop: S.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
    paddingTop: S.lg,
    gap: S.md,
  },
  commentsTitle: { fontSize: F.body, fontWeight: '800', color: Brand.text },
  commentItem: { gap: 4 },
  commentHead: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  commentAuthor: { fontSize: F.small, fontWeight: '700', color: Brand.text },
  cLvBadge: { backgroundColor: Brand.greenSoft, borderRadius: R.sm, paddingHorizontal: 6, paddingVertical: 1 },
  cLvText: { fontSize: F.tiny, fontWeight: '700', color: Brand.greenDeep },
  commentDate: { fontSize: F.tiny, color: Brand.textFaint },
  cDel: { marginLeft: 'auto' },
  commentBody: { fontSize: F.body, color: '#3A3D42', lineHeight: 22 },
  noComments: { fontSize: F.small, color: Brand.textSub, paddingVertical: S.md },
  commentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.pill,
    paddingHorizontal: S.lg,
    height: 42,
    fontSize: F.body,
    color: Brand.text,
    backgroundColor: Brand.bg,
  },
  sendBtn: {
    backgroundColor: Brand.green,
    borderRadius: R.pill,
    paddingHorizontal: S.lg,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  sendText: { color: '#fff', fontWeight: '700', fontSize: F.body },
});
