import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
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

  @Get('mine')
  mine(@Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.myPosts(uid);
  }

  @Get('favorites')
  favorites(@Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.myFavorites(uid);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.findOne(id, uid);
  }

  @Delete(':id')
  del(@Param('id') id: string, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.deleteOwnPost(id, uid);
  }

  @Post()
  create(@Body() dto: CreatePostDto, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.create(dto, uid);
  }

  @Get(':id/comments')
  comments(@Param('id') id: string, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.listComments(id, uid);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() body: { content?: string }, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.addComment(id, body?.content ?? '', uid);
  }

  @Delete(':id/comments/:commentId')
  delComment(@Param('commentId') commentId: string, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.deleteComment(commentId, uid);
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
