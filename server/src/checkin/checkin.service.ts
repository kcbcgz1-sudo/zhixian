import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PointsService } from '../points/points.service.js';

function shanghaiDay(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}
function prevDay(day: string): string {
  const [y, m, dd] = day.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, dd));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

@Injectable()
export class CheckinService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
  ) {}

  private computeStreak(days: Set<string>, today: string): number {
    let anchor = today;
    if (!days.has(anchor)) anchor = prevDay(today);
    let streak = 0;
    let cur = anchor;
    while (days.has(cur)) {
      streak++;
      cur = prevDay(cur);
    }
    return streak;
  }

  async status(uid: string | null) {
    const points = await this.points.value('checkin');
    if (!uid) return { checkedToday: false, streak: 0, total: 0, points };
    const today = shanghaiDay();
    const rows = await this.prisma.checkIn.findMany({
      where: { userId: uid },
      select: { day: true },
    });
    const days = new Set(rows.map((r) => r.day));
    return {
      checkedToday: days.has(today),
      streak: this.computeStreak(days, today),
      total: days.size,
      points,
      today,
      days: [...days].sort(),
    };
  }

  async checkin(uid: string | null) {
    if (!uid) throw new ForbiddenException('请先登录');
    const today = shanghaiDay();
    const existing = await this.prisma.checkIn.findUnique({
      where: { userId_day: { userId: uid, day: today } },
    });
    if (existing) {
      const st = await this.status(uid);
      return { ...st, already: true, gained: 0 };
    }
    await this.prisma.checkIn.create({ data: { userId: uid, day: today } });
    await this.points.award(uid, 'checkin', today);
    const st = await this.status(uid);
    return { ...st, already: false, gained: st.points };
  }
}
