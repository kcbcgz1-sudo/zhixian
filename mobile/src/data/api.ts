// 知闲 · API 클라이언트 (+ 인증)
import type { Category, Post } from './seed';

export const API_BASE = 'https://app.emilano.net/api';

// ── 토큰 보관 (auth 컨텍스트가 설정) ──
let authToken: string | null = null;
export function setAuthToken(t: string | null) {
  authToken = t;
}
function authHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

// ── 게시글 ──
export async function fetchPosts(category: Category | 'all'): Promise<Post[]> {
  const url =
    category === 'all' ? `${API_BASE}/posts` : `${API_BASE}/posts?category=${category}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post[];
}

export async function fetchPost(id: string): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post;
}

// ── 업로드 ──
export type UploadResult = { url: string; type: string };
export async function uploadMedia(asset: {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}): Promise<UploadResult> {
  const form = new FormData();
  const name = asset.fileName ?? `upload-${Date.now()}`;
  const type = asset.mimeType ?? 'application/octet-stream';
  if (asset.uri.startsWith('blob:') || asset.uri.startsWith('data:')) {
    const blob = await (await fetch(asset.uri)).blob();
    form.append('file', blob, name);
  } else {
    form.append('file', { uri: asset.uri, name, type } as any);
  }
  const res = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(`upload ${res.status}`);
  return (await res.json()) as UploadResult;
}

// ── 글 작성 ──
export type NewPost = {
  category: Category;
  title: string;
  body: string;
  district?: string;
  tags?: string[];
  media?: { url: string; type: string }[];
};
export async function createPost(data: NewPost): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`create ${res.status}`);
  return (await res.json()) as Post;
}

// ── 인증 ──
export type PublicUser = {
  id: string;
  username: string | null;
  email: string | null;
  nickname: string;
  city: string;
  points: number;
  level: number;
  avatar: string | null;
};

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const j = await res.json();
    const m = j?.message;
    return Array.isArray(m) ? m.join(', ') : m || fallback;
  } catch {
    return fallback;
  }
}

export async function authRegister(data: {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}): Promise<{ token: string; user: PublicUser }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res, '注册失败'));
  return res.json();
}

export async function authLogin(data: {
  account: string;
  password: string;
}): Promise<{ token: string; user: PublicUser }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res, '登录失败'));
  return res.json();
}

export async function authMe(): Promise<PublicUser> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error('unauthorized');
  return res.json();
}
