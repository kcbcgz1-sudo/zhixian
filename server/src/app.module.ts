import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { PostsModule } from './posts/posts.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UploadsModule } from './uploads/uploads.module.js';

@Module({
  imports: [PrismaModule, AuthModule, PostsModule, UploadsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
