import { Body, Controller, ForbiddenException, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { AiService } from './ai.service.js';

@Controller('admin/ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly auth: AuthService,
  ) {}

  private async requireAdmin(req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    if (!uid) throw new ForbiddenException('unauthorized');
    const me = await this.auth.me(uid);
    if (me.role !== 'admin') throw new ForbiddenException('admin only');
  }

  @Get('status')
  async status(@Req() req: Request) {
    await this.requireAdmin(req);
    return { hasKey: this.ai.hasKey() };
  }

  @Post('draft')
  async draft(@Body() b: { topic?: string; category?: string; city?: string }, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.ai.generateDraft(b?.topic || '', b?.category, b?.city);
  }

  @Post('image')
  async image(@Body() b: { prompt?: string }, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.ai.generateImage(b?.prompt || '');
  }
}
