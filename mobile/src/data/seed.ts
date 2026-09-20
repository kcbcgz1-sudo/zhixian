// 知闲 · 타입 + 필터. 데이터는 서버 API에서.
export type Category = 'fishing' | 'hiking' | 'stay';

export const FILTERS: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hiking', label: '登山' },
  { key: 'fishing', label: '钓鱼' },
  { key: 'stay', label: '短租' },
];

export type MediaItem = { url: string; type: string };

export type Post = {
  id: string;
  category: Category;
  title: string;
  district: string | null;
  tags: string[];
  excerpt?: string; // 제목 밑 간략설명(본문 요약, #태그 제외)
  author: string;
  authorTitle: string;
  comments: number;
  likes: string;
  date: string;
  body: string;
  aiImage: boolean;
  cover?: string | null;
  media?: MediaItem[];
};

export const POST_CATEGORIES: { key: Category; label: string }[] = [
  { key: 'fishing', label: '钓鱼' },
  { key: 'hiking', label: '登山徒步' },
];
