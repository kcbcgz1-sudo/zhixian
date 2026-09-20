import { Injectable } from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const [users, posts, removed, postsToday] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.post.count({ where: { status: PostStatus.removed } }),
      this.prisma.post.count({ where: { createdAt: { gte: startToday } } }),
    ]);
    return { users, posts, removed, postsToday };
  }

  async users() {
    const list = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { posts: true } } },
    });
    return list.map((u: any) => ({
      id: u.id,
      username: u.username,
      nickname: u.nickname,
      email: u.email,
      role: u.role ?? 'user',
      status: u.status,
      points: u.points,
      posts: u._count.posts,
      createdAt: u.createdAt,
    }));
  }

  async setUserStatus(id: string, status: string) {
    await this.prisma.user.update({ where: { id }, data: { status } });
    return { ok: true };
  }

  async posts() {
    const list = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: true },
      take: 200,
    });
    return list.map((p: any) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      status: p.status,
      author: p.author?.nickname ?? '',
      cover: (p.attributes as any)?.cover ?? null,
      createdAt: p.createdAt,
    }));
  }

  async setPostStatus(id: string, status: PostStatus) {
    await this.prisma.post.update({ where: { id }, data: { status } });
    return { ok: true };
  }

  async deletePost(id: string) {
    await this.prisma.interaction.deleteMany({ where: { postId: id } });
    await this.prisma.postImage.deleteMany({ where: { postId: id } });
    await this.prisma.post.delete({ where: { id } });
    return { ok: true };
  }
}
