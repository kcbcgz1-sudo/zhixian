import { BadRequestException, Injectable } from '@nestjs/common';
import { InteractionType, PostStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { PointsService } from '../points/points.service.js';

function clampInt(v: any, min: number, max: number, dflt: number) {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n)) return dflt;
  return Math.max(min, Math.min(max, n));
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
  ) {}

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
      level: u.level ?? 1,
      posts: u._count.posts,
      createdAt: u.createdAt,
    }));
  }

  async setUserStatus(id: string, status: string) {
    await this.prisma.user.update({ where: { id }, data: { status } });
    return { ok: true };
  }

  async setUserLevel(id: string, level: number) {
    const lv = clampInt(level, 1, 10, 1);
    await this.prisma.user.update({ where: { id }, data: { level: lv } });
    return { ok: true, level: lv };
  }

  // ── 포인트 규칙 설정 ──
  async pointConfig() {
    return this.points.config();
  }

  async setPointConfig(key: string, value: number) {
    return this.points.setConfig(key, Number(value));
  }

  // ── 레벨 칭호 + 승급 임계값 관리 ──
  async levelTitles() {
    const rows = await this.prisma.levelTitle.findMany({ orderBy: { level: 'asc' } });
    return rows.map((r: any) => ({ level: r.level, name: r.name, minPoints: r.minPoints ?? 0 }));
  }

  async setLevelTitle(level: number, name: string, minPoints?: number) {
    const lv = clampInt(level, 1, 10, 1);
    const nm = String(name ?? '').trim();
    if (!nm) throw new BadRequestException('称号必填');
    const data: any = { name: nm };
    if (minPoints !== undefined) data.minPoints = clampInt(minPoints, 0, 100000000, 0);
    await this.prisma.levelTitle.upsert({
      where: { level: lv },
      update: data,
      create: { level: lv, ...data },
    });
    return { ok: true };
  }

  async posts() {
    const list = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: true },
      take: 200,
    });
    const ids = list.map((p) => p.id);
    const grp = ids.length
      ? await this.prisma.interaction.groupBy({
          by: ['postId'],
          where: { postId: { in: ids }, type: InteractionType.like },
          _count: { _all: true },
        })
      : [];
    const lmap = new Map<string, number>(grp.map((g: any) => [g.postId, g._count._all]));
    return list.map((p: any) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      status: p.status,
      author: p.author?.nickname ?? '',
      cover: (p.attributes as any)?.cover ?? null,
      likes: lmap.get(p.id) ?? 0,
      isQuality: !!p.isQuality,
      createdAt: p.createdAt,
    }));
  }

  // ── 干货 지정/해제 (좋아요 최소치 게이팅 + 포인트 적립/회수) ──
  async setQuality(postId: string, on: boolean) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new BadRequestException('内容不存在');
    const want = !!on;
    if (want === post.isQuality) return { ok: true, isQuality: post.isQuality };
    if (want) {
      const minLikes = await this.points.value('quality_min_likes');
      const likes = await this.prisma.interaction.count({
        where: { postId, type: InteractionType.like },
      });
      if (likes < minLikes) {
        throw new BadRequestException(`需要 ${minLikes} 个赞才能设为干货（当前 ${likes}）`);
      }
      await this.prisma.post.update({ where: { id: postId }, data: { isQuality: true } });
      await this.points.award(post.authorId, 'quality', postId);
    } else {
      await this.prisma.post.update({ where: { id: postId }, data: { isQuality: false } });
      await this.points.revert(post.authorId, 'quality', postId);
    }
    return { ok: true, isQuality: want };
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

  // ── 카테고리 관리 ──
  async categoriesAll() {
    const list = await this.prisma.category.findMany({
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    });
    const counts = await this.prisma.post.groupBy({ by: ['category'], _count: { _all: true } });
    const map = new Map<string, number>(counts.map((c: any) => [c.category, c._count._all]));
    return list.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      sort: c.sort,
      writeMinLevel: c.writeMinLevel,
      commentMinLevel: c.commentMinLevel,
      active: c.active,
      posts: map.get(c.code) ?? 0,
    }));
  }

  async createCategory(data: {
    code?: string;
    name?: string;
    sort?: number;
    writeMinLevel?: number;
    commentMinLevel?: number;
  }) {
    const code = String(data.code ?? '').trim().toLowerCase();
    const name = String(data.name ?? '').trim();
    if (!/^[a-z0-9_]+$/.test(code)) throw new BadRequestException('代码只能用小写字母/数字/下划线');
    if (!name) throw new BadRequestException('名称必填');
    const exists = await this.prisma.category.findUnique({ where: { code } });
    if (exists) throw new BadRequestException('代码已存在');
    const c = await this.prisma.category.create({
      data: {
        code,
        name,
        sort: clampInt(data.sort, 0, 9999, 0),
        writeMinLevel: clampInt(data.writeMinLevel, 1, 10, 1),
        commentMinLevel: clampInt(data.commentMinLevel, 1, 10, 1),
      },
    });
    return { ok: true, id: c.id };
  }

  async updateCategory(
    id: string,
    data: {
      name?: string;
      sort?: number;
      writeMinLevel?: number;
      commentMinLevel?: number;
      active?: boolean;
    },
  ) {
    const patch: any = {};
    if (data.name !== undefined) {
      const n = String(data.name).trim();
      if (!n) throw new BadRequestException('名称必填');
      patch.name = n;
    }
    if (data.sort !== undefined) patch.sort = clampInt(data.sort, 0, 9999, 0);
    if (data.writeMinLevel !== undefined) patch.writeMinLevel = clampInt(data.writeMinLevel, 1, 10, 1);
    if (data.commentMinLevel !== undefined)
      patch.commentMinLevel = clampInt(data.commentMinLevel, 1, 10, 1);
    if (data.active !== undefined) patch.active = !!data.active;
    await this.prisma.category.update({ where: { id }, data: patch });
    return { ok: true };
  }

  async deleteCategory(id: string) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new BadRequestException('分类不存在');
    const used = await this.prisma.post.count({ where: { category: c.code } });
    if (used > 0) throw new BadRequestException('该分类下有内容，请改为隐藏');
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }
}
