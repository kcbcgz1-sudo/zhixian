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
export async function fetchPosts(category: Category | 'all', limit?: number, offset?: number, city?: string): Promise<Post[]> {
  const p = new URLSearchParams();
  if (category !== 'all') p.set('category', String(category));
  if (limit != null) p.set('limit', String(limit));
  if (offset != null) p.set('offset', String(offset));
  if (city) p.set('city', city);
  const qs = p.toString();
  const url = `${API_BASE}/posts${qs ? `?${qs}` : ''}`;
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
  province?: string;
  city?: string;
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
export async function updatePost(id: string, data: NewPost): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res, '保存失败'));
  return (await res.json()) as Post;
}

// ── 댓글 ──
export type Comment = {
  id: string;
  content: string;
  author: string;
  authorLevel: number;
  date: string;
  mine?: boolean;
};
export async function fetchComments(postId: string): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Comment[];
}
export async function deleteComment(postId: string, commentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res, '删除失败'));
}

// ── 내 글 / 내 수집 / 삭제 ──
export async function fetchMyPosts(): Promise<Post[]> {
  const res = await fetch(`${API_BASE}/posts/mine`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post[];
}
export async function fetchMyFavorites(): Promise<Post[]> {
  const res = await fetch(`${API_BASE}/posts/favorites`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post[];
}
export async function fetchMyLikes(): Promise<Post[]> {
  const res = await fetch(`${API_BASE}/posts/liked`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post[];
}
export async function searchPosts(q: string): Promise<Post[]> {
  const res = await fetch(`${API_BASE}/posts?q=${encodeURIComponent(q)}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post[];
}
export async function fetchHotKeywords(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/posts/hot-keywords`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as string[];
}
export async function deletePost(postId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/posts/${postId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res, '删除失败'));
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
  province: string;
  points: number;
  level: number;
  title: string;
  avatar: string | null;
  coverImage: string | null;
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
  province?: string;
  city?: string;
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
export async function updateProfile(dto: {
  avatar?: string | null;
  coverImage?: string | null;
}): Promise<PublicUser> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await parseError(res, '保存失败'));
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
  likes: number;
  isQuality: boolean;
  pinned: boolean;
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
  verified: boolean;
  posts: number;
  createdAt: string;
};
export const adminStats = (): Promise<AdminStats> => authFetch('/admin/stats');
export type AdminPostsResult = { items: AdminPost[]; total: number };
export const adminPosts = (params?: {
  q?: string;
  status?: string;
  category?: string;
  flag?: string;
  skip?: number;
  take?: number;
}): Promise<AdminPostsResult> => {
  const p = new URLSearchParams();
  if (params?.q) p.set('q', params.q);
  if (params?.status && params.status !== 'all') p.set('status', params.status);
  if (params?.category && params.category !== 'all') p.set('category', params.category);
  if (params?.flag && params.flag !== 'all') p.set('flag', params.flag);
  if (params?.skip) p.set('skip', String(params.skip));
  if (params?.take) p.set('take', String(params.take));
  const qs = p.toString();
  return authFetch(`/admin/posts${qs ? `?${qs}` : ''}`);
};
export const adminPostRemove = (id: string) => authFetch(`/admin/posts/${id}/remove`, { method: 'POST' });
export const adminPostRestore = (id: string) => authFetch(`/admin/posts/${id}/restore`, { method: 'POST' });
export const adminPostDelete = (id: string) => authFetch(`/admin/posts/${id}`, { method: 'DELETE' });
export const adminPostPin = (id: string, on: boolean) =>
  authFetch(`/admin/posts/${id}/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ on }),
  });
export const adminUsers = (): Promise<AdminUser[]> => authFetch('/admin/users');
export const adminUserBan = (id: string) => authFetch(`/admin/users/${id}/ban`, { method: 'POST' });
export const adminUserUnban = (id: string) => authFetch(`/admin/users/${id}/unban`, { method: 'POST' });
export const adminUserSetLevel = (id: string, level: number) =>
  authFetch(`/admin/users/${id}/level`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level }),
  });
export const adminUserVerify = (id: string, on: boolean) =>
  authFetch(`/admin/users/${id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ on }),
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
export type PointConfig = Record<string, number>;
export const adminPointConfig = (): Promise<PointConfig> => authFetch('/admin/point-config');
export const adminSetPointConfig = (key: string, value: number) =>
  authFetch(`/admin/point-config/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });
export const adminPostQuality = (id: string, on: boolean) =>
  authFetch(`/admin/posts/${id}/quality`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ on }),
  });
export type AdminLevel = { level: number; name: string; minPoints: number };
export const adminLevelsFull = (): Promise<AdminLevel[]> => authFetch('/admin/levels');
export const adminLevelSet = (level: number, name: string, minPoints: number) =>
  authFetch(`/admin/levels/${level}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, minPoints }),
  });
