// 知闲 · 시드 데이터 (앱의 시드와 동일한 3건). 실행: npm run db:seed
import { PrismaClient, Category, PostStatus } from '@prisma/client';

const prisma = new PrismaClient();

type SeedPost = {
  category: Category;
  title: string;
  district: string;
  body: string;
  attributes: Record<string, unknown>;
  trustScore: number;
  authorNickname: string;
  authorTitle: string;
};

const SEED: SeedPost[] = [
  {
    category: Category.hiking,
    title: '白云山摩星岭轻松线：8km缓坡，补给点多，适合慢走',
    district: '白云区',
    body: '攀登白云山摩星岭，沿途林木繁茂，山风带着草木清香，石阶有几段稍陡，走起来微微出汗。登顶后视野豁然开朗，羊城风光展眼前，珠江与城市楼宇尽收眼底。站在观景台吹着清风，一路的疲惫尽数消散。这里难度适中，既能感受山林幽静，又可俯瞰全城，是广州休闲登山的好去处。',
    attributes: { tags: ['免费', '8km', '爬升400m', '有补给', '中老年友好'], aiImage: true, likes: '3.2k', comments: 32 },
    trustScore: 95,
    authorNickname: '老陈',
    authorTitle: '青山闲步',
  },
  {
    category: Category.fishing,
    title: '从化流溪河水库野钓实测：鲮鱼上货快，免费好停车',
    district: '从化',
    body: '流溪河水库水质清澈，岸边平坦好落座，适合带折叠椅慢钓一天。鲮鱼、罗非上货都快，早晚时段最佳。免费停车就在坝边，走几步就到钓位，对上了年纪的钓友很友好。提醒：雨后水位上涨要注意脚下湿滑。',
    attributes: { tags: ['免费', '水库', '鲮鱼·罗非', '有停车', '中老年友好'], aiImage: true, likes: '1.1k', comments: 18 },
    trustScore: 90,
    authorNickname: '珠江钓叟',
    authorTitle: '江河钓客',
  },
  {
    category: Category.hiking,
    title: '帽峰山森林公园：负氧离子拉满，缓坡步道很好走',
    district: '太和',
    body: '帽峰山植被茂密，空气清新，步道多为缓坡林道，走起来不费劲。沿途有休息亭和厕所，配套齐全。公交可直达山脚，不用自驾也方便。适合周末约上三五同好慢慢走、慢慢聊。',
    attributes: { tags: ['免费', '6km', '林道', '有厕所', '公交可达'], aiImage: true, likes: '2.4k', comments: 25 },
    trustScore: 88,
    authorNickname: '云山客',
    authorTitle: '浅山漫步',
  },
];

async function main() {
  // 개발용: 기존 데이터 초기화 후 재생성
  await prisma.interaction.deleteMany();
  await prisma.postImage.deleteMany();
  await prisma.post.deleteMany();

  for (const s of SEED) {
    // nickname 은 unique 가 아니므로: 있으면 재사용, 없으면 생성
    const user =
      (await prisma.user.findFirst({ where: { nickname: s.authorNickname } })) ??
      (await prisma.user.create({ data: { nickname: s.authorNickname, city: '广州' } }));

    await prisma.post.create({
      data: {
        authorId: user.id,
        category: s.category,
        title: s.title,
        body: s.body,
        district: s.district,
        attributes: { ...s.attributes, authorTitle: s.authorTitle },
        isQuality: true,
        qualityScore: 40,
        trustScore: s.trustScore,
        status: PostStatus.published,
        publishedAt: new Date(),
      },
    });
  }

  const count = await prisma.post.count();
  console.log(`✅ seeded. posts = ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
