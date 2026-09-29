import { Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { CheckinService } from './checkin.service.js';

@Controller('checkin')
export class CheckinController {
  constructor(
    private readonly checkin: CheckinService,
    private readonly auth: AuthService,
  ) {}

  @Get('status')
  status(@Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.checkin.status(uid);
  }

  @Post()
  doCheckin(@Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.checkin.checkin(uid);
  }
}
