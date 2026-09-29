import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AiController } from './ai.controller.js';
import { AiPublicController } from './ai-public.controller.js';
import { AiService } from './ai.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AiController, AiPublicController],
  providers: [AiService],
})
export class AiModule {}