export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  actorName: string;
  postId: string | null;
  read: boolean;
  date: string;
};
export const fetchNotifications = (limit?: number, offset?: number): Promise<AppNotification[]> => {
  const p = new URLSearchParams();
  if (limit != null) p.set('limit', String(limit));
  if (offset != null) p.set('offset', String(offset));
  const qs = p.toString();
  return authFetch(`/notifications${qs ? `?${qs}` : ''}`);
};
export const notifUnreadCount = (): Promise<{ count: number }> => authFetch('/notifications/unread-count');
export const notifMarkRead = (id: string) => authFetch(`/notifications/${id}/read`, { method: 'POST' });
export const notifMarkAll = () => authFetch('/notifications/read-all', { method: 'POST' });
export const sendDm = (toUserId: string, body: string) =>
  authFetch('/notifications/dm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toUserId, body }),
  });
export const adminBroadcast = (
  body: string,
  title?: string,
  userId?: string,
): Promise<{ ok: boolean; count: number }> =>
  authFetch('/admin/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, title, userId }),
  });
export const adminLevelSetName = (level: number, name: string) =>
  authFetch(`/admin/levels/${level}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

// ── 约伴/活动 ──
export type ActivityParticipant = {
  userId: string;
  nickname: string;
  avatar?: string | null;
  level: number;
  note?: string;
  createdAt: string;
};
export type Activity = {
  id: string;
  category: string;
  title: string;
  city?: string | null;
  district?: string | null;
  meetPoint: string;
  startAt: string;
  maxParticipants?: number | null;
  status: string;
  organizerId: string;
  organizerName: string;
  organizerLevel: number;
  signupCount: number;
  joined: boolean;
  mine: boolean;
  full: boolean;
  description?: string;
  province?: string | null;
  contact?: string | null;
  organizerAvatar?: string | null;
  createdAt?: string;
  participants?: ActivityParticipant[];
};
export type NewActivity = {
  category: string;
  title: string;
  description?: string;
  province?: string;
  city?: string;
  district?: string;
  meetPoint: string;
  startAt: string;
  maxParticipants?: number | null;
  contact?: string;
};

async function activityMutate(path: string, opts: RequestInit): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers as any), ...authHeaders() },
  });
  const t = await res.text();
  const data = t ? JSON.parse(t) : null;
  if (!res.ok) throw new Error((data && data.message) || `HTTP ${res.status}`);
  return data;
}

export async function fetchActivities(city?: string, category?: string, limit?: number, offset?: number): Promise<Activity[]> {
  const p = new URLSearchParams();
  if (city) p.set('city', city);
  if (category) p.set('category', category);
  if (limit != null) p.set('limit', String(limit));
  if (offset != null) p.set('offset', String(offset));
  const qs = p.toString();
  return (await authFetch(`/activities${qs ? `?${qs}` : ''}`)) as Activity[];
}
export async function fetchActivity(id: string): Promise<Activity> {
  return (await authFetch(`/activities/${id}`)) as Activity;
}
export async function fetchMyActivities(): Promise<{ organized: Activity[]; joined: Activity[] }> {
  return (await authFetch('/activities/mine')) as { organized: Activity[]; joined: Activity[] };
}
export async function createActivity(body: NewActivity): Promise<Activity> {
  return (await activityMutate('/activities', { method: 'POST', body: JSON.stringify(body) })) as Activity;
}
export async function signupActivity(id: string, note?: string): Promise<Activity> {
  return (await activityMutate(`/activities/${id}/signup`, { method: 'POST', body: JSON.stringify({ note }) })) as Activity;
}
export async function cancelSignupActivity(id: string): Promise<Activity> {
  return (await activityMutate(`/activities/${id}/signup`, { method: 'DELETE' })) as Activity;
}
export async function cancelActivity(id: string): Promise<{ ok: boolean }> {
  return (await activityMutate(`/activities/${id}`, { method: 'DELETE' })) as { ok: boolean };
}

// ── 每日签到(打卡) ──
export type CheckinStatus = {
  checkedToday: boolean;
  streak: number;
  total: number;
  points: number;
  today?: string;
  already?: boolean;
  gained?: number;
  days?: string[];
};
export async function checkinStatus(): Promise<CheckinStatus> {
  return (await authFetch('/checkin/status')) as CheckinStatus;
}
export async function doCheckin(): Promise<CheckinStatus> {
  return (await activityMutate('/checkin', { method: 'POST' })) as CheckinStatus;
}

// ── AI 内容生成(관리자) ──
export type AiDraft = { title: string; body: string; tags: string[] };
export async function aiStatus(): Promise<{ hasKey: boolean }> {
  return (await authFetch('/admin/ai/status')) as { hasKey: boolean };
}
export async function aiDraft(topic: string, category?: string, city?: string): Promise<AiDraft> {
  return (await activityMutate('/admin/ai/draft', {
    method: 'POST',
    body: JSON.stringify({ topic, category, city }),
  })) as AiDraft;
}
export async function aiAssist(input: string, category?: string, city?: string, images?: string[]): Promise<AiDraft> {
  return (await activityMutate('/ai/assist', {
    method: 'POST',
    body: JSON.stringify({ input, category, city, images }),
  })) as AiDraft;
}
export async function aiImage(prompt: string): Promise<{ url: string; type: string }> {
  return (await activityMutate('/admin/ai/image', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })) as { url: string; type: string };
}


// ── 자동생성 심사 (관리자) ──
export type AutogenCatStat = { code: string; name: string; pending: number };
export type AutogenStatus = {
  enabled: boolean;
  hasKey: boolean;
  dailyPerCategory: number;
  pendingCap: number;
  editor: { id: string; nickname: string };
  lastRun: string | null;
  pendingTotal: number;
  perCategory: AutogenCatStat[];
};
export type PendingPost = {
  id: string;
  category: string;
  title: string;
  body: string;
  tags: string[];
  author: string;
  city: string;
  createdAt: string;
  autoGen: boolean;
};
export async function autogenStatus(): Promise<AutogenStatus> {
  return (await authFetch('/admin/autogen/status')) as AutogenStatus;
}
export async function autogenToggle(enabled: boolean): Promise<{ enabled: boolean }> {
  return (await authFetch('/admin/autogen/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })) as { enabled: boolean };
}
export async function autogenRun(): Promise<{ created: number; perCategory?: any[] }> {
  return (await authFetch('/admin/autogen/run', { method: 'POST' })) as any;
}
export async function autogenPending(): Promise<PendingPost[]> {
  return (await authFetch('/admin/autogen/pending')) as PendingPost[];
}
export async function autogenPublish(id: string): Promise<{ ok: boolean }> {
  return (await authFetch(`/admin/autogen/publish/${id}`, { method: 'POST' })) as any;
}
export async function autogenDiscard(id: string): Promise<{ ok: boolean }> {
  return (await authFetch(`/admin/autogen/${id}`, { method: 'DELETE' })) as any;
}
export async function autogenPublishAll(): Promise<{ count: number }> {
  return (await authFetch('/admin/autogen/publish-all', { method: 'POST' })) as { count: number };
}
export async function autogenEdit(id: string, title: string, body: string): Promise<{ ok: boolean }> {
  return (await authFetch(`/admin/autogen/edit/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  })) as { ok: boolean };
}


