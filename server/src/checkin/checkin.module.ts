import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PointsModule } from '../points/points.module.js';
import { CheckinController } from './checkin.controller.js';
import { CheckinService } from './checkin.service.js';

@Module({
  imports: [AuthModule, PointsModule],
  controllers: [CheckinController],
  providers: [CheckinService],
})
export class CheckinModule {}
