import { Module } from '@nestjs/common';
import { LevelsController } from './levels.controller.js';
import { LevelsService } from './levels.service.js';

@Module({
  controllers: [LevelsController],
  providers: [LevelsService],
  exports: [LevelsService],
})
export class LevelsModule {}
