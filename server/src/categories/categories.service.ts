import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// 최초 1회 시드: 기존 글의 category 값(fishing/hiking/stay)과 code 일치
const DEFAULTS = [
  { code: 'hiking', name: '登山', sort: 1 },
  { code: 'fishing', name: '钓鱼', sort: 2 },
  { code: 'stay', name: '短租', sort: 3 },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.category.count();
    if (count === 0) {
      for (const c of DEFAULTS) {
        await this.prisma.category.create({ data: c });
      }
    }
  }

  async listActive() {
    const cats = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    });
    return cats.map((c) => ({
      code: c.code,
      name: c.name,
      sort: c.sort,
      writeMinLevel: c.writeMinLevel,
      commentMinLevel: c.commentMinLevel,
    }));
  }
}
