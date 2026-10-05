import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  private shape(b: any) {
    return {
      id: b.id,
      image: b.image,
      title: b.title ?? '',
      link: b.link ?? '',
      placement: b.placement,
      active: b.active,
      sort: b.sort,
      createdAt: b.createdAt,
    };
  }

  // 공개: 특정 위치의 노출 배너
  async publicList(placement: string) {
    const p = placement && placement.trim() ? placement.trim() : 'home';
    const rows = await this.prisma.banner.findMany({
      where: { placement: p, active: true },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      take: 10,
    });
    return rows.map((b) => this.shape(b));
  }

  // 관리자: 전체
  async adminList() {
    const rows = await this.prisma.banner.findMany({
      orderBy: [{ placement: 'asc' }, { sort: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map((b) => this.shape(b));
  }

  async create(data: any) {
    const image = String(data?.image ?? '').trim();
    if (!image) throw new BadRequestException('请先上传图片');
    const b = await this.prisma.banner.create({
      data: {
        image,
        title: data?.title ? String(data.title).slice(0, 60) : null,
        link: data?.link ? String(data.link).slice(0, 300) : null,
        placement: data?.placement ? String(data.placement) : 'home',
        active: data?.active === undefined ? true : !!data.active,
        sort: Number.isFinite(Number(data?.sort)) ? Number(data.sort) : 0,
      },
    });
    return this.shape(b);
  }

  async update(id: string, data: any) {
    const exist = await this.prisma.banner.findUnique({ where: { id } });
    if (!exist) throw new NotFoundException('不存在');
    const patch: any = {};
    if (data?.image !== undefined) patch.image = String(data.image).trim();
    if (data?.title !== undefined) patch.title = data.title ? String(data.title).slice(0, 60) : null;
    if (data?.link !== undefined) patch.link = data.link ? String(data.link).slice(0, 300) : null;
    if (data?.placement !== undefined) patch.placement = String(data.placement);
    if (data?.active !== undefined) patch.active = !!data.active;
    if (data?.sort !== undefined) patch.sort = Number(data.sort) || 0;
    const b = await this.prisma.banner.update({ where: { id }, data: patch });
    return this.shape(b);
  }

  async remove(id: string) {
    await this.prisma.banner.deleteMany({ where: { id } });
    return { ok: true };
  }
}