// ── 공개 사용자 프로필 ──
export type UserProfile = {
  id: string;
  nickname: string;
  avatar: string | null;
  coverImage: string | null;
  level: number;
  title: string;
  city: string | null;
  province: string | null;
  postCount: number;
  verified: boolean;
};
export async function fetchUser(id: string): Promise<UserProfile> {
  return (await authFetch(`/posts/user/${id}`)) as UserProfile;
}
export async function fetchUserPosts(id: string): Promise<Post[]> {
  return (await authFetch(`/posts/user/${id}/posts`)) as Post[];
}

// ── 소셜: 팔로우(关注) + 채팅(私信) ──
export type FollowRelation = { isFollowing: boolean; followers: number; following: number };
export type UserCard = { id: string; nickname: string; avatar: string | null; level: number; verified: boolean };
export type ChatMessage = { id: string; mine: boolean; body: string; date: string };
export type ChatConversation = { id: string; other: UserCard; lastText: string; lastAt: string | null; unread: number };

export const followUser = (id: string) => authFetch(`/social/follow/${id}`, { method: 'POST' });
export const unfollowUser = (id: string) => authFetch(`/social/follow/${id}`, { method: 'DELETE' });
export const getRelation = (id: string): Promise<FollowRelation> => authFetch(`/social/relation/${id}`);
export const getMyFollowing = (): Promise<UserCard[]> => authFetch('/social/following');

export const chatWith = (userId: string): Promise<{ conversationId: string; other: UserCard }> =>
  authFetch('/social/chat/with', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
export const listConversations = (): Promise<ChatConversation[]> => authFetch('/social/chat/conversations');
export const chatUnread = (): Promise<{ count: number }> => authFetch('/social/chat/unread');
export const getChatMessages = (
  convId: string,
): Promise<{ other: UserCard | null; messages: ChatMessage[] }> =>
  authFetch(`/social/chat/${convId}/messages`);
export const sendChatMessage = (convId: string, body: string): Promise<ChatMessage> =>
  authFetch(`/social/chat/${convId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
export const markChatRead = (convId: string) => authFetch(`/social/chat/${convId}/read`, { method: 'POST' });
