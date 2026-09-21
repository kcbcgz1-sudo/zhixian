// 知闲 · 타입. 카테고리/데이터는 서버 API에서.
export type Category = string; // Category.code (동적, 서버 관리)

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
