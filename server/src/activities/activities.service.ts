import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type CreateActivityDto = {
  category?: string;
  title?: string;
  description?: string;
  province?: string;
  city?: string;
  district?: string;
  meetPoint?: string;
  startAt?: string;
  maxParticipants?: number | null;
  contact?: string;
};

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  private shapeLite(a: any, uid?: string | null) {
    const signups = a.signups ?? [];
    const count = signups.length;
    return {
      id: a.id,
      category: a.category,
      title: a.title,
      city: a.city,
      district: a.district,
      meetPoint: a.meetPoint,
      startAt: a.startAt,
      maxParticipants: a.maxParticipants,
      status: a.status,
      organizerId: a.organizerId,
      organizerName: a.organizer?.nickname ?? '',
      organizerLevel: a.organizer?.level ?? 1,
      signupCount: count,
      joined: uid ? signups.some((s: any) => s.userId === uid) : false,
      mine: uid ? a.organizerId === uid : false,
      full: a.maxParticipants != null && count >= a.maxParticipants,
    };
  }

  private shape(a: any, uid?: string | null) {
    const base = this.shapeLite(a, uid);
    const signups = a.signups ?? [];
    return {
      ...base,
      description: a.description,
      province: a.province,
      contact: a.contact,
      organizerAvatar: a.organizer?.avatar ?? null,
      createdAt: a.createdAt,
      participants: signups.map((s: any) => ({
        userId: s.userId,
        nickname: s.user?.nickname ?? '',
        avatar: s.user?.avatar ?? null,
        level: s.user?.level ?? 1,
        note: s.note ?? '',
        createdAt: s.createdAt,
      })),
    };
  }

  async create(dto: CreateActivityDto, uid: string | null) {
    if (!uid) throw new ForbiddenException('请先登录');
    if (!dto?.title?.trim()) throw new BadRequestException('标题不能为空');
    if (!dto?.meetPoint?.trim()) throw new BadRequestException('集合地点不能为空');
    if (!dto?.startAt) throw new BadRequestException('出发时间不能为空');
    const start = new Date(dto.startAt);
    if (isNaN(start.getTime())) throw new BadRequestException('出发时间格式错误');
    const user = await this.prisma.user.findUnique({ where: { id: uid } });
    if (!user) throw new ForbiddenException('用户不存在');
    const max =
      dto.maxParticipants != null && Number(dto.maxParticipants) > 0
        ? Number(dto.maxParticipants)
        : null;
    const a = await this.prisma.activity.create({
      data: {
        organizerId: uid,
        category: dto.category?.trim() || 'fishing',
        title: dto.title.trim(),
        description: dto.description?.trim() || '',
        province: dto.province?.trim() || user.province || '广东',
        city: dto.city?.trim() || user.city || '广州',
        district: dto.district?.trim() || null,
        meetPoint: dto.meetPoint.trim(),
        startAt: start,
        maxParticipants: max,
        contact: dto.contact?.trim() || null,
        status: 'open',
      },
      include: { organizer: true, signups: { include: { user: true } } },
    });
    return this.shape(a, uid);
  }

  async findAll(
    uid: string | null,
    city?: string,
    category?: string,
    limit?: number,
    offset?: number,
  ) {
    const where: any = { status: { not: 'cancelled' } };
    if (city) where.city = city;
    if (category) where.category = category;
    const list = await this.prisma.activity.findMany({
      where,
      orderBy: { startAt: 'asc' },
      take: limit ?? 30,
      skip: offset ?? 0,
      include: { organizer: true, signups: true },
    });
    return list.map((a) => this.shapeLite(a, uid));
  }

  async findOne(id: string, uid: string | null) {
    const a = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        organizer: true,
        signups: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!a) throw new NotFoundException('活动不存在');
    return this.shape(a, uid);
  }

  async signup(id: string, uid: string | null, note?: string) {
    if (!uid) throw new ForbiddenException('请先登录');
    const a = await this.prisma.activity.findUnique({
      where: { id },
      include: { signups: true },
    });
    if (!a) throw new NotFoundException('活动不存在');
    if (a.status === 'cancelled') throw new BadRequestException('活动已取消');
    if (a.status === 'closed') throw new BadRequestException('活动已结束');
    if (a.organizerId === uid) throw new BadRequestException('您是发起人，无需报名');
    if (a.signups.some((s) => s.userId === uid))
      throw new BadRequestException('您已报名');
    if (a.maxParticipants != null && a.signups.length >= a.maxParticipants)
      throw new BadRequestException('名额已满');
    await this.prisma.activitySignup.create({
      data: { activityId: id, userId: uid, note: note?.trim() || null },
    });
    const count = a.signups.length + 1;
    if (a.maxParticipants != null && count >= a.maxParticipants && a.status === 'open') {
      await this.prisma.activity.update({ where: { id }, data: { status: 'full' } });
    }
    const actor = await this.prisma.user.findUnique({ where: { id: uid } });
    await this.prisma.notification
      .create({
        data: {
          userId: a.organizerId,
          type: 'activity_signup',
          title: '有人报名了你的活动',
          body: `${actor?.nickname ?? '有人'} 报名了你的活动「${a.title}」`,
          actorId: uid,
          actorName: actor?.nickname ?? '',
          postId: id,
        },
      })
      .catch(() => undefined);
    return this.findOne(id, uid);
  }

  async cancelSignup(id: string, uid: string | null) {
    if (!uid) throw new ForbiddenException('请先登录');
    const a = await this.prisma.activity.findUnique({
      where: { id },
      include: { signups: true },
    });
    if (!a) throw new NotFoundException('活动不存在');
    const mine = a.signups.find((s) => s.userId === uid);
    if (!mine) throw new BadRequestException('您还没有报名');
    await this.prisma.activitySignup.delete({ where: { id: mine.id } });
    if (a.status === 'full') {
      await this.prisma.activity.update({ where: { id }, data: { status: 'open' } });
    }
    return this.findOne(id, uid);
  }

  async cancel(id: string, uid: string | null) {
    if (!uid) throw new ForbiddenException('请先登录');
    const a = await this.prisma.activity.findUnique({
      where: { id },
      include: { signups: true },
    });
    if (!a) throw new NotFoundException('活动不存在');
    if (a.organizerId !== uid) throw new ForbiddenException('只有发起人可以取消');
    await this.prisma.activity.update({ where: { id }, data: { status: 'cancelled' } });
    for (const s of a.signups) {
      await this.prisma.notification
        .create({
          data: {
            userId: s.userId,
            type: 'activity_cancel',
            title: '活动已取消',
            body: `你报名的活动「${a.title}」已被发起人取消`,
            actorId: uid,
            postId: id,
          },
        })
        .catch(() => undefined);
    }
    return { ok: true };
  }

  async mine(uid: string | null) {
    if (!uid) throw new ForbiddenException('请先登录');
    const organized = await this.prisma.activity.findMany({
      where: { organizerId: uid, status: { not: 'cancelled' } },
      orderBy: { startAt: 'asc' },
      include: { organizer: true, signups: true },
    });
    const joinedSignups = await this.prisma.activitySignup.findMany({
      where: { userId: uid },
      orderBy: { createdAt: 'desc' },
      include: { activity: { include: { organizer: true, signups: true } } },
    });
    const joined = joinedSignups
      .map((s) => s.activity)
      .filter((a) => a && a.status !== 'cancelled');
    return {
      organized: organized.map((a) => this.shapeLite(a, uid)),
      joined: joined.map((a) => this.shapeLite(a, uid)),
    };
  }
}
