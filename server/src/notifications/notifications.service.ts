import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type NotifOpts = {
  title?: string;
  actorId?: string;
  actorName?: string;
  postId?: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // 알림 생성 (내부 훅에서 호출) — 실패는 조용히 무시(본 작업 우선)
  async create(userId: string | null | undefined, type: string, body: string, opts: NotifOpts = {}) {
    if (!userId) return;
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          type,
          body,
          title: opts.title ?? null,
          actorId: opts.actorId ?? null,
          actorName: opts.actorName ?? null,
          postId: opts.postId ?? null,
        },
      });
    } catch {
      // 알림 생성 실패는 무시
    }
  }

  private shape(n: any) {
    return {
      id: n.id,
      type: n.type,
      title: n.title ?? '',
      body: n.body,
      actorName: n.actorName ?? '',
      postId: n.postId ?? null,
      read: n.read,
      date: n.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    };
  }

  async list(userId: string, limit?: number, offset?: number) {
    const take = Math.min(Math.max(Number(limit) || 30, 1), 50);
    const skip = Math.max(Number(offset) || 0, 0);
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    return rows.map((n) => this.shape(n));
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, read: false } });
    return { count };
  }

  async markRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
    return { ok: true };
  }

  async markAll(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return { ok: true };
  }

  // 회원 간 私信 (알림 형태, 단방향)
  async sendDm(fromUserId: string, toUserId: string, body: string) {
    const text = String(body ?? '').trim();
    if (!text) throw new BadRequestException('内容必填');
    if (text.length > 300) throw new BadRequestException('内容过长（最多300字）');
    if (!toUserId || toUserId === fromUserId) throw new BadRequestException('收件人有误');
    const from = await this.prisma.user.findUnique({ where: { id: fromUserId } });
    const to = await this.prisma.user.findUnique({ where: { id: toUserId } });
    if (!from || !to) throw new NotFoundException('用户不存在');
    await this.create(toUserId, 'dm', text, {
      title: from.nickname,
      actorId: from.id,
      actorName: from.nickname,
    });
    return { ok: true };
  }
}
