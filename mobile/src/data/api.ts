// 知闲 · API 클라이언트 (+ 인증 + 관리자)
import type { Category, Post } from './seed';

export const API_BASE = 'https://app.emilano.net/api';

let authToken: string | null = null;
export function setAuthToken(t: string | null) {
  authToken = t;
}
function authHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}
async function authFetch(path: string, opts: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...(opts.headers as any), ...authHeaders() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}

// ── 게시글 ──
export async function fetchPosts(category: Category | 'all'): Promise<Post[]> {
  const url = category === 'all' ? `${API_BASE}/posts` : `${API_BASE}/posts?category=${category}`;
  const res = await fetch(url, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post[];
}
export async function fetchPost(id: string): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${id}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post;
}

// ── 카테고리 ──
export type ApiCategory = {
  code: string;
  name: string;
  sort: number;
  writeMinLevel: number;
  commentMinLevel: number;
};
export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ApiCategory[];
}

// ── 레벨 칭호 ──
export type LevelTitle = { level: number; name: string };
export async function fetchLevels(): Promise<LevelTitle[]> {
  const res = await fetch(`${API_BASE}/levels`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as LevelTitle[];
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
  const res = await fetch(`${API_BASE}/uploads`, { method: 'POST', headers: authHeaders(), body: form });
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
  if (!res.ok) throw new Error(await parseError(res, '发布失败'));
  return (await res.json()) as Post;
}

// ── 댓글 ──
export type Comment = {
  id: string;
  content: string;
  author: string;
  authorLevel: number;
  date: string;
};
export async function fetchComments(postId: string): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Comment[];
}
export async function createComment(postId: string, content: string): Promise<Comment> {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await parseError(res, '评论失败'));
  return (await res.json()) as Comment;
}

// ── 좋아요 / 수집 ──
export async function toggleLike(postId: string): Promise<{ liked: boolean; likes: number }> {
  const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res, '操作失败'));
  return res.json();
}
export async function toggleFavorite(
  postId: string,
): Promise<{ favorited: boolean; favorites: number }> {
  const res = await fetch(`${API_BASE}/posts/${postId}/favorite`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res, '操作失败'));
  return res.json();
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
  role: string;
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

// ── 관리자 ──
export type AdminStats = { users: number; posts: number; removed: number; postsToday: number };
export type AdminPost = {
  id: string;
  title: string;
  category: string;
  status: string;
  author: string;
  cover: string | null;
  createdAt: string;
};
export type AdminUser = {
  id: string;
  username: string | null;
  nickname: string;
  email: string | null;
  role: string;
  status: string;
  points: number;
  level: number;
  posts: number;
  createdAt: string;
};
export const adminStats = (): Promise<AdminStats> => authFetch('/admin/stats');
export const adminPosts = (): Promise<AdminPost[]> => authFetch('/admin/posts');
export const adminPostRemove = (id: string) => authFetch(`/admin/posts/${id}/remove`, { method: 'POST' });
export const adminPostRestore = (id: string) => authFetch(`/admin/posts/${id}/restore`, { method: 'POST' });
export const adminPostDelete = (id: string) => authFetch(`/admin/posts/${id}`, { method: 'DELETE' });
export const adminUsers = (): Promise<AdminUser[]> => authFetch('/admin/users');
export const adminUserBan = (id: string) => authFetch(`/admin/users/${id}/ban`, { method: 'POST' });
export const adminUserUnban = (id: string) => authFetch(`/admin/users/${id}/unban`, { method: 'POST' });
export const adminUserSetLevel = (id: string, level: number) =>
  authFetch(`/admin/users/${id}/level`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level }),
  });

// ── 관리자: 카테고리 관리 ──
export type AdminCategory = {
  id: string;
  code: string;
  name: string;
  sort: number;
  writeMinLevel: number;
  commentMinLevel: number;
  active: boolean;
  posts: number;
};
export type CategoryInput = {
  code?: string;
  name?: string;
  sort?: number;
  writeMinLevel?: number;
  commentMinLevel?: number;
  active?: boolean;
};
export const adminCategories = (): Promise<AdminCategory[]> => authFetch('/admin/categories');
export const adminCategoryCreate = (data: CategoryInput) =>
  authFetch('/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const adminCategoryUpdate = (id: string, data: CategoryInput) =>
  authFetch(`/admin/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const adminCategoryDelete = (id: string) =>
  authFetch(`/admin/categories/${id}`, { method: 'DELETE' });

// ── 관리자: 레벨 칭호 ──
export const adminLevels = (): Promise<LevelTitle[]> => authFetch('/admin/levels');
export const adminLevelSetName = (level: number, name: string) =>
  authFetch(`/admin/levels/${level}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
