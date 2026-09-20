import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PostsService, type CreatePostDto } from './posts.service.js';

// GET /api/posts , GET /api/posts/:id , POST /api/posts
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

  @Post()
  create(@Body() dto: CreatePostDto) {
    return this.posts.create(dto);
  }
}
