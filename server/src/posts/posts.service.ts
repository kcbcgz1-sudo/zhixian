import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus } from '@prisma/client';
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
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string) {
    const isCat = category && category !== 'all';
    const posts = await this.prisma.post.findMany({
      where: { status: PostStatus.published, ...(isCat ? { category } : {}) },
      orderBy: [{ trustScore: 'desc' }, { createdAt: 'desc' }],
      include: { author: true },
    });
    return posts.map((p) => this.shape(p));
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id }, include: { author: true } });
    if (!post) throw new NotFoundException('post not found');
    return this.shape(post);
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

    const body = dto.body.trim();
    const tags = Array.from(new Set([...(dto.tags ?? []), ...extractHashtags(body)]));
    const media = Array.isArray(dto.media) ? dto.media : [];
    const cover = media.find((m) => m.type === 'image')?.url ?? media[0]?.url ?? null;

    const post = await this.prisma.post.create({
      data: {
        authorId: author.id,
        category: cat,
        title: dto.title.trim(),
        body,
        district: dto.district?.trim() || null,
        attributes: { tags, media, cover, authorTitle: '新人', aiImage: false },
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

  private shape(p: any) {
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
      comments: typeof a.comments === 'number' ? a.comments : 0,
      likes: a.likes != null ? String(a.likes) : '0',
      date: d.toISOString().slice(0, 10).replace(/-/g, '.'),
      body: p.body,
      aiImage: a.aiImage === true,
      cover: a.cover ?? media.find((m) => m.type === 'image')?.url ?? null,
      media,
    };
  }
}
