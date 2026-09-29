import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module.js';
import { ActivitiesModule } from './activities/activities.module.js';
import { CheckinModule } from './checkin/checkin.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { LevelsModule } from './levels/levels.module.js';
import { PointsModule } from './points/points.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PostsModule } from './posts/posts.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UploadsModule } from './uploads/uploads.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CategoriesModule,
    LevelsModule,
    PointsModule,
    NotificationsModule,
    PostsModule,
    UploadsModule,
    AdminModule,
    ActivitiesModule,
    CheckinModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
