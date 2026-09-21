import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { PostsService, type CreatePostDto } from './posts.service.js';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly posts: PostsService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.posts.findAll(category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.posts.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePostDto, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.create(dto, uid);
  }

  @Get(':id/comments')
  comments(@Param('id') id: string) {
    return this.posts.listComments(id);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() body: { content?: string }, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.addComment(id, body?.content ?? '', uid);
  }
}
