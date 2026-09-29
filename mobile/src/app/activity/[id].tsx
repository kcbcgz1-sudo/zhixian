// 知闲 · 活动详情 + 报名/取消 + 参与者 + 私信
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { injectThinBar } from '@/constants/thinbar';
import {
  cancelActivity,
  cancelSignupActivity,
  fetchActivity,
  sendDm,
  signupActivity,
  type Activity,
} from '@/data/api';
import { useAuth } from '@/data/auth';

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${wk} ${hh}:${mi}`;
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [a, setA] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [note, setNote] = useState('');
  const [dmOpen, setDmOpen] = useState(false);
  const [dmText, setDmText] = useState('');

  useEffect(() => injectThinBar(), []);
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setA(await fetchActivity(String(id)));
    } catch {
      setA(null);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const past = a ? new Date(a.startAt).getTime() < Date.now() : false;
  const closed = a ? a.status === 'cancelled' || a.status === 'closed' || past : false;

  async function doSignup() {
    if (!user) { setSignupOpen(false); Alert.alert('请先登录', '报名前需要登录账号'); router.push('/login' as any); return; }
    setBusy(true);
    try {
      const updated = await signupActivity(String(id), note.trim() || undefined);
      setA(updated);
      setSignupOpen(false);
      setNote('');
    } catch (e: any) {
      Alert.alert('报名失败', String(e?.message ?? '请重试'));
    } finally {
      setBusy(false);
    }
  }

  async function doCancelSignup() {
    const run = async () => {
      setBusy(true);
      try { setA(await cancelSignupActivity(String(id))); }
      catch (e: any) { Alert.alert('操作失败', String(e?.message ?? '请重试')); }
      finally { setBusy(false); }
    };
    if (Platform.OS === 'web') { if (window.confirm('确定取消报名？')) run(); return; }
    Alert.alert('取消报名', '确定取消报名？', [{ text: '再想想', style: 'cancel' }, { text: '取消报名', style: 'destructive', onPress: run }]);
  }

  async function doCancelActivity() {
    const run = async () => {
      setBusy(true);
      try { await cancelActivity(String(id)); router.back(); }
      catch (e: any) { setBusy(false); Alert.alert('操作失败', String(e?.message ?? '请重试')); }
    };
    if (Platform.OS === 'web') { if (window.confirm('确定取消这个活动？报名的伙伴会收到通知。')) run(); return; }
    Alert.alert('取消活动', '确定取消这个活动？报名的伙伴会收到通知。', [{ text: '再想想', style: 'cancel' }, { text: '取消活动', style: 'destructive', onPress: run }]);
  }

  async function doSendDm() {
    if (!a) return;
    if (!dmText.trim()) return;
    setBusy(true);
    try {
      await sendDm(a.organizerId, dmText.trim());
      setDmOpen(false);
      setDmText('');
      Alert.alert('已发送', '私信已发送给发起人');
    } catch (e: any) {
      Alert.alert('发送失败', String(e?.message ?? '请重试'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={Brand.green} size="large" /></View>;
  if (!a) return (
    <View style={styles.center}>
      <Text style={styles.dim}>活动不存在或已被删除</Text>
      <Pressable style={styles.backLink} onPress={() => router.back()}><Text style={styles.backLinkText}>返回</Text></Pressable>
    </View>
  );

  const full = a.full || a.status === 'full';
  const canSignup = !a.mine && !a.joined && !closed && !full;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.bar}>
          <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.text} /></Pressable>
          <Text style={styles.barTitle}>活动详情</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.catBadge}><Text style={styles.catBadgeText}>{a.category}</Text></View>
            {a.status === 'cancelled' && <View style={styles.stBadge}><Text style={styles.stText}>已取消</Text></View>}
            {closed && a.status !== 'cancelled' && <View style={styles.stBadge}><Text style={styles.stText}>{past ? '已开始' : '已结束'}</Text></View>}
            {!closed && full && <View style={[styles.stBadge, { backgroundColor: Brand.danger + '22' }]}><Text style={[styles.stText, { color: Brand.danger }]}>名额已满</Text></View>}
            {!closed && !full && <View style={[styles.stBadge, { backgroundColor: Brand.greenSoft }]}><Text style={[styles.stText, { color: Brand.greenDark }]}>报名中</Text></View>}
          </View>

          <Text style={styles.title}>{a.title}</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}><Ionicons name="time-outline" size={18} color={Brand.green} /><Text style={styles.infoText}>{fmtWhen(a.startAt)}</Text></View>
            <View style={styles.infoRow}><Ionicons name="location-outline" size={18} color={Brand.green} /><Text style={styles.infoText}>{[a.province, a.city, a.district].filter(Boolean).join(' · ')}</Text></View>
            <View style={styles.infoRow}><Ionicons name="flag-outline" size={18} color={Brand.green} /><Text style={styles.infoText}>集合：{a.meetPoint}</Text></View>
            <View style={styles.infoRow}><Ionicons name="people-outline" size={18} color={Brand.green} /><Text style={styles.infoText}>已报名 {a.signupCount}{a.maxParticipants ? ` / ${a.maxParticipants}` : ''} 人{a.maxParticipants ? '' : '（不限）'}</Text></View>
            {!!a.contact && <View style={styles.infoRow}><Ionicons name="call-outline" size={18} color={Brand.green} /><Text style={styles.infoText}>联系方式：{a.contact}</Text></View>}
          </View>

          <View style={styles.orgRow}>
            <View style={styles.orgLeft}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{(a.organizerName || '?').slice(0, 1)}</Text></View>
              <View>
                <Text style={styles.orgName}>{a.organizerName}</Text>
                <Text style={styles.orgSub}>发起人 · Lv{a.organizerLevel}</Text>
              </View>
            </View>
            {!a.mine && !!user && (
              <Pressable style={styles.dmBtn} onPress={() => setDmOpen(true)} hitSlop={8}>
                <Ionicons name="paper-plane-outline" size={16} color={Brand.green} />
                <Text style={styles.dmText}>私信</Text>
              </Pressable>
            )}
          </View>

          {!!a.description && (
            <View style={styles.descCard}><Text style={styles.desc}>{a.description}</Text></View>
          )}

          <Text style={styles.secTitle}>报名的伙伴（{a.participants?.length ?? 0}）</Text>
          {(!a.participants || a.participants.length === 0) ? (
            <Text style={styles.dim}>还没有人报名，快来做第一个吧</Text>
          ) : (
            <View style={styles.pList}>
              {a.participants.map((p) => (
                <View key={p.userId} style={styles.pRow}>
                  <View style={styles.pAvatar}><Text style={styles.pAvatarText}>{(p.nickname || '?').slice(0, 1)}</Text></View>
                  <View style={styles.flex}>
                    <Text style={styles.pName}>{p.nickname} · Lv{p.level}</Text>
                    {!!p.note && <Text style={styles.pNote}>{p.note}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.actionBar}>
          {a.mine ? (
            <Pressable style={[styles.actBtn, styles.actDanger]} onPress={doCancelActivity} disabled={busy || a.status === 'cancelled'}>
              <Text style={styles.actDangerText}>{a.status === 'cancelled' ? '活动已取消' : '取消活动'}</Text>
            </Pressable>
          ) : a.joined ? (
            <Pressable style={[styles.actBtn, styles.actOutline]} onPress={doCancelSignup} disabled={busy}>
              <Text style={styles.actOutlineText}>已报名 · 取消报名</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.actBtn, canSignup ? styles.actPrimary : styles.actDisabled]} onPress={() => canSignup && setSignupOpen(true)} disabled={!canSignup || busy}>
              <Text style={canSignup ? styles.actPrimaryText : styles.actDisabledText}>
                {closed ? '活动已结束' : full ? '名额已满' : '我要报名'}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      <Modal visible={signupOpen} transparent animationType="fade" onRequestClose={() => setSignupOpen(false)}>
        <Pressable style={styles.mOverlay} onPress={() => setSignupOpen(false)}>
          <Pressable style={styles.mCard} onPress={() => {}}>
            <Text style={styles.mTitle}>报名 · 留言给发起人（选填）</Text>
            <TextInput value={note} onChangeText={setNote} placeholder="例：我带装备 / 从XX出发，可拼车" placeholderTextColor={Brand.textFaint} style={styles.mInput} multiline textAlignVertical="top" maxLength={100} />
            <View style={styles.mBtns}>
              <Pressable style={[styles.mBtn, styles.mCancel]} onPress={() => setSignupOpen(false)}><Text style={styles.mCancelText}>再想想</Text></Pressable>
              <Pressable style={[styles.mBtn, styles.mOk]} onPress={doSignup} disabled={busy}>{busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.mOkText}>确认报名</Text>}</Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={dmOpen} transparent animationType="fade" onRequestClose={() => setDmOpen(false)}>
        <Pressable style={styles.mOverlay} onPress={() => setDmOpen(false)}>
          <Pressable style={styles.mCard} onPress={() => {}}>
            <Text style={styles.mTitle}>私信 {a.organizerName}</Text>
            <TextInput value={dmText} onChangeText={setDmText} placeholder="想问的问题，或想说的话…" placeholderTextColor={Brand.textFaint} style={styles.mInput} multiline textAlignVertical="top" maxLength={200} />
            <View style={styles.mBtns}>
              <Pressable style={[styles.mBtn, styles.mCancel]} onPress={() => setDmOpen(false)}><Text style={styles.mCancelText}>取消</Text></Pressable>
              <Pressable style={[styles.mBtn, styles.mOk]} onPress={doSendDm} disabled={busy}>{busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.mOkText}>发送</Text>}</Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.md, backgroundColor: Brand.bg },
  dim: { fontSize: F.sub, color: Brand.textSub },
  backLink: { backgroundColor: Brand.green, paddingHorizontal: S.xl, paddingVertical: 8, borderRadius: R.pill },
  backLinkText: { color: '#fff', fontWeight: '700' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    backgroundColor: Brand.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  barTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
  content: { padding: S.lg, gap: S.md, paddingBottom: S.xxl },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  catBadge: { backgroundColor: Brand.greenSoft, borderRadius: R.sm, paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { color: Brand.greenDark, fontSize: F.small, fontWeight: '700' },
  stBadge: { borderRadius: R.sm, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#EEE' },
  stText: { fontSize: F.small, fontWeight: '800', color: Brand.textFaint },
  title: { fontSize: F.title, fontWeight: '800', color: Brand.text, lineHeight: 28 },
  infoCard: { backgroundColor: Brand.card, borderRadius: R.lg, padding: S.lg, gap: S.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  infoText: { fontSize: F.body, color: Brand.text, flex: 1, lineHeight: 22 },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.card,
    borderRadius: R.lg,
    padding: S.lg,
  },
  orgLeft: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  avatar: { width: 44, height: 44, borderRadius: 999, backgroundColor: Brand.green, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: F.h2, fontWeight: '800' },
  orgName: { fontSize: F.body, fontWeight: '800', color: Brand.text },
  orgSub: { fontSize: F.small, color: Brand.textSub, marginTop: 2 },
  dmBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Brand.green, borderRadius: R.pill, paddingHorizontal: S.md, paddingVertical: 6 },
  dmText: { color: Brand.green, fontSize: F.sub, fontWeight: '700' },
  descCard: { backgroundColor: Brand.card, borderRadius: R.lg, padding: S.lg },
  desc: { fontSize: F.body, color: Brand.text, lineHeight: 24 },
  secTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text, marginTop: S.sm },
  pList: { gap: S.sm },
  pRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: Brand.card, borderRadius: R.md, padding: S.md },
  pAvatar: { width: 36, height: 36, borderRadius: 999, backgroundColor: Brand.greenSoft, alignItems: 'center', justifyContent: 'center' },
  pAvatarText: { color: Brand.greenDark, fontSize: F.body, fontWeight: '800' },
  pName: { fontSize: F.sub, fontWeight: '700', color: Brand.text },
  pNote: { fontSize: F.small, color: Brand.textSub, marginTop: 2 },
  actionBar: {
    flexDirection: 'row',
    padding: S.lg,
    paddingBottom: S.xl,
    backgroundColor: Brand.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  actBtn: { flex: 1, height: 50, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  actPrimary: { backgroundColor: Brand.green },
  actPrimaryText: { color: '#fff', fontSize: F.body, fontWeight: '800' },
  actDisabled: { backgroundColor: '#E7EAEC' },
  actDisabledText: { color: Brand.textFaint, fontSize: F.body, fontWeight: '800' },
  actOutline: { borderWidth: 1.5, borderColor: Brand.green, backgroundColor: Brand.greenSoft },
  actOutlineText: { color: Brand.greenDark, fontSize: F.body, fontWeight: '800' },
  actDanger: { borderWidth: 1.5, borderColor: Brand.danger, backgroundColor: '#fff' },
  actDangerText: { color: Brand.danger, fontSize: F.body, fontWeight: '800' },
  mOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: S.xl },
  mCard: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: R.lg, padding: S.lg, gap: S.md },
  mTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
  mInput: { borderWidth: 1, borderColor: Brand.border, borderRadius: R.md, padding: S.md, minHeight: 80, fontSize: F.body, color: Brand.text, lineHeight: 22 },
  mBtns: { flexDirection: 'row', gap: S.sm },
  mBtn: { flex: 1, height: 46, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  mCancel: { backgroundColor: '#E7EAEC' },
  mCancelText: { color: Brand.text, fontSize: F.body, fontWeight: '700' },
  mOk: { backgroundColor: Brand.green },
  mOkText: { color: '#fff', fontSize: F.body, fontWeight: '800' },
});
