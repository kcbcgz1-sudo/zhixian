import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const DEFAULTS: Record<number, string> = {
  1: '新人',
  2: '常客',
  3: '熟人',
  4: '老友',
  5: '达人',
  6: '高手',
  7: '元老',
  8: '宗师',
  9: '传奇',
  10: '泰斗',
};

@Injectable()
export class LevelsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (let lv = 1; lv <= 10; lv++) {
      await this.prisma.levelTitle.upsert({
        where: { level: lv },
        update: {},
        create: { level: lv, name: DEFAULTS[lv] },
      });
    }
  }

  async list() {
    const rows = await this.prisma.levelTitle.findMany({ orderBy: { level: 'asc' } });
    return rows.map((r) => ({ level: r.level, name: r.name }));
  }

  async titleFor(level: number): Promise<string> {
    const lv = Math.max(1, Math.min(10, level || 1));
    const r = await this.prisma.levelTitle.findUnique({ where: { level: lv } });
    return r?.name ?? DEFAULTS[lv] ?? '新人';
  }
}
