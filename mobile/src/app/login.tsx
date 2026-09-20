// 知闲 · 로그인
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { useAuth } from '@/data/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!account.trim() || !password) {
      setErr('请输入账号和密码');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await login(account.trim(), password);
      router.replace('/' as any);
    } catch (e: any) {
      setErr(e?.message || '登录失败');
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
          <Text style={styles.brand}>知闲</Text>
          <Text style={styles.sub}>登录，开始分享你的干货</Text>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.form}>
        <Text style={styles.label}>用户名 / 邮箱</Text>
        <TextInput
          value={account}
          onChangeText={setAccount}
          placeholder="用户名或邮箱"
          placeholderTextColor={Brand.textFaint}
          autoCapitalize="none"
          style={styles.input}
        />
        <Text style={styles.label}>密码</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="密码"
          placeholderTextColor={Brand.textFaint}
          secureTextEntry
          style={styles.input}
        />

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>登录</Text>}
        </Pressable>

        <Pressable style={styles.linkRow} onPress={() => router.replace('/register' as any)}>
          <Text style={styles.linkText}>还没有账号？</Text>
          <Text style={styles.linkStrong}>去注册</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.card },
  header: { paddingBottom: S.xl, borderBottomLeftRadius: R.xl, borderBottomRightRadius: R.xl },
  bar: { paddingHorizontal: S.lg, paddingTop: S.sm },
  brand: { fontSize: 34, fontWeight: '800', color: '#fff', paddingHorizontal: S.lg, marginTop: S.md },
  sub: { fontSize: F.body, color: 'rgba(255,255,255,0.9)', paddingHorizontal: S.lg, marginTop: 4 },
  form: { padding: S.lg, gap: S.sm },
  label: { fontSize: F.sub, fontWeight: '700', color: Brand.text, marginTop: S.md },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    paddingHorizontal: S.lg,
    height: 52,
    fontSize: F.body,
    color: Brand.text,
  },
  err: { color: Brand.danger, fontSize: F.small, marginTop: S.sm },
  btn: {
    marginTop: S.lg,
    backgroundColor: Brand.green,
    height: 54,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: F.h2, fontWeight: '800' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: S.lg, gap: 4 },
  linkText: { color: Brand.textSub, fontSize: F.body },
  linkStrong: { color: Brand.green, fontSize: F.body, fontWeight: '700' },
});
