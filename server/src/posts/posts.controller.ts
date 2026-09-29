import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
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
  findAll(@Req() req: Request, @Query('category') category?: string, @Query('q') q?: string, @Query('limit') limit?: string, @Query('offset') offset?: string, @Query('city') city?: string) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.findAll(category, uid, q, limit ? Number(limit) : undefined, offset ? Number(offset) : undefined, city);
  }

  @Get('hot-keywords')
  hotKeywords() {
    return this.posts.hotKeywords();
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

  @Get('liked')
  liked(@Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.myLikes(uid);
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CreatePostDto, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    return this.posts.updatePost(id, dto, uid);
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
