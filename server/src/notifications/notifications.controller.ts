import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notif: NotificationsService,
    private readonly auth: AuthService,
  ) {}

  private uid(req: Request): string {
    const u = this.auth.verifyToken(req.headers['authorization']);
    if (!u) throw new ForbiddenException('请先登录');
    return u;
  }

  @Get()
  list(@Req() req: Request, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.notif.list(this.uid(req), limit ? Number(limit) : undefined, offset ? Number(offset) : undefined);
  }

  @Get('unread-count')
  unread(@Req() req: Request) {
    return this.notif.unreadCount(this.uid(req));
  }

  @Post('read-all')
  readAll(@Req() req: Request) {
    return this.notif.markAll(this.uid(req));
  }

  @Post('dm')
  dm(@Body() body: any, @Req() req: Request) {
    return this.notif.sendDm(this.uid(req), body?.toUserId, body?.body);
  }

  @Post(':id/read')
  read(@Param('id') id: string, @Req() req: Request) {
    return this.notif.markRead(id, this.uid(req));
  }
}
