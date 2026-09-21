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

  private async shapeList(posts: any[], userId?: string | null) {
    const ids = posts.map((p) => p.id);
    const grouped = ids.length
      ? await this.prisma.interaction.groupBy({
          by: ['postId', 'type'],
          where: { postId: { in: ids } },
          _count: { _all: true },
        })
      : [];
    const cmap = new Map<string, number>();
    const lmap = new Map<string, number>();
    const fmap = new Map<string, number>();
    for (const g of grouped as any[]) {
      const m =
        g.type === InteractionType.comment
          ? cmap
          : g.type === InteractionType.like
            ? lmap
            : g.type === InteractionType.favorite
              ? fmap
              : null;
      if (m) m.set(g.postId, g._count._all);
    }
    const likedSet = new Set<string>();
    const favSet = new Set<string>();
    if (userId && ids.length) {
      const mine = await this.prisma.interaction.findMany({
        where: {
          userId,
          postId: { in: ids },
          type: { in: [InteractionType.like, InteractionType.favorite] },
        },
      });
      for (const m of mine) {
        if (m.type === InteractionType.like) likedSet.add(m.postId);
        else if (m.type === InteractionType.favorite) favSet.add(m.postId);
      }
    }
    return posts.map((p) =>
      this.shape(p, {
        comments: cmap.get(p.id) ?? 0,
        likes: lmap.get(p.id) ?? 0,
        favorites: fmap.get(p.id) ?? 0,
        liked: likedSet.has(p.id),
        favorited: favSet.has(p.id),
        mine: !!userId && p.authorId === userId,
      }),
    );
  }

  async findAll(category?: string, userId?: string | null) {
    const isCat = category && category !== 'all';
    const posts = await this.prisma.post.findMany({
      where: { status: PostStatus.published, ...(isCat ? { category } : {}) },
      orderBy: [{ trustScore: 'desc' }, { createdAt: 'desc' }],
      include: { author: true },
    });
    return this.shapeList(posts, userId);
  }

  async myPosts(userId?: string | null) {
    if (!userId) throw new ForbiddenException('请先登录');
    const posts = await this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    });
    return this.shapeList(posts, userId);
  }

  async myFavorites(userId?: string | null) {
    if (!userId) throw new ForbiddenException('请先登录');
    const favs = await this.prisma.interaction.findMany({
      where: { userId, type: InteractionType.favorite },
      orderBy: { createdAt: 'desc' },
    });
    const ids = favs.map((f) => f.postId);
    if (!ids.length) return [];
    const posts = await this.prisma.post.findMany({
      where: { id: { in: ids }, status: PostStatus.published },
      include: { author: true },
    });
    const order = new Map(ids.map((id, i) => [id, i]));
    posts.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return this.shapeList(posts, userId);
  }

  async deleteOwnPost(postId: string, userId?: string | null) {
    if (!userId) throw new ForbiddenException('请先登录');
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('post not found');
    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = (me?.role ?? 'user') === 'admin';
    if (!isAdmin && post.authorId !== userId) throw new ForbiddenException('只能删除自己的内容');
    await this.prisma.interaction.deleteMany({ where: { postId } });
    await this.prisma.postImage.deleteMany({ where: { postId } });
    await this.prisma.post.delete({ where: { id: postId } });
    return { ok: true };
  }

  async deleteComment(commentId: string, userId?: string | null) {
    if (!userId) throw new ForbiddenException('请先登录');
    const c = await this.prisma.interaction.findUnique({ where: { id: commentId } });
    if (!c || c.type !== InteractionType.comment) throw new NotFoundException('comment not found');
    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = (me?.role ?? 'user') === 'admin';
    if (!isAdmin && c.userId !== userId) throw new ForbiddenException('只能删除自己的评论');
    await this.prisma.interaction.delete({ where: { id: commentId } });
    return { ok: true };
  }

  async findOne(id: string, userId?: string | null) {
    const post = await this.prisma.post.findUnique({ where: { id }, include: { author: true } });
    if (!post) throw new NotFoundException('post not found');
    const [comments, likes, favorites] = await Promise.all([
      this.prisma.interaction.count({ where: { postId: id, type: InteractionType.comment } }),
      this.prisma.interaction.count({ where: { postId: id, type: InteractionType.like } }),
      this.prisma.interaction.count({ where: { postId: id, type: InteractionType.favorite } }),
    ]);
    let liked = false;
    let favorited = false;
    if (userId) {
      const mine = await this.prisma.interaction.findMany({
        where: {
          postId: id,
          userId,
          type: { in: [InteractionType.like, InteractionType.favorite] },
        },
      });
      liked = mine.some((m) => m.type === InteractionType.like);
      favorited = mine.some((m) => m.type === InteractionType.favorite);
    }
    return this.shape(post, {
      comments,
      likes,
      favorites,
      liked,
      favorited,
      mine: !!userId && post.authorId === userId,
    });
  }

  // ── 좋아요 / 수집 ──
  private async toggle(postId: string, userId: string | null | undefined, type: InteractionType) {
    if (!userId) throw new ForbiddenException('请先登录');
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('post not found');
    const existing = await this.prisma.interaction.findFirst({ where: { postId, userId, type } });
    if (existing) {
      await this.prisma.interaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.interaction.create({ data: { postId, userId, type } });
    }
    const count = await this.prisma.interaction.count({ where: { postId, type } });
    return { on: !existing, count };
  }

  async like(postId: string, userId?: string | null) {
    const r = await this.toggle(postId, userId, InteractionType.like);
    return { liked: r.on, likes: r.count };
  }

  async favorite(postId: string, userId?: string | null) {
    const r = await this.toggle(postId, userId, InteractionType.favorite);
    return { favorited: r.on, favorites: r.count };
  }

  // ── 댓글 ──
  private shapeComment(r: any, requesterId?: string | null) {
    return {
      id: r.id,
      content: r.content ?? '',
      author: r.user?.nickname ?? '',
      authorLevel: r.user?.level ?? 1,
      date: r.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      mine: !!requesterId && r.userId === requesterId,
    };
  }

  async listComments(postId: string, userId?: string | null) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('post not found');
    const rows = await this.prisma.interaction.findMany({
      where: { postId, type: InteractionType.comment },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
    return rows.map((r) => this.shapeComment(r, userId));
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
    return this.shapeComment(c, user.id);
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

  private shape(
    p: any,
    x: {
      comments?: number;
      likes?: number;
      favorites?: number;
      liked?: boolean;
      favorited?: boolean;
      mine?: boolean;
    } = {},
  ) {
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
      comments: x.comments ?? 0,
      likes: String(x.likes ?? 0),
      favorites: x.favorites ?? 0,
      liked: x.liked ?? false,
      favorited: x.favorited ?? false,
      mine: x.mine ?? false,
      status: p.status,
      date: d.toISOString().slice(0, 10).replace(/-/g, '.'),
      body: p.body,
      aiImage: a.aiImage === true,
      cover: a.cover ?? media.find((m) => m.type === 'image')?.url ?? null,
      media,
    };
  }
}
