import { Injectable, NotFoundException } from '@nestjs/common';
import { Category, PostStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

// 앱(RN)이 기대하는 응답 형태
export type PostDto = {
  id: string;
  category: string;
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
};

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  // 목록: 垂类 필터 + 可信度(trustScore) 내림차순
  async findAll(category?: string): Promise<PostDto[]> {
    const isCat = category && category !== 'all';
    const posts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.published,
        ...(isCat ? { category: category as Category } : {}),
      },
      orderBy: { trustScore: 'desc' },
      include: { author: true },
    });
    return posts.map((p) => this.shape(p));
  }

  // 상세
  async findOne(id: string): Promise<PostDto> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!post) throw new NotFoundException('post not found');
    return this.shape(post);
  }

  private shape(p: any): PostDto {
    const attrs = (p.attributes ?? {}) as Record<string, any>;
    const d: Date = p.publishedAt ?? p.createdAt;
    return {
      id: p.id,
      category: p.category,
      title: p.title,
      district: p.district ?? null,
      tags: Array.isArray(attrs.tags) ? attrs.tags : [],
      author: p.author?.nickname ?? '',
      authorTitle: attrs.authorTitle ?? '',
      comments: typeof attrs.comments === 'number' ? attrs.comments : 0,
      likes: attrs.likes != null ? String(attrs.likes) : '0',
      date: d.toISOString().slice(0, 10).replace(/-/g, '.'),
      body: p.body,
      aiImage: attrs.aiImage === true,
    };
  }
}
