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

  @Post('users/:id/verify')
  async setVerified(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.setUserVerified(id, !!body?.on);
  }

  // ── 포인트 규칙 설정 ──
  @Get('point-config')
  async pointConfig(@Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.pointConfig();
  }

  @Post('point-config/:key')
  async setPointConfig(@Param('key') key: string, @Body() body: any, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.setPointConfig(key, Number(body?.value));
  }

  @Post('broadcast')
  async broadcast(@Body() body: any, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.broadcast(body?.body, body?.title, body?.userId || undefined);
  }

  // ── 레벨 칭호 + 승급 임계값 ──
  @Get('levels')
  async levels(@Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.levelTitles();
  }

  @Post('levels/:level')
  async setLevelTitle(@Param('level') level: string, @Body() body: any, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.setLevelTitle(
      Number(level),
      body?.name,
      body?.minPoints !== undefined ? Number(body.minPoints) : undefined,
    );
  }

  @Get('posts')
  async posts(@Req() req: Request, @Query() query: any) {
    await this.requireAdmin(req);
    return this.admin.posts({
      q: typeof query?.q === 'string' ? query.q : '',
      status: typeof query?.status === 'string' ? query.status : 'all',
      category: typeof query?.category === 'string' ? query.category : 'all',
      flag: typeof query?.flag === 'string' ? query.flag : 'all',
      skip: query?.skip ? parseInt(query.skip, 10) : 0,
      take: query?.take ? parseInt(query.take, 10) : 20,
    });
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

  @Post('posts/:id/quality')
  async setQuality(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.setQuality(id, !!body?.on);
  }

  @Post('posts/:id/pin')
  async setPin(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.admin.setPin(id, !!body?.on);
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
