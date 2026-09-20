// 知闲 · 시드(더미) 데이터 — 홈 피드 + 상세에서 공용으로 사용.
// 나중에 백엔드(NestJS) API 응답으로 교체할 예정. 구조는 docs/02 데이터모델을 단순화.

export type Category = 'fishing' | 'hiking' | 'stay';

// 필터 칩(피그마 디자인 기준: All / 登山 / 钓鱼 / 短租)
export const FILTERS: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hiking', label: '登山' },
  { key: 'fishing', label: '钓鱼' },
  { key: 'stay', label: '短租' },
];

export type Post = {
  id: string;
  category: Category;
  title: string;
  district: string;
  tags: string[];
  author: string;
  authorTitle: string;
  comments: number;
  likes: string; // '3.2k' 처럼 표시용
  date: string;
  body: string;
  aiImage: boolean; // AI生成 워터마크 표시
};

export const POSTS: Post[] = [
  {
    id: '1',
    category: 'hiking',
    title: '白云山摩星岭轻松线：8km缓坡，补给点多，适合慢走',
    district: '白云区',
    tags: ['免费', '8km', '爬升400m', '有补给', '中老年友好'],
    author: '老陈',
    authorTitle: '青山闲步',
    comments: 32,
    likes: '3.2k',
    date: '2026.09.20',
    body: '攀登白云山摩星岭，沿途林木繁茂，山风带着草木清香，石阶有几段稍陡，走起来微微出汗。登顶后视野豁然开朗，羊城风光展眼前，珠江与城市楼宇尽收眼底。站在观景台吹着清风，一路的疲惫尽数消散。这里难度适中，既能感受山林幽静，又可俯瞰全城，是广州休闲登山的好去处。',
    aiImage: true,
  },
  {
    id: '2',
    category: 'fishing',
    title: '从化流溪河水库野钓实测：鲮鱼上货快，免费好停车',
    district: '从化',
    tags: ['免费', '水库', '鲮鱼·罗非', '有停车', '中老年友好'],
    author: '珠江钓叟',
    authorTitle: '江河钓客',
    comments: 18,
    likes: '1.1k',
    date: '2026.09.19',
    body: '流溪河水库水质清澈，岸边平坦好落座，适合带折叠椅慢钓一天。鲮鱼、罗非上货都快，早晚时段最佳。免费停车就在坝边，走几步就到钓位，对上了年纪的钓友很友好。提醒：雨后水位上涨要注意脚下湿滑。',
    aiImage: true,
  },
  {
    id: '3',
    category: 'hiking',
    title: '帽峰山森林公园：负氧离子拉满，缓坡步道很好走',
    district: '太和',
    tags: ['免费', '6km', '林道', '有厕所', '公交可达'],
    author: '云山客',
    authorTitle: '浅山漫步',
    comments: 25,
    likes: '2.4k',
    date: '2026.09.18',
    body: '帽峰山植被茂密，空气清新，步道多为缓坡林道，走起来不费劲。沿途有休息亭和厕所，配套齐全。公交可直达山脚，不用自驾也方便。适合周末约上三五同好慢慢走、慢慢聊。',
    aiImage: true,
  },
];

export function getPost(id: string): Post | undefined {
  return POSTS.find((p) => p.id === id);
}
