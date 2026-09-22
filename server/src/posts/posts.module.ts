import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { LevelsModule } from '../levels/levels.module.js';
import { PointsModule } from '../points/points.module.js';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';

@Module({
  imports: [AuthModule, LevelsModule, PointsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
