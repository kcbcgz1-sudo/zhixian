// 知闲 · API 클라이언트
// 앱이 홍콩 서버(NestJS)에서 데이터를 가져온다. 시드(더미) 대신 실제 API 사용.
import type { Category, Post } from './seed';

// 서버 주소 (도메인 + HTTPS)
export const API_BASE = 'https://app.emilano.net/api';

// 목록
export async function fetchPosts(category: Category | 'all'): Promise<Post[]> {
  const url =
    category === 'all' ? `${API_BASE}/posts` : `${API_BASE}/posts?category=${category}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post[];
}

// 상세
export async function fetchPost(id: string): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Post;
}
