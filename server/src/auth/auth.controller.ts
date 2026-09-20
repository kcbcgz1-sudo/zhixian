import { Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: { username: string; email: string; password: string; nickname?: string }) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: { account: string; password: string }) {
    return this.auth.login(dto);
  }

  @Get('me')
  me(@Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    if (!uid) throw new UnauthorizedException();
    return this.auth.me(uid);
  }
}
