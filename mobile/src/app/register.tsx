// 知闲 · 회원가입 (아이디+이메일+비번) — 성공 시 환영 오버레이 → 홈
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { useAuth } from '@/data/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [welcome, setWelcome] = useState<string | null>(null); // 성공 시 표시할 이름

  async function submit() {
    if (!username.trim() || !email.trim() || !password) {
      setErr('用户名、邮箱、密码为必填');
      return;
    }
    if (password.length < 6) {
      setErr('密码至少6位');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const name = nickname.trim() || username.trim();
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        nickname: nickname.trim() || undefined,
      });
      setWelcome(name); // 이미 로그인 상태 → 환영 오버레이
    } catch (e: any) {
      setErr(e?.message || '注册失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Brand.greenDeep, Brand.green]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.bar}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.brand}>注册</Text>
          <Text style={styles.sub}>加入知闲，和同龄人一起玩好后半生</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>用户名 *</Text>
        <TextInput value={username} onChangeText={setUsername} placeholder="登录用，字母/数字"
          placeholderTextColor={Brand.textFaint} autoCapitalize="none" style={styles.input} />
        <Text style={styles.label}>邮箱 *</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com"
          placeholderTextColor={Brand.textFaint} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <Text style={styles.label}>密码 * (至少6位)</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="密码"
          placeholderTextColor={Brand.textFaint} secureTextEntry style={styles.input} />
        <Text style={styles.label}>昵称 (选填)</Text>
        <TextInput value={nickname} onChangeText={setNickname} placeholder="显示名称，不填则用用户名"
          placeholderTextColor={Brand.textFaint} style={styles.input} />

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>注册并登录</Text>}
        </Pressable>

        <Pressable style={styles.linkRow} onPress={() => router.replace('/login' as any)}>
          <Text style={styles.linkText}>已有账号？</Text>
          <Text style={styles.linkStrong}>去登录</Text>
        </Pressable>
      </ScrollView>

      {/* 가입 성공 환영 오버레이 */}
      {welcome && (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Ionicons name="checkmark-circle" size={60} color={Brand.green} />
            <Text style={styles.cardTitle}>注册成功</Text>
            <Text style={styles.cardMsg}>欢迎，{welcome}！{'\n'}开始分享你的干货吧。</Text>
            <Pressable style={styles.cardBtn} onPress={() => router.replace('/' as any)}>
              <Text style={styles.cardBtnText}>开始使用</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.card },
  header: { paddingBottom: S.xl, borderBottomLeftRadius: R.xl, borderBottomRightRadius: R.xl },
  bar: { paddingHorizontal: S.lg, paddingTop: S.sm },
  brand: { fontSize: 30, fontWeight: '800', color: '#fff', paddingHorizontal: S.lg, marginTop: S.md },
  sub: { fontSize: F.sub, color: 'rgba(255,255,255,0.9)', paddingHorizontal: S.lg, marginTop: 4 },
  form: { padding: S.lg, gap: S.sm, paddingBottom: S.xxl },
  label: { fontSize: F.sub, fontWeight: '700', color: Brand.text, marginTop: S.md },
  input: { borderWidth: 1, borderColor: Brand.border, borderRadius: R.md, paddingHorizontal: S.lg, height: 52, fontSize: F.body, color: Brand.text },
  err: { color: Brand.danger, fontSize: F.small, marginTop: S.sm },
  btn: { marginTop: S.lg, backgroundColor: Brand.green, height: 54, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: F.h2, fontWeight: '800' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: S.lg, gap: 4 },
  linkText: { color: Brand.textSub, fontSize: F.body },
  linkStrong: { color: Brand.green, fontSize: F.body, fontWeight: '700' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: S.xl },
  card: { backgroundColor: '#fff', borderRadius: R.lg, padding: S.xl, alignItems: 'center', gap: S.md, width: '100%', maxWidth: 340 },
  cardTitle: { fontSize: F.title, fontWeight: '800', color: Brand.text },
  cardMsg: { fontSize: F.body, color: Brand.textSub, textAlign: 'center', lineHeight: 24 },
  cardBtn: { marginTop: S.sm, backgroundColor: Brand.green, height: 50, borderRadius: R.md, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  cardBtnText: { color: '#fff', fontSize: F.h2, fontWeight: '800' },
});
