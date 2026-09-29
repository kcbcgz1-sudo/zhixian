import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { ActivitiesService, type CreateActivityDto } from './activities.service.js';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activities: ActivitiesService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  findAll(
    @Req() req: Request,
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.activities.findAll(
      uid,
      city,
      category,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }

  @Get('mine')
  mine(@Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.activities.mine(uid);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.activities.findOne(id, uid);
  }

  @Post()
  create(@Body() dto: CreateActivityDto, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.activities.create(dto, uid);
  }

  @Post(':id/signup')
  signup(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Req() req: Request,
  ) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.activities.signup(id, uid, body?.note);
  }

  @Delete(':id/signup')
  cancelSignup(@Param('id') id: string, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.activities.cancelSignup(id, uid);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.activities.cancel(id, uid);
  }
}
