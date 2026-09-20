import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Category, PostStatus } from '@prisma/client';
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

const CATEGORIES = ['fishing', 'hiking', 'stay'];

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string) {
    const isCat = category && category !== 'all';
    const posts = await this.prisma.post.findMany({
      where: { status: PostStatus.published, ...(isCat ? { category: category as Category } : {}) },
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

  async create(dto: CreatePostDto) {
    const cat = String(dto.category);
    if (!CATEGORIES.includes(cat)) throw new BadRequestException('bad category');
    if (!dto.title?.trim() || !dto.body?.trim())
      throw new BadRequestException('title/body required');

    // 로그인 전이라 임시 작성자('我') 사용. 로그인 붙으면 교체.
    const author =
      (await this.prisma.user.findFirst({ where: { nickname: '我' } })) ??
      (await this.prisma.user.create({ data: { nickname: '我', city: '广州' } }));

    const media = Array.isArray(dto.media) ? dto.media : [];
    const cover = media.find((m) => m.type === 'image')?.url ?? media[0]?.url ?? null;

    const post = await this.prisma.post.create({
      data: {
        authorId: author.id,
        category: cat as Category,
        title: dto.title.trim(),
        body: dto.body.trim(),
        district: dto.district?.trim() || null,
        attributes: {
          tags: Array.isArray(dto.tags) ? dto.tags : [],
          media,
          cover,
          authorTitle: '新人',
          aiImage: false,
        },
        isQuality: media.length > 0,
        qualityScore: media.length > 0 ? 30 : 0,
        trustScore: 100, // 새 글이 상단에 보이도록
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
