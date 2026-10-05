import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { BannersService } from './banners.service.js';

@Controller()
export class BannersController {
  constructor(
    private readonly banners: BannersService,
    private readonly auth: AuthService,
  ) {}

  private async requireAdmin(req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    if (!uid) throw new ForbiddenException('unauthorized');
    const me = await this.auth.me(uid);
    if (me.role !== 'admin') throw new ForbiddenException('admin only');
  }

  // 공개
  @Get('banners')
  list(@Query('placement') placement?: string) {
    return this.banners.publicList(placement ?? 'home');
  }

  // 관리자
  @Get('admin/banners')
  async adminList(@Req() req: Request) {
    await this.requireAdmin(req);
    return this.banners.adminList();
  }

  @Post('admin/banners')
  async create(@Body() body: any, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.banners.create(body);
  }

  @Patch('admin/banners/:id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.banners.update(id, body);
  }

  @Delete('admin/banners/:id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.banners.remove(id);
  }
}
