import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { AutogenService } from './autogen.service.js';

@Controller('admin/autogen')
export class AutogenController {
  constructor(
    private readonly svc: AutogenService,
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
    return this.svc.status();
  }

  @Post('toggle')
  async toggle(@Body() b: { enabled?: boolean }, @Req() req: Request) {
    await this.requireAdmin(req);
    return { enabled: await this.svc.setEnabled(!!b?.enabled) };
  }

  @Post('run')
  async run(@Req() req: Request) {
    await this.requireAdmin(req);
    return this.svc.runOnce();
  }

  @Get('pending')
  async pending(@Req() req: Request) {
    await this.requireAdmin(req);
    return this.svc.listPending();
  }

  @Post('publish/:id')
  async publish(@Param('id') id: string, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.svc.publish(id);
  }

  @Post('edit/:id')
  async edit(@Param('id') id: string, @Body() b: { title?: string; body?: string }, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.svc.editContent(id, b?.title, b?.body);
  }

  @Post('publish-all')
  async publishAll(@Req() req: Request) {
    await this.requireAdmin(req);
    return this.svc.publishAll();
  }

  @Delete(':id')
  async discard(@Param('id') id: string, @Req() req: Request) {
    await this.requireAdmin(req);
    return this.svc.discard(id);
  }
}
