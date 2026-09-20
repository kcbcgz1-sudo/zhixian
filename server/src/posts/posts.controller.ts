import { Controller, Get, Param, Query } from '@nestjs/common';
import { PostsService } from './posts.service.js';

// 라우트: GET /api/posts , GET /api/posts/:id
@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.posts.findAll(category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.posts.findOne(id);
  }
}
