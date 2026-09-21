import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { AdminService } from './admin.service.js';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly auth: AuthService,
  ) {}

  // 관리자 권한 확인 (토큰 → role === 'admin')
  private async requireAdmin(req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    if (!uid) throw new ForbiddenException('unauthorized');
    const me = await this.auth.me(uid);
    if (me.role !== 'admin') throw new ForbiddenException('admin only');
  }

  @Get('stats')
  async stats(@Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.stats();
  }

  @Get('users')
  async users(@Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.users();
  }

  @Post('users/:id/ban')
  async ban(@Param('id') id: string, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.setUserStatus(id, 'banned');
  }

  @Post('users/:id/unban')
  async unban(@Param('id') id: string, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.setUserStatus(id, 'active');
  }

  @Post('users/:id/level')
  async setLevel(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.setUserLevel(id, Number(body?.level));
  }

  @Get('posts')
  async posts(@Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.posts();
  }

  @Post('posts/:id/remove')
  async remove(@Param('id') id: string, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.setPostStatus(id, PostStatus.removed);
  }

  @Post('posts/:id/restore')
  async restore(@Param('id') id: string, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.setPostStatus(id, PostStatus.published);
  }

  @Delete('posts/:id')
  async del(@Param('id') id: string, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.deletePost(id);
  }

  // ── 카테고리 관리 ──
  @Get('categories')
  async categories(@Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.categoriesAll();
  }

  @Post('categories')
  async createCategory(@Body() body: any, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.createCategory(body);
  }

  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.updateCategory(id, body);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.deleteCategory(id);
  }
}
