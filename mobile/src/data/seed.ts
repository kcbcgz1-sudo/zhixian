// 知闲 · 타입 + 필터. (데이터는 서버 API에서 가져옴; POSTS는 초기 참고용)
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
  author: string;
  authorTitle: string;
  comments: number;
  likes: string;
  date: string;
  body: string;
  aiImage: boolean;
  cover?: string | null; // 대표 이미지 URL
  media?: MediaItem[]; // 업로드된 이미지/동영상
};

// 발제 화면에서 쓰는 카테고리 선택지(短租는 MVP 후순위)
export const POST_CATEGORIES: { key: Category; label: string }[] = [
  { key: 'fishing', label: '钓鱼' },
  { key: 'hiking', label: '登山徒步' },
];
