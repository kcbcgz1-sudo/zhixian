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
  findAll(@Req() req: Request, @Query('category') category?: string) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.findAll(category, uid);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.findOne(id, uid);
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

  @Post(':id/like')
  like(@Param('id') id: string, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.like(id, uid);
  }

  @Post(':id/favorite')
  favorite(@Param('id') id: string, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.favorite(id, uid);
  }
}
