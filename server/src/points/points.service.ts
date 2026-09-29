import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// 관리자에서 수정 가능한 포인트 규칙 기본값
export const DEFAULT_CONFIG: Record<string, number> = {
  post_create: 100, // 글작성 (원글 작성자)
  like: 1, // 좋아요 (원글 작성자)
  comment_author: 1, // 댓글 (원글 작성자)
  comment_commenter: 1, // 댓글 (댓글 작성자)
  favorite: 10, // 즐겨찾기 (원글 작성자)
  checkin: 5, // 每日签到 (每日 1회, 연속일수 보너스는 별도)
  quality: 100, // 干货 선정 (원글 작성자)
  quality_min_likes: 100, // 干货 지정 가능 최소 좋아요 수(적립 아님, 게이팅용)
};

// 레벨별 승급 임계값 기본값 (관리자에서 수정 가능)
const DEFAULT_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 300,
  4: 700,
  5: 1500,
  6: 3000,
  7: 6000,
  8: 12000,
  9: 25000,
  10: 50000,
};

// 실제 점수 적립 대상 reason (게이팅/내부 키 제외)
const AWARD_KEYS = new Set([
  'post_create',
  'like',
  'comment_author',
  'comment_commenter',
  'favorite',
  'quality',
  'checkin',
]);

@Injectable()
export class PointsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
      await this.prisma.pointConfig.upsert({ where: { key }, update: {}, create: { key, value } });
    }
    // 레벨 임계값은 최초 1회만 seed (관리자 수정 보존)
    const seeded = await this.prisma.pointConfig.findUnique({ where: { key: '_thresholds_seeded' } });
    if (!seeded) {
      for (const [lv, min] of Object.entries(DEFAULT_THRESHOLDS)) {
        await this.prisma.levelTitle
          .update({ where: { level: Number(lv) }, data: { minPoints: min } })
          .catch(() => {});
      }
      await this.prisma.pointConfig.create({ data: { key: '_thresholds_seeded', value: 1 } });
    }
  }

  // 관리자 노출용 config (내부 '_' 키 제외)
  async config(): Promise<Record<string, number>> {
    const rows = await this.prisma.pointConfig.findMany();
    const out: Record<string, number> = { ...DEFAULT_CONFIG };
    for (const r of rows) if (!r.key.startsWith('_')) out[r.key] = r.value;
    return out;
  }

  async value(key: string): Promise<number> {
    const r = await this.prisma.pointConfig.findUnique({ where: { key } });
    return r?.value ?? DEFAULT_CONFIG[key] ?? 0;
  }

  async setConfig(key: string, value: number) {
    if (key.startsWith('_') || !(key in DEFAULT_CONFIG)) return { ok: false };
    const v = Math.max(0, Math.trunc(Number(value) || 0));
    await this.prisma.pointConfig.upsert({
      where: { key },
      update: { value: v },
      create: { key, value: v },
    });
    return { ok: true, key, value: v };
  }

  private async applyDelta(userId: string, change: number, reason: string, refId: string) {
    if (!change) return;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const newPoints = Math.max(0, (user.points ?? 0) + change);
    await this.prisma.user.update({ where: { id: userId }, data: { points: newPoints } });
    // 원장에는 의도한 change 기록(회수 정확도), balanceAfter는 실제 잔액
    await this.prisma.pointsLedger.create({
      data: { userId, change, reason, refId, balanceAfter: newPoints },
    });
    await this.maybePromote(userId, newPoints);
  }

  // 적립: reason의 현재 config 값만큼 +
  async award(userId: string | null | undefined, reason: string, refId: string) {
    if (!userId || !AWARD_KEYS.has(reason)) return;
    const v = await this.value(reason);
    if (v > 0) await this.applyDelta(userId, v, reason, refId);
  }

  // 회수: 해당 (userId, reason, refId) 원장 순합이 +이면 그만큼 -
  async revert(userId: string | null | undefined, reason: string, refId: string) {
    if (!userId || !AWARD_KEYS.has(reason)) return;
    const agg = await this.prisma.pointsLedger.aggregate({
      where: { userId, reason, refId },
      _sum: { change: true },
    });
    const net = agg._sum.change ?? 0;
    if (net > 0) await this.applyDelta(userId, -net, reason, refId);
  }

  // 포인트 기반 레벨 자동 승급(올라가기만, 강등 없음)
  private async maybePromote(userId: string, points: number) {
    const levels = await this.prisma.levelTitle.findMany({ orderBy: { level: 'asc' } });
    let target = 1;
    for (const l of levels) {
      const min = (l as any).minPoints ?? 0;
      if (points >= min) target = l.level;
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && target > (user.level ?? 1)) {
      await this.prisma.user.update({ where: { id: userId }, data: { level: target } });
      const lt = levels.find((l) => l.level === target);
      await this.prisma.notification
        .create({
          data: {
            userId,
            type: 'levelup',
            title: '等级提升',
            body: `恭喜升到 Lv${target}${lt?.name ? ' ' + lt.name : ''}！`,
          },
        })
        .catch(() => {});
    }
  }
}
