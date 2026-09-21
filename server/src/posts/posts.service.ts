import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InteractionType, PostStatus } from '@prisma/client';
import { LevelsService } from '../levels/levels.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type MediaItem = { url: string; type: string };
export type CreatePostDto = {
  category: string;
  title: string;
  body: string;
  district?: string;
  tags?: string[];
  media?: MediaItem[];
};

function extractHashtags(body: string): string[] {
  const m = body.match(/#[^\s#]+/g) ?? [];
  return Array.from(new Set(m));
}
function makeExcerpt(body: string): string {
  const t = body.replace(/#[^\s#]+/g, '').replace(/\s+/g, ' ').trim();
  return t.length > 60 ? t.slice(0, 60) + '…' : t;
}

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly levels: LevelsService,
  ) {}

  async findAll(category?: string) {
    const isCat = category && category !== 'all';
    const posts = await this.prisma.post.findMany({
      where: { status: PostStatus.published, ...(isCat ? { category } : {}) },
      orderBy: [{ trustScore: 'desc' }, { createdAt: 'desc' }],
      include: { author: true },
    });
    const counts = await this.prisma.interaction.groupBy({
      by: ['postId'],
      where: { type: InteractionType.comment, postId: { in: posts.map((p) => p.id) } },
      _count: { _all: true },
    });
    const cmap = new Map<string, number>(counts.map((c: any) => [c.postId, c._count._all]));
    return posts.map((p) => this.shape(p, cmap.get(p.id) ?? 0));
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id }, include: { author: true } });
    if (!post) throw new NotFoundException('post not found');
    const cnt = await this.prisma.interaction.count({
      where: { postId: id, type: InteractionType.comment },
    });
    return this.shape(post, cnt);
  }

  // ── 댓글 ──
  private shapeComment(r: any) {
    return {
      id: r.id,
      content: r.content ?? '',
      author: r.user?.nickname ?? '',
      authorLevel: r.user?.level ?? 1,
      date: r.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    };
  }

  async listComments(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('post not found');
    const rows = await this.prisma.interaction.findMany({
      where: { postId, type: InteractionType.comment },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
    return rows.map((r) => this.shapeComment(r));
  }

  async addComment(postId: string, content: string, authorId?: string | null) {
    const text = String(content ?? '').trim();
    if (!text) throw new BadRequestException('内容必填');
    if (text.length > 500) throw new BadRequestException('评论过长（最多500字）');
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('post not found');
    if (!authorId) throw new ForbiddenException('请先登录');
    const user = await this.prisma.user.findUnique({ where: { id: authorId } });
    if (!user) throw new ForbiddenException('请先登录');
    if (user.status === 'banned') throw new ForbiddenException('账号已被封禁');

    // 댓글 권한: 카테고리 commentMinLevel (관리자 예외)
    const cat = await this.prisma.category.findFirst({ where: { code: post.category } });
    const minLv = cat?.commentMinLevel ?? 1;
    if ((user.role ?? 'user') !== 'admin' && (user.level ?? 1) < minLv) {
      throw new ForbiddenException(`该分类需要 Lv${minLv} 才能评论`);
    }

    const c = await this.prisma.interaction.create({
      data: { postId, userId: user.id, type: InteractionType.comment, content: text },
      include: { user: true },
    });
    return this.shapeComment(c);
  }

  async create(dto: CreatePostDto, authorId?: string | null) {
    const cat = String(dto.category);
    const catRow = await this.prisma.category.findFirst({ where: { code: cat, active: true } });
    if (!catRow) throw new BadRequestException('bad category');
    if (!dto.title?.trim() || !dto.body?.trim())
      throw new BadRequestException('title/body required');

    // 로그인 사용자면 그 계정, 아니면 임시 '我'
    let author = authorId
      ? await this.prisma.user.findUnique({ where: { id: authorId } })
      : null;
    if (!author) {
      author =
        (await this.prisma.user.findFirst({ where: { nickname: '我' } })) ??
        (await this.prisma.user.create({ data: { nickname: '我', city: '广州' } }));
    }

    // 발제 권한: 회원레벨 ≥ 카테고리 writeMinLevel (관리자는 예외)
    if ((author.role ?? 'user') !== 'admin' && (author.level ?? 1) < catRow.writeMinLevel) {
      throw new ForbiddenException(`该分类需要 Lv${catRow.writeMinLevel} 才能发帖`);
    }

    const body = dto.body.trim();
    const tags = Array.from(new Set([...(dto.tags ?? []), ...extractHashtags(body)]));
    const media = Array.isArray(dto.media) ? dto.media : [];
    const cover = media.find((m) => m.type === 'image')?.url ?? media[0]?.url ?? null;
    const authorTitle = await this.levels.titleFor(author.level ?? 1);

    const post = await this.prisma.post.create({
      data: {
        authorId: author.id,
        category: cat,
        title: dto.title.trim(),
        body,
        district: dto.district?.trim() || null,
        attributes: { tags, media, cover, authorTitle, aiImage: false },
        isQuality: media.length > 0,
        qualityScore: media.length > 0 ? 30 : 0,
        trustScore: 100,
        status: PostStatus.published,
        publishedAt: new Date(),
      },
      include: { author: true },
    });
    return this.shape(post);
  }

  private shape(p: any, commentCount = 0) {
    const a = (p.attributes ?? {}) as Record<string, any>;
    const d: Date = p.publishedAt ?? p.createdAt;
    const media: MediaItem[] = Array.isArray(a.media) ? a.media : [];
    return {
      id: p.id,
      category: p.category,
      title: p.title,
      district: p.district ?? null,
      tags: Array.isArray(a.tags) ? a.tags : [],
      excerpt: makeExcerpt(p.body),
      author: p.author?.nickname ?? '',
      authorTitle: a.authorTitle ?? '',
      comments: commentCount,
      likes: a.likes != null ? String(a.likes) : '0',
      date: d.toISOString().slice(0, 10).replace(/-/g, '.'),
      body: p.body,
      aiImage: a.aiImage === true,
      cover: a.cover ?? media.find((m) => m.type === 'image')?.url ?? null,
      media,
    };
  }
}
