import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { SocialService } from './social.service.js';

@Controller('social')
export class SocialController {
  constructor(
    private readonly social: SocialService,
    private readonly auth: AuthService,
  ) {}

  private uid(req: Request): string {
    const u = this.auth.verifyToken(req.headers['authorization']);
    if (!u) throw new ForbiddenException('请先登录');
    return u;
  }
  private optUid(req: Request): string | null {
    return this.auth.verifyToken(req.headers['authorization']) || null;
  }

  // 팔로우
  @Post('follow/:id')
  follow(@Param('id') id: string, @Req() req: Request) {
    return this.social.follow(this.uid(req), id);
  }
  @Delete('follow/:id')
  unfollow(@Param('id') id: string, @Req() req: Request) {
    return this.social.unfollow(this.uid(req), id);
  }
  @Get('relation/:id')
  relation(@Param('id') id: string, @Req() req: Request) {
    return this.social.relation(this.optUid(req), id);
  }
  @Get('following')
  following(@Req() req: Request) {
    return this.social.myFollowing(this.uid(req));
  }

  // 채팅
  @Post('chat/with')
  chatWith(@Body() body: any, @Req() req: Request) {
    return this.social.getOrCreateConversation(this.uid(req), body?.userId);
  }
  @Get('chat/conversations')
  conversations(@Req() req: Request) {
    return this.social.listConversations(this.uid(req));
  }
  @Get('chat/unread')
  unread(@Req() req: Request) {
    return this.social.unreadTotal(this.uid(req));
  }
  @Get('chat/:id/messages')
  messages(@Param('id') id: string, @Query('limit') limit: string, @Req() req: Request) {
    return this.social.getMessages(this.uid(req), id, limit ? Number(limit) : undefined);
  }
  @Post('chat/:id/messages')
  send(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    return this.social.sendMessage(this.uid(req), id, body?.body);
  }
  @Post('chat/:id/read')
  read(@Param('id') id: string, @Req() req: Request) {
    return this.social.markRead(this.uid(req), id);
  }
}
