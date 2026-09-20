// 知闲 · API 클라이언트
import type { Category, Post } from './seed';

export const API_BASE = 'https://app.emilano.net/api';

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

// 미디어 업로드 (이미지/동영상) → { url, type }
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
    // 웹: blob/data URI → Blob 으로 첨부
    const blob = await (await fetch(asset.uri)).blob();
    form.append('file', blob, name);
  } else {
    // 네이티브: {uri,name,type} 형태로 첨부
    form.append('file', { uri: asset.uri, name, type } as any);
  }
  const res = await fetch(`${API_BASE}/uploads`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`upload ${res.status}`);
  return (await res.json()) as UploadResult;
}

// 글 작성
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`create ${res.status}`);
  return (await res.json()) as Post;
}
