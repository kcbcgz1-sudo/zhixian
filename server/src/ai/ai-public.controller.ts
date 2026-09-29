import { Body, Controller, ForbiddenException, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { AiService } from './ai.service.js';

// 회원용 AI (로그인만 필요, 관리자 아님)
@Controller('ai')
export class AiPublicController {
  constructor(
    private readonly ai: AiService,
    private readonly auth: AuthService,
  ) {}

  @Post('assist')
  async assist(
    @Body() b: { input?: string; category?: string; city?: string },
    @Req() req: Request,
  ) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    if (!uid) throw new ForbiddenException('请先登录');
    return this.ai.assist(uid, b?.input || '', b?.category, b?.city);
  }
}
