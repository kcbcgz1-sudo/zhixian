// 知闲 · 인증 상태(Context) — 토큰 저장/복원, 로그인/가입/로그아웃
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { authLogin, authMe, authRegister, setAuthToken, type PublicUser } from './api';

type AuthContextType = {
  user: PublicUser | null;
  loading: boolean;
  login: (account: string, password: string) => Promise<void>;
  register: (d: { username: string; email: string; password: string; nickname?: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null as any);
const TOKEN_KEY = 'zhixian_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 저장된 토큰 복원
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem(TOKEN_KEY);
        if (t) {
          setAuthToken(t);
          setUser(await authMe());
        }
      } catch {
        setAuthToken(null);
        await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persist(token: string, u: PublicUser) {
    setAuthToken(token);
    await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => {});
    setUser(u);
  }

  const login = async (account: string, password: string) => {
    const r = await authLogin({ account, password });
    await persist(r.token, r.user);
  };
  const register = async (d: { username: string; email: string; password: string; nickname?: string }) => {
    const r = await authRegister(d);
    await persist(r.token, r.user);
  };
  const logout = async () => {
    setAuthToken(null);
    await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
