import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  private userCard(u: any) {
    return {
      id: u.id,
      nickname: u.nickname,
      avatar: u.avatar ?? null,
      level: u.level ?? 1,
      verified: u.verified === true,
    };
  }

  // ───── 팔로우(关注) ─────
  async follow(me: string, targetId: string) {
    if (!targetId || targetId === me) throw new BadRequestException('操作无效');
    const t = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!t) throw new NotFoundException('用户不存在');
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: me, followingId: targetId } },
      update: {},
      create: { followerId: me, followingId: targetId },
    });
    return { ok: true, following: true };
  }

  async unfollow(me: string, targetId: string) {
    await this.prisma.follow.deleteMany({ where: { followerId: me, followingId: targetId } });
    return { ok: true, following: false };
  }

  async relation(me: string | null, targetId: string) {
    const [followers, following, mine] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: targetId } }),
      this.prisma.follow.count({ where: { followerId: targetId } }),
      me ? this.prisma.follow.count({ where: { followerId: me, followingId: targetId } }) : Promise.resolve(0),
    ]);
    return { isFollowing: mine > 0, followers, following };
  }

  async myFollowing(me: string) {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: me },
      orderBy: { createdAt: 'desc' },
      include: { following: true },
    });
    return rows.map((r) => this.userCard(r.following));
  }

  // ───── 채팅 ─────
  private pair(a: string, b: string) {
    return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
  }

  async getOrCreateConversation(me: string, otherId: string) {
    if (!otherId || otherId === me) throw new BadRequestException('操作无效');
    const other = await this.prisma.user.findUnique({ where: { id: otherId } });
    if (!other) throw new NotFoundException('用户不存在');
    const p = this.pair(me, otherId);
    const convo = await this.prisma.conversation.upsert({
      where: { userAId_userBId: p },
      update: {},
      create: p,
    });
    return { conversationId: convo.id, other: this.userCard(other) };
  }

  private async loadConvoForMe(me: string, convId: string) {
    const c = await this.prisma.conversation.findUnique({ where: { id: convId } });
    if (!c) throw new NotFoundException('会话不存在');
    if (c.userAId !== me && c.userBId !== me) throw new ForbiddenException('无权访问');
    return c;
  }

  async listConversations(me: string) {
    const rows = await this.prisma.conversation.findMany({
      where: { OR: [{ userAId: me }, { userBId: me }] },
      orderBy: { lastAt: 'desc' },
      include: { userA: true, userB: true },
      take: 100,
    });
    const out: any[] = [];
    for (const c of rows) {
      const iAmA = c.userAId === me;
      const other = iAmA ? c.userB : c.userA;
      const myReadAt = iAmA ? c.aReadAt : c.bReadAt;
      const unread = await this.prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: me },
          ...(myReadAt ? { createdAt: { gt: myReadAt } } : {}),
        },
      });
      out.push({
        id: c.id,
        other: this.userCard(other),
        lastText: c.lastText ?? '',
        lastAt: c.lastAt ? c.lastAt.toISOString() : null,
        unread,
      });
    }
    return out;
  }

  async getMessages(me: string, convId: string, limit?: number) {
    const c = await this.loadConvoForMe(me, convId);
    const take = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const rows = await this.prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'desc' },
      take,
    });
    const field = c.userAId === me ? { aReadAt: new Date() } : { bReadAt: new Date() };
    await this.prisma.conversation.update({ where: { id: convId }, data: field });
    const otherId = c.userAId === me ? c.userBId : c.userAId;
    const other = await this.prisma.user.findUnique({ where: { id: otherId } });
    return {
      other: other ? this.userCard(other) : null,
      messages: rows
        .reverse()
        .map((m) => ({ id: m.id, mine: m.senderId === me, body: m.body, date: m.createdAt.toISOString() })),
    };
  }

  async sendMessage(me: string, convId: string, body: string) {
    const c = await this.loadConvoForMe(me, convId);
    const text = String(body ?? '').trim();
    if (!text) throw new BadRequestException('内容必填');
    if (text.length > 1000) throw new BadRequestException('内容过长');
    const msg = await this.prisma.message.create({
      data: { conversationId: convId, senderId: me, body: text },
    });
    const now = new Date();
    await this.prisma.conversation.update({
      where: { id: convId },
      data: {
        lastText: text.slice(0, 60),
        lastAt: now,
        ...(c.userAId === me ? { aReadAt: now } : { bReadAt: now }),
      },
    });
    return { id: msg.id, mine: true, body: text, date: now.toISOString() };
  }

  async markRead(me: string, convId: string) {
    const c = await this.loadConvoForMe(me, convId);
    const field = c.userAId === me ? { aReadAt: new Date() } : { bReadAt: new Date() };
    await this.prisma.conversation.update({ where: { id: convId }, data: field });
    return { ok: true };
  }

  async unreadTotal(me: string) {
    const rows = await this.prisma.conversation.findMany({
      where: { OR: [{ userAId: me }, { userBId: me }] },
      select: { id: true, userAId: true, aReadAt: true, bReadAt: true },
    });
    let total = 0;
    for (const c of rows) {
      const myReadAt = c.userAId === me ? c.aReadAt : c.bReadAt;
      total += await this.prisma.message.count({
        where: { conversationId: c.id, senderId: { not: me }, ...(myReadAt ? { createdAt: { gt: myReadAt } } : {}) },
      });
    }
    return { count: total };
  }
}
